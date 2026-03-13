'use server';

import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendEmail, emailTemplates } from '@/lib/mail';
import { createNotification } from '@/lib/actions/notification';
import { getBaseUrl } from '@/lib/server-utils';

// Lazy Razorpay initialization to catch missing env vars gracefully
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay API keys are missing in the server environment.");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export async function createRazorpayOrder({ amount, currency = "INR", receipt }) {
    try {
        const rzp = getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: currency || "INR",
            receipt: receipt || `receipt_${Date.now()}`
        };

        const order = await rzp.orders.create(options);
        // Ensure the order is serializable for Next.js Server Actions
        return { success: true, order: JSON.parse(JSON.stringify(order)) };
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return { success: false, error: error.message || String(error) };
    }
}

export async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;
    return isAuthentic;
}

export async function processCheckout({ userId, planId, cartItems, billingDetails, totalAmount, paymentId, orderId, signature, couponCode }) {
    await connectDB();
    const Coupon = (await import('@/models/Coupon')).default;

    try {
        // Verify payment signature if provided (for online payments)
        if (paymentId && orderId && signature) {
            const isValid = await verifyPayment({
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature
            });

            if (!isValid) {
                throw new Error('Payment verification failed');
            }
        }

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Security check: Only clients can purchase
        if (user.role !== 'client') {
            throw new Error('Administrators cannot process purchases. Please use a client account.');
        }

        let invoiceItems = [];
        let newPlan = null;
        let subscribedServices = [];

        // 1. Process Plan
        if (planId) {
            const PricingPlan = (await import('@/models/PricingPlan')).default;
            const planDetails = await PricingPlan.findOne({
                $or: [{ planId: planId }, { _id: mongoose.isValidObjectId(planId) ? planId : null }]
            }).lean();

            newPlan = planId;
            const planName = planDetails?.name || planId.charAt(0).toUpperCase() + planId.slice(1);
            let periodDisplay = planDetails?.period || "";
            if (periodDisplay && !periodDisplay.startsWith("(") && !periodDisplay.startsWith("/")) {
                periodDisplay = ` (${periodDisplay})`;
            }

            const planPriceStr = String(planDetails?.prices?.monthly || "0");
            const parsedPrice = parseFloat(planPriceStr.replace(/[^0-9.]/g, '')) || 0;

            // Add to invoice
            invoiceItems.push({
                description: `${planName} Plan Subscription${periodDisplay}`,
                qty: 1,
                price: parsedPrice,
                total: parsedPrice
            });
        }

        // 2. Process Cart Items
        if (cartItems && cartItems.length > 0) {
            cartItems.forEach(item => {
                invoiceItems.push({
                    description: item.name,
                    qty: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity
                });

                subscribedServices.push({
                    serviceId: item.serviceId || item.id,
                    name: item.name,
                    price: item.price,
                    status: 'active',
                    subscribedDate: new Date(),
                    type: item.type || 'standard'
                });
            });
        }

        // 2.5 Process Coupon
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: 'active' });
            if (coupon) {
                // Calculate discount for invoice display
                let subtotalBeforeDiscount = invoiceItems.reduce((acc, item) => {
                    const price = parseFloat(String(item.total).replace(/[^0-9.]/g, '')) || 0;
                    return acc + price;
                }, 0);

                let discountAmount = 0;
                if (coupon.discountType === 'percentage') {
                    discountAmount = (subtotalBeforeDiscount * coupon.discountAmount) / 100;
                } else {
                    discountAmount = Math.min(coupon.discountAmount, subtotalBeforeDiscount);
                }

                if (discountAmount > 0) {
                    invoiceItems.push({
                        description: `Discount: ${coupon.code} (${coupon.discountType === 'percentage' ? coupon.discountAmount + '%' : 'Fixed'})`,
                        qty: 1,
                        price: -discountAmount,
                        total: -discountAmount
                    });

                    // Update coupon usage
                    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
                }
            }
        }

        // 3. Create Invoice using centralized createInvoice
        const { createInvoice } = await import('@/lib/actions/invoice');
        const invoiceResult = await createInvoice({
            client: {
                name: billingDetails.name,
                id: user._id,
                company: billingDetails.company,
                gstNo: billingDetails.gstNo,
                address: billingDetails.address,
                city: billingDetails.city,
                state: billingDetails.state,
                pincode: billingDetails.pincode,
                country: billingDetails.country || 'India'
            },
            items: invoiceItems,
            status: 'Paid',
            paymentMethod: paymentId ? 'Razorpay' : 'Online',
            date: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        if (!invoiceResult.success) {
            throw new Error(invoiceResult.error || 'Invoice creation failed');
        }

        const newInvoice = invoiceResult.invoice;
        const invoiceNumber = newInvoice.invoiceNumber;

        // 4. Update User Profile
        const updateData = {};
        if (newPlan) {
            updateData.plan = newPlan;
            const PricingPlan = (await import('@/models/PricingPlan')).default;
            const planDoc = await PricingPlan.findOne({
                $or: [{ planId: newPlan }, { _id: mongoose.isValidObjectId(newPlan) ? newPlan : null }]
            }).lean();
            if (planDoc?.supportType) {
                updateData.supportType = planDoc.supportType;
            }
        }

        if (subscribedServices.length > 0) {
            updateData.$push = { subscribedServices: { $each: subscribedServices } };
        }

        if (!user.phone && billingDetails.phone) updateData.phone = billingDetails.phone;
        if (!user.company && billingDetails.company) updateData.company = billingDetails.company;
        if (!user.gstNo && billingDetails.gstNo) updateData.gstNo = billingDetails.gstNo;
        if (!user.address && billingDetails.address) updateData.address = billingDetails.address;
        if (!user.city && billingDetails.city) updateData.city = billingDetails.city;
        if (!user.state && billingDetails.state) updateData.state = billingDetails.state;
        if (!user.pincode && billingDetails.pincode) updateData.pincode = billingDetails.pincode;

        await User.findByIdAndUpdate(userId, updateData);

        // 5. Send Email Notification
        const appUrl = await getBaseUrl();
        await sendEmail({
            to: billingDetails.email,
            subject: `Payment Successful - Invoice ${invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4CAF50;">Payment Successful</h1>
                        <p style="color: #666;">Thank you for your purchase!</p>
                    </div>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                        <p><strong>Amount Paid:</strong> ₹${totalAmount}</p>
                        <p><strong>Transaction ID:</strong> ${paymentId}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                    </div>

                    <p>Your subscription/services are now active. You can view your invoice and manage your services from your dashboard.</p>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${appUrl}/client/dashboard#Billing" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
                    </div>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 15px; text-align: center; font-size: 12px; color: #999;">
                        <p>Fakhri IT Services</p>
                    </div>
                </div>
            `,
            text: `Payment Successful for Invoice ${invoiceNumber}. Amount: ₹${totalAmount}. Transaction ID: ${paymentId}. View details in your dashboard.`
        });

        // 6. Create Dashboard Notification
        await createNotification({
            recipientId: userId,
            title: "Payment Successful",
            message: `Thank you! We received your payment of ₹${totalAmount} for Invoice ${invoiceNumber}.`,
            type: "success",
            link: "#Billing",
            skipEmail: true
        });

        // 7. Notify Super Admins
        const { notifySuperAdmins } = await import('@/lib/actions/admin');
        await notifySuperAdmins({
            title: "New Payment Received",
            message: `A payment of ₹${totalAmount} was received from ${billingDetails.name} (${billingDetails.company || 'N/A'}) for Invoice ${invoiceNumber}.`,
            type: "invoice",
            link: "#Sales",
            icon: "CreditCard",
            skipEmail: true
        });

        // Send email to Super Admins
        const superAdmins = await User.find({ role: 'super-admin' }).select('email');
        for (const sa of superAdmins) {
            await sendEmail({
                to: sa.email,
                ...emailTemplates.notification({
                    title: 'New Payment Received',
                    message: `A payment of ₹${totalAmount} was received from ${billingDetails.name} (${billingDetails.company || 'N/A'}) for Invoice ${invoiceNumber}.`,
                    link: `${await getBaseUrl()}/super-admin/dashboard?tab=Sales`
                })
            });
        }

        return { success: true, invoiceId: newInvoice._id, invoiceNumber };

    } catch (error) {
        console.error('Checkout error:', error);
        return { success: false, error: error.message };
    }
}
