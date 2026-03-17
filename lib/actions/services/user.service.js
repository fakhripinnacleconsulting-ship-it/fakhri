'use server';

import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import ProfileUpdateRequest from '@/models/ProfileUpdateRequest';
import { createNotification } from '@/lib/actions/notification';
import { revalidatePath } from 'next/cache';
import { notifySuperAdmins } from './admin.service';

export async function getUsers({
    role = '',
    status = '',
    search = '',
    page = 1,
    limit = 1000,
    managerId = null
} = {}) {
    await connectDB();
    const skip = (page - 1) * limit;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (managerId) query.managerId = managerId;

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const users = await User.find(query)
            .sort({ joinedDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await User.countDocuments(query);

        return {
            users: JSON.parse(JSON.stringify(users)),
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { users: [], total: 0, pages: 0, error: 'Failed to fetch users' };
    }
}

export async function getUserById(id) {
    await connectDB();
    try {
        const user = await User.findById(id).lean();
        return user ? JSON.parse(JSON.stringify(user)) : null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

export async function getUserByEmail(email) {
    await connectDB();
    try {
        const user = await User.findOne({ email }).lean();
        return user ? JSON.parse(JSON.stringify(user)) : null;
    } catch (error) {
        console.error('Error fetching user by email:', error);
        return null;
    }
}

export async function updatePerformance(userId, performance) {
    await connectDB();
    try {
        const user = await User.findByIdAndUpdate(userId, {
            $set: { performance }
        }, { new: true }).lean();
        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error('Error updating performance:', error);
        return null;
    }
}

export async function updateUser(userId, data) {
    await connectDB();
    try {
        const user = await User.findByIdAndUpdate(userId, data, { new: true }).lean();
        return JSON.parse(JSON.stringify(user));
    } catch (error) {
        console.error('Error updating user:', error);
        return null;
    }
}

export async function updatePaymentMethod(userId, methodData) {
    await connectDB();
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (!user.paymentMethods) user.paymentMethods = [];

        // If this is the first method, make it default
        if (user.paymentMethods.length === 0) {
            methodData.isDefault = true;
        }

        if (methodData.isDefault) {
            user.paymentMethods.forEach(m => m.isDefault = false);
        }

        user.paymentMethods.push(methodData);
        await user.save();

        return { success: true, user: JSON.parse(JSON.stringify(user)) };
    } catch (error) {
        console.error('Error updating payment method:', error);
        return { success: false, error: error.message };
    }
}

export async function setDefaultPaymentMethod(userId, methodIndex) {
    await connectDB();
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (user.paymentMethods && user.paymentMethods[methodIndex]) {
            user.paymentMethods.forEach((m, idx) => {
                m.isDefault = idx === methodIndex;
            });
            await user.save();
            return { success: true, user: JSON.parse(JSON.stringify(user)) };
        }
        return { success: false, error: "Method not found" };
    } catch (error) {
        console.error('Error setting default payment method:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePaymentMethod(userId, methodIndex) {
    await connectDB();
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (user.paymentMethods && user.paymentMethods[methodIndex]) {
            const wasDefault = user.paymentMethods[methodIndex].isDefault;
            user.paymentMethods.splice(methodIndex, 1);

            // If we deleted the default, make the first one left the new default
            if (wasDefault && user.paymentMethods.length > 0) {
                user.paymentMethods[0].isDefault = true;
            }

            await user.save();
            return { success: true, user: JSON.parse(JSON.stringify(user)) };
        }
        return { success: false, error: "Method not found" };
    } catch (error) {
        console.error('Error deleting payment method:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Adds or updates subscribed services for a client and generates an invoice
 * @param {string} userId - The ID of the client
 * @param {Array} services - Array of service objects { serviceId, name, price, quantity, total }
 */
export async function addClientSubscribedServices(userId, services) {
    await connectDB();
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (user.role !== 'client') {
            throw new Error("Only clients can subscribe to services.");
        }

        if (!user.subscribedServices) {
            user.subscribedServices = [];
        }

        let totalInvoiceAmount = 0;
        const invoiceItems = [];

        services.forEach(newService => {
            const existingIndex = user.subscribedServices.findIndex(s => s.serviceId === newService.serviceId);
            if (existingIndex > -1) {
                user.subscribedServices[existingIndex].status = 'active';
                user.subscribedServices[existingIndex].subscribedDate = new Date();
            } else {
                user.subscribedServices.push({
                    serviceId: newService.serviceId,
                    name: newService.name,
                    status: 'active',
                    subscribedDate: new Date(),
                    type: newService.type || 'standard'
                });
            }

            // Prepare invoice items
            if (newService.price) {
                totalInvoiceAmount += newService.total || (newService.price * (newService.quantity || 1));
                invoiceItems.push({
                    description: newService.name,
                    qty: newService.quantity || 1,
                    price: String(newService.price),
                    total: String(newService.total || (newService.price * (newService.quantity || 1)))
                });
            }
        });

        await user.save();

        // Generate Invoice if there are items with price
        if (invoiceItems.length > 0) {
            const { createInvoice } = await import('@/lib/actions/invoice');
            await createInvoice({
                client: {
                    name: user.name,
                    company: user.company,
                    gstNo: user.gstNo,
                    address: user.address,
                    city: user.city,
                    state: user.state,
                    pincode: user.pincode,
                    country: user.country,
                    id: user._id
                },
                status: 'Paid',
                items: invoiceItems.map(item => ({
                    description: item.description,
                    qty: item.qty,
                    rate: Number(item.price) || 0,
                    amount: Number(item.total) || 0
                })),
                paymentMethod: user.paymentMethods?.find(m => m.isDefault)?.brand || 'Credit Card'
            });
        }

        const { createNotification } = await import('@/lib/actions/notification');
        const { notifySuperAdmins } = await import('@/lib/actions/admin');
        const { sendEmail, emailTemplates } = await import('@/lib/mail');

        // Notify Client - Matrix: Client (Yes/Yes)
        await createNotification({
            recipientId: userId,
            title: 'Services Updated',
            message: `Your services have been successfully updated. ${invoiceItems.length > 0 ? 'An invoice has been generated.' : ''}`,
            type: 'success',
            link: '#Dashboard',
            skipEmail: true
        });
        if (user.email) {
            await sendEmail({
                to: user.email,
                ...emailTemplates.notification({
                    title: 'Services Updated',
                    message: `Hello ${user.name}, your subscribed services have been updated. ${invoiceItems.length > 0 ? 'An invoice has been generated and is available in your dashboard.' : ''}`,
                    link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/client/dashboard#Billing`
                })
            });
        }

        // Notify Super Admins - Matrix: Super Admin (Yes / Mail)
        await notifySuperAdmins({
            title: 'Client Subscribed to Services',
            message: `${user.name} (${user.company || 'N/A'}) has subscribed to ${services.length} services. Total: ₹${totalInvoiceAmount}`,
            type: 'invoice',
            link: '#Sales',
            icon: 'CreditCard',
            skipEmail: true
        });
        const superAdmins = await User.find({ role: 'super-admin' }).select('email');
        for (const sa of superAdmins) {
            await sendEmail({
                to: sa.email,
                ...emailTemplates.notification({
                    title: 'New Subscription Received',
                    message: `${user.name} from ${user.company || 'N/A'} has subscribed to ${services.length} services. Total: ₹${totalInvoiceAmount}.`,
                    link: `${process.env.NEXT_PUBLIC_APP_URL || ''}/super-admin/dashboard?tab=Sales`
                })
            });
        }

        return { success: true, message: "Services updated and invoice generated" };
    } catch (error) {
        console.error("Error updating client services:", error);
        return { success: false, error: error.message };
    }
}

export async function submitProfileUpdateRequest(userId, newData) {
    await connectDB();
    try {
        const user = await User.findById(userId).lean();
        if (!user) throw new Error("User not found");

        const oldData = {
            name: user.name || "",
            phone: user.phone || "",
            company: user.company || "",
            location: user.location || ""
        };

        const existingPending = await ProfileUpdateRequest.findOne({
            $or: [{ user: userId }, { client: userId }],
            status: 'pending'
        });

        if (existingPending) {
            return { success: false, error: "You already have a pending profile update request." };
        }

        const requestData = {
            user: userId,
            client: userId, // Legacy support
            userName: user.name,
            userRole: user.role,
            oldData,
            newData,
            status: 'pending'
        };

        const request = await ProfileUpdateRequest.create(requestData);

        await notifySuperAdmins({
            title: 'Profile Update Request',
            message: `${user.name} (${user.role}) has requested to update their profile.`,
            type: 'warning',
            link: '/super-admin/dashboard?tab=responses&subtab=profile-updates'
        });

        revalidatePath('/super-admin/dashboard');
        return { success: true, id: request._id.toString() };
    } catch (error) {
        console.error('Error submitting profile update request:', error);
        return { success: false, error: error.message };
    }
}

export async function getProfileUpdateRequests() {
    await connectDB();
    try {
        const requests = await ProfileUpdateRequest.find()
            .sort({ createdAt: -1 })
            .lean();

        const normalized = requests.map(r => {
            const userObj = r.user || r.client;
            return {
                ...r,
                user: userObj,
                userName: r.userName || (userObj?.name || r.clientName || "Unknown"),
                userRole: r.userRole || (userObj?.role || "client"),
                newData: r.newData || {},
                oldData: r.oldData || {}
            };
        });

        return JSON.parse(JSON.stringify(normalized));
    } catch (error) {
        console.error('Error fetching profile update requests:', error);
        return [];
    }
}

export async function approveProfileUpdateRequest(requestId, updatedNewData, adminNotes = "") {
    await connectDB();
    try {
        const request = await ProfileUpdateRequest.findById(requestId);
        if (!request) throw new Error("Request not found");

        const userId = request.user || request.client;
        if (!userId) throw new Error("User ID not found in request record");

        const dataToUpdate = updatedNewData || request.newData;
        await User.findByIdAndUpdate(userId, dataToUpdate, { new: true });

        request.status = 'approved';
        request.adminNotes = adminNotes;
        if (updatedNewData) {
            request.newData = updatedNewData;
        }
        await request.save();

        await createNotification({
            recipientId: userId,
            title: 'Profile Updated',
            message: 'Your profile update request has been approved and applied.',
            type: 'success',
            link: request.userRole === 'admin' ? '/admin/dashboard?tab=Profile' : '/client/dashboard?tab=Profile'
        });

        revalidatePath('/super-admin/dashboard');
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');

        return { success: true };
    } catch (error) {
        console.error('Error approving profile update request:', error);
        return { success: false, error: error.message };
    }
}

export async function rejectProfileUpdateRequest(requestId, adminNotes = "") {
    await connectDB();
    try {
        const request = await ProfileUpdateRequest.findById(requestId);
        if (!request) throw new Error("Request not found");

        const userId = request.user || request.client;

        request.status = 'rejected';
        request.adminNotes = adminNotes;
        await request.save();

        if (userId) {
            await createNotification({
                recipientId: userId,
                title: 'Profile Update Rejected',
                message: 'Your profile update request was not approved. Notes: ' + adminNotes,
                type: 'error',
                link: request.userRole === 'admin' ? '/admin/dashboard?tab=Profile' : '/client/dashboard?tab=Profile'
            });
        }

        revalidatePath('/super-admin/dashboard');
        revalidatePath('/admin/dashboard');
        revalidatePath('/client/dashboard');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting profile update request:', error);
        return { success: false, error: error.message };
    }
}

export async function getPendingRequestForUser(userId) {
    if (!userId) return null;
    await connectDB();
    try {
        const query = {
            $or: [{ user: userId }, { client: userId }],
            status: 'pending'
        };
        const request = await ProfileUpdateRequest.findOne(query).lean();
        return request ? JSON.parse(JSON.stringify(request)) : null;
    } catch (error) {
        console.error('Error getting pending request for user:', userId, error);
        return null;
    }
}

