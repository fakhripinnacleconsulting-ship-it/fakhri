"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import { getPricingPlans } from "@/lib/actions/content";
import { getUserById } from "@/lib/actions/user";
import { processCheckout, createRazorpayOrder, verifyPayment } from "@/lib/actions/checkout";
import { validateCoupon } from "@/lib/actions/coupon";
import { toast } from "sonner";
import { Loader2, ArrowRight, CheckCircle, ShieldCheck, Ticket, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";




function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status, update } = useSession();
    const { cartItems, totalAmount: cartTotal, clearCart } = useCart();

    const [planId, setPlanId] = useState(searchParams.get("plan"));
    const [planDetails, setPlanDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discount, setDiscount] = useState(0);

    // Upgrade discount from query params
    const upgradeDiscountAmount = parseFloat(searchParams.get("upgradeDiscount")) || 0;
    const currentPlanParam = searchParams.get("currentPlan") || "";
    const remainingDaysParam = parseInt(searchParams.get("remainingDays")) || 0;
    const remainingValueParam = parseFloat(searchParams.get("remainingValue")) || 0;
    const isUpgrade = upgradeDiscountAmount > 0;

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstNo: ""
    });
    const [profileLoaded, setProfileLoaded] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    // 1. Auth & Redirect Logic
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/login?role=client&callbackUrl=/checkout${planId ? `?plan=${planId}` : ''}`);
        } else if (status === "authenticated" && session?.user) {
            if (session.user.role !== 'client') {
                toast.error("Administrators cannot access checkout. Redirecting to dashboard...");
                const target = session.user.role === 'super-admin' ? '/super-admin/dashboard' : '/admin/dashboard';
                router.push(target);
            }
        }
    }, [status, session?.user?.role, router, planId]);

    // 2. Profile Fetching Logic
    useEffect(() => {
        const userId = session?.user?.id || session?.user?._id;

        if (status === "authenticated" && userId && !profileLoaded) {
            const fetchUserProfile = async () => {
                try {
                    const profile = await getUserById(userId);
                    if (profile) {
                        setFormData(prev => ({
                            ...prev,
                            name: profile.name || session.user.name || "",
                            email: profile.email || session.user.email || "",
                            phone: profile.phone || "",
                            company: profile.company || "",
                            address: profile.address || profile.location || "",
                            city: profile.city || "",
                            state: profile.state || "",
                            pincode: profile.pincode || "",
                            gstNo: profile.gstNo || ""
                        }));
                    } else {
                        // Fallback to session data if profile fetch fails
                        setFormData(prev => ({
                            ...prev,
                            name: session.user.name || "",
                            email: session.user.email || "",
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    // Fallback to session data
                    setFormData(prev => ({
                        ...prev,
                        name: session.user.name || "",
                        email: session.user.email || "",
                    }));
                } finally {
                    setProfileLoaded(true);
                }
            };

            fetchUserProfile();
        }
    }, [status, session?.user, profileLoaded]);

    useEffect(() => {
        const fetchPlan = async () => {
            if (planId) {
                try {
                    const plans = await getPricingPlans();
                    const selectedPlan = plans.find(p => p.planId === planId || p._id === planId);
                    if (selectedPlan) {
                        setPlanDetails(selectedPlan);
                    }
                } catch (error) {
                    console.error("Error fetching plan:", error);
                    toast.error("Failed to load plan details");
                }
            }
            setLoading(false);
        };
        fetchPlan();
    }, [planId]);

    const calculateTotals = () => {
        let subtotal = cartTotal;
        if (planDetails) {
            const planPrice = parseFloat((planDetails.prices?.monthly || "0").replace(/[^0-9.]/g, ''));
            subtotal += planPrice;
        }

        // Apply upgrade discount first, then coupon discount
        const afterUpgradeDiscount = Math.max(0, subtotal - upgradeDiscountAmount);
        const discountedSubtotal = Math.max(0, afterUpgradeDiscount - discount);
        const taxRate = 18;

        let cgst = 0, sgst = 0, igst = 0, utgst = 0;

        const UT_STATES = [
            "Andaman and Nicobar Islands",
            "Chandigarh",
            "Dadra and Nagar Haveli and Daman and Diu",
            "Ladakh",
            "Lakshadweep"
        ];

        const buyerStateName = formData.state || "";
        const isUT = UT_STATES.includes(buyerStateName);
        const isIntraState = buyerStateName.toLowerCase() === "madhya pradesh";

        // If no state selected yet or if it is MP, default to CGST+SGST
        if (isUT) {
            cgst = discountedSubtotal * (taxRate / 2) / 100;
            utgst = discountedSubtotal * (taxRate / 2) / 100;
        } else if (isIntraState || buyerStateName === "") {
            cgst = discountedSubtotal * (taxRate / 2) / 100;
            sgst = discountedSubtotal * (taxRate / 2) / 100;
        } else {
            igst = discountedSubtotal * taxRate / 100;
        }

        const totalTax = cgst + sgst + utgst + igst;
        const total = discountedSubtotal + totalTax;

        return { subtotal, discountedSubtotal, taxRate, cgst, sgst, utgst, igst, totalTax, total };
    };

    const { subtotal, discountedSubtotal, taxRate, cgst, sgst, utgst, igst, totalTax, total } = calculateTotals();

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        setIsApplyingCoupon(true);
        try {
            const result = await validateCoupon(couponCode, subtotal);
            if (result.success) {
                setAppliedCoupon(result.coupon);
                setDiscount(result.discount);
                toast.success(`Coupon "${result.coupon.code}" applied!`);
            } else {
                toast.error(result.error);
                setAppliedCoupon(null);
                setDiscount(0);
            }
        } catch (error) {
            toast.error("Failed to apply coupon");
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setDiscount(0);
        setCouponCode("");
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate all required fields
        const requiredFields = ['name', 'phone', 'company', 'address', 'city', 'state', 'pincode'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.error(`Please fill in all mandatory billing details: ${missingFields.join(', ')}`);
            return;
        }

        if (!privacyAccepted) {
            toast.error("Please accept the Privacy Policy, Terms & Conditions, and Refund Policy");
            return;
        }

        // GST Validation
        const gst = (formData.gstNo || "").trim().toUpperCase();
        if (gst && gst !== "NA" && gst.length !== 15) {
            toast.error("GST Number must be exactly 15 characters, or 'NA'");
            return;
        }

        const finalFormData = {
            ...formData,
            gstNo: gst || "NA"
        };

        setSubmitting(true);

        try {
            if (!session?.user?.id && !session?.user?._id) {
                toast.error("User ID missing. Please log in again.");
                setSubmitting(false);
                return;
            }

            if (total === 0) {
                try {
                    const result = await processCheckout({
                        userId: session.user.id || session.user._id,
                        planId: planDetails ? planDetails.planId : null,
                        cartItems: cartItems,
                        billingDetails: finalFormData,
                        totalAmount: 0,
                        paymentId: null,
                        orderId: null,
                        signature: null,
                        couponCode: appliedCoupon?.code,
                        upgradeDiscount: isUpgrade ? upgradeDiscountAmount : 0,
                        currentPlan: currentPlanParam
                    });

                    if (result.success) {
                        toast.success("Checkout successful!");
                        clearCart();
                        if (typeof update === 'function' && planDetails) {
                            await update({ plan: planDetails.planId });
                        }
                        router.push(`/client/dashboard?orderSuccess=true&invoice=${result.invoiceNumber}`);
                    } else {
                        toast.error(result.error || "Failed to process free checkout");
                    }
                } catch (err) {
                    console.error("Free checkout error:", err);
                    toast.error("Checkout failed. Please contact support.");
                } finally {
                    setSubmitting(false);
                }
                return;
            }

            if (!window.Razorpay) {
                // Try dynamically injecting script right now
                const scriptLoaded = await new Promise((resolve) => {
                    const scriptId = "razorpay-script-dynamic";
                    if (document.getElementById(scriptId)) {
                        let attempts = 0;
                        const interval = setInterval(() => {
                            attempts++;
                            if (window.Razorpay) {
                                clearInterval(interval);
                                resolve(true);
                            } else if (attempts > 30) {
                                clearInterval(interval);
                                resolve(false);
                            }
                        }, 100);
                        return;
                    }
                    const script = document.createElement("script");
                    script.src = "https://checkout.razorpay.com/v1/checkout.js";
                    script.id = scriptId;
                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);
                    document.body.appendChild(script);
                });

                if (!scriptLoaded || !window.Razorpay) {
                    toast.error("Razorpay SDK is still loading or got blocked by an adblocker.");
                    setSubmitting(false);
                    return;
                }
            }

            // 1. Create Razorpay Order
            const orderRes = await createRazorpayOrder({
                amount: total,
                currency: "INR",
                receipt: `receipt_${Date.now()}`
            });

            if (!orderRes || !orderRes.success) {
                toast.error(orderRes?.error || "Failed to create payment order. Please try again.");
                setSubmitting(false);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_S8nBupaDcI7xxs",
                amount: orderRes.order.amount,
                currency: orderRes.order.currency,
                name: "Fakhri IT Services",
                description: "Payment for order",
                image: "/favicon.ico",
                order_id: orderRes.order.id,
                handler: async function (response) {
                    try {
                        const result = await processCheckout({
                            userId: session.user.id || session.user._id,
                            planId: planDetails ? planDetails.planId : null,
                            cartItems: cartItems,
                            billingDetails: finalFormData,
                            totalAmount: total,
                            paymentId: response.razorpay_payment_id,
                            orderId: response.razorpay_order_id,
                            signature: response.razorpay_signature,
                            couponCode: appliedCoupon?.code,
                            upgradeDiscount: isUpgrade ? upgradeDiscountAmount : 0,
                            currentPlan: currentPlanParam
                        });

                        if (result.success) {
                            toast.success("Payment successful!");
                            clearCart();
                            if (typeof update === 'function' && planDetails) {
                                await update({ plan: planDetails.planId });
                            }
                            router.push(`/client/dashboard?orderSuccess=true&invoice=${result.invoiceNumber}`);
                        } else {
                            toast.error(result.error || "Failed to process order");
                        }
                    } catch (err) {
                        console.error("Post-payment processing failed:", err);
                        toast.error("Payment successful but failed to update order. Please contact support.");
                    } finally {
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone
                },
                notes: {
                    address: formData.address
                },
                theme: {
                    color: "#DC2626"
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                        toast.info("Payment cancelled.");
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on('payment.failed', function (response) {
                toast.error(response.error.description || "Payment failed");
                setSubmitting(false);
            });
            rzp1.open();

        } catch (error) {
            console.error("Checkout submission error:", error);
            toast.error("An unexpected error occurred");
            setSubmitting(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-heading text-gray-900">Checkout</h1>
                    <p className="mt-2 text-gray-600">Complete your secure payment to activate services.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column: Form */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Billing Details
                        </h2>
                        <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="john@example.com"
                                    disabled={!!session?.user?.email}
                                    className={session?.user?.email ? "bg-gray-50" : ""}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name</Label>
                                <Input
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Your Company Pvt Ltd"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Billing Address</Label>
                                <Input
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Street and Area Info"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="City Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="6-digit ZIP"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="state">State (GST Region)</Label>
                                <select
                                    id="state"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-50"
                                >
                                    <option value="">Select State</option>
                                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                    <option value="Assam">Assam</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Chandigarh">Chandigarh</option>
                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                    <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Goa">Goa</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                    <option value="Jharkhand">Jharkhand</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Ladakh">Ladakh</option>
                                    <option value="Lakshadweep">Lakshadweep</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Manipur">Manipur</option>
                                    <option value="Meghalaya">Meghalaya</option>
                                    <option value="Mizoram">Mizoram</option>
                                    <option value="Nagaland">Nagaland</option>
                                    <option value="Odisha">Odisha</option>
                                    <option value="Puducherry">Puducherry</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Sikkim">Sikkim</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Tripura">Tripura</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Uttarakhand">Uttarakhand</option>
                                    <option value="West Bengal">West Bengal</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gstNo">GST Number (Optional)</Label>
                                <Input
                                    id="gstNo"
                                    name="gstNo"
                                    value={formData.gstNo}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        if (val.length <= 15) {
                                            setFormData({ ...formData, gstNo: val });
                                        }
                                    }}
                                    placeholder="22AAAAA0000A1Z5 or NA"
                                    className="font-mono uppercase transition-all focus:border-primary"
                                />
                                <p className="text-[10px] text-muted-foreground italic">Important for GST Input Tax Credit. Size 15 for GST, or &quot;NA&quot; if not available.</p>
                            </div>
                        </form>

                        <div className="mt-8 pt-6 border-t">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                Payment Method
                            </h2>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-gray-900">Razorpay Secure</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Pay securely using Credit/Debit Card, UPI, Net Banking, or Wallets.
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] font-mono bg-white p-1 px-2 rounded border border-blue-200 text-blue-800">UPI</span>
                                            <span className="text-[10px] font-mono bg-white p-1 px-2 rounded border border-blue-200 text-blue-800">Cards</span>
                                            <span className="text-[10px] font-mono bg-white p-1 px-2 rounded border border-blue-200 text-blue-800">NetBanking</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:sticky lg:top-8 h-fit">
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-primary/10">
                            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                {/* Plan Item */}
                                {planDetails && (
                                    <div className="flex justify-between items-start py-2 border-b border-dashed">
                                        <div>
                                            <p className="font-medium text-gray-900">{planDetails.name} Plan</p>
                                            <p className="text-xs text-muted-foreground">
                                                {planDetails.period.toLowerCase().includes('month') ? 'Monthly Subscription' : `${planDetails.period} Plan`}
                                            </p>
                                            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded ${isUpgrade ? 'bg-green-50 text-green-600' : 'bg-primary/10 text-primary'}`}>
                                                {isUpgrade ? 'PLAN UPGRADE' : 'SUBSCRIPTION'}
                                            </span>
                                        </div>
                                        <p className="font-medium">{planDetails.prices?.monthly || "Custom"}</p>
                                    </div>
                                )}

                                {/* Cart Items */}
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start py-2 border-b border-dashed last:border-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{item.category} (x{item.quantity})</p>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                                                ADD-ON SERVICE
                                            </span>
                                        </div>
                                        <p className="font-medium">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                    </div>
                                ))}

                                {(!planDetails && cartItems.length === 0) && (
                                    <p className="text-center text-muted-foreground py-4 italic">Your cart is empty.</p>
                                )}
                            </div>

                            {/* Coupon Section */}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                {!appliedCoupon ? (
                                    <div className="space-y-3">
                                        <Label htmlFor="coupon" className="text-xs font-semibold text-gray-600 uppercase">Promo Code</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="coupon"
                                                placeholder="Enter code"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="uppercase font-mono bg-white"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={handleApplyCoupon}
                                                disabled={!couponCode || isApplyingCoupon}
                                                className="shrink-0"
                                            >
                                                {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-green-50 p-2 px-3 rounded-md border border-green-200">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-green-100 p-1.5 rounded-full">
                                                <Check className="h-3 w-3 text-green-600" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-green-700">{appliedCoupon.code}</span>
                                                <span className="text-[10px] text-green-600">Applied Successfully</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={removeCoupon}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Coupon Discount</span>
                                        <span>-₹{discount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {isUpgrade && upgradeDiscountAmount > 0 && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span className="flex items-center gap-1">
                                            <span>Upgrade Discount</span>
                                            <span className="text-[10px] text-green-500 font-normal">(75% of remaining value)</span>
                                        </span>
                                        <span>-₹{upgradeDiscountAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                )}
                                {igst > 0 ? (
                                    <div className="flex justify-between">
                                        <span>IGST ({taxRate}%)</span>
                                        <span>₹{igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    </div>
                                ) : utgst > 0 ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span>CGST ({taxRate / 2}%)</span>
                                            <span>₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>UTGST ({taxRate / 2}%)</span>
                                            <span>₹{utgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex justify-between">
                                            <span>CGST ({taxRate / 2}%)</span>
                                            <span>₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>SGST ({taxRate / 2}%)</span>
                                            <span>₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </>
                                )}
                            </div>

                            <Separator className="my-4" />

                            <div className="flex justify-between items-center mb-6">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-primary">₹{total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                    {discount > 1 && (
                                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">You saved ₹{discount.toLocaleString('en-IN')}!</p>
                                    )}
                                </div>
                            </div>

                            <div className="mb-6 flex items-start gap-2">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    checked={privacyAccepted}
                                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    required
                                />
                                <Label htmlFor="privacy" className="text-sm text-gray-600 leading-tight cursor-pointer">
                                    I agree to the <Link href="/privacy-policy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>, <Link href="/terms-conditions" target="_blank" className="text-primary hover:underline">Terms & Conditions</Link>, and <Link href="/refund-policy" target="_blank" className="text-primary hover:underline">Refund Policy</Link>.
                                </Label>
                            </div>

                            <Button
                                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                                type="submit"
                                form="checkout-form"
                                disabled={submitting || (!planDetails && cartItems.length === 0) || !privacyAccepted}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Pay Now <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>

                            <div className="mt-4 text-center">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Processed securely via Razorpay
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
