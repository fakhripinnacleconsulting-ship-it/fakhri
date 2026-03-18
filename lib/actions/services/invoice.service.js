'use server';

import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';
import User from '@/models/User';
import PricingPlan from '@/models/PricingPlan';
import CatalogService from '@/models/CatalogService';
import { numberToWordsIndian, getGSTDetails, getWeekNumber } from '@/lib/utils';
import { validateRole } from "@/lib/auth-utils";


// Helper: Ensure the user can only access their own data if they are a client
async function applyOwnershipFilter(query, user, field = 'client.id') {
    if (user.role === 'client') {
        query[field] = user.id;
    }
}

export async function getInvoices({
    page = 1,
    limit = 10,
    status = '',
    clientId = null,
    search = ''
} = {}) {
    const user = await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();
    const skip = (page - 1) * limit;

    const query = { isManualAmount: { $ne: true } };
    if (status) query.status = status;
    if (clientId) query['client.id'] = clientId;
    await applyOwnershipFilter(query, user);

    if (search) {
        query.$or = [
            { invoiceNumber: { $regex: search, $options: 'i' } },
            { 'client.name': { $regex: search, $options: 'i' } },
            { 'client.company': { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Invoice.countDocuments(query);

        return {
            invoices: JSON.parse(JSON.stringify(invoices)),
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        };
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return { invoices: [], total: 0, pages: 0, error: 'Failed to fetch invoices' };
    }
}

export async function getInvoiceSummary(clientId) {
    const user = await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();
    try {
        // Resolve the effective client ID: use the passed clientId, or fall back to the logged-in client's own ID
        const effectiveClientId = clientId || (user.role === 'client' ? user.id : null);

        const query = effectiveClientId ? { 'client.id': effectiveClientId } : {};
        query.isManualAmount = { $ne: true };
        await applyOwnershipFilter(query, user);
        const invoices = await Invoice.find(query).lean();

        let userManualAmount = 0;
        if (effectiveClientId) {
            const clientDoc = await User.findById(effectiveClientId).select('amount role').lean();
            if (clientDoc && clientDoc.role === 'client' && clientDoc.amount) {
                userManualAmount = Number(clientDoc.amount) || 0;
            }
        }

        let paidRevenue = 0;
        invoices.forEach(inv => {
            if (inv.status === 'Paid') {
                const val = parseFloat(String(inv.amount).replace(/[^0-9.]/g, ''));
                if (!isNaN(val)) paidRevenue += val;
            }
        });

        const paidCount = invoices.filter(inv => inv.status === 'Paid').length + (userManualAmount > 0 ? 1 : 0);
        const pendingCount = invoices.filter(inv => inv.status === 'Pending').length;

        // Final spent amount is Paid Invoices + Setup Fee (User.amount)
        const totalSpent = paidRevenue + userManualAmount;

        return {
            totalAmount: totalSpent,
            count: invoices.length,
            paidCount,
            pendingCount
        };
    } catch (error) {
        console.error('Error calculating invoice summary:', error);
        return null;
    }
}

const SELLER_DETAILS = {
    name: 'Fakhri IT Services (India) Private Limited',
    address: '12B, Saeed Colony, Housing Board Karond',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '462038',
    country: 'India',
    gstNo: '23AADCF5985D1ZO',
    stateCode: '23',
    email: 'info@fakhriitservices.com',
    phone: '+91 9876543210',
};

export async function createInvoice(invoiceData) {
    await validateRole(['super-admin', 'admin', 'client']);
    await connectDB();
    try {
        // 1. Generate Invoice Number: FISIPL2526INXXXX
        const prefix = "FISIPL2526IN";
        const latestInvoice = await Invoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
            .sort({ createdAt: -1 })
            .lean();

        let nextNum = 1;
        if (latestInvoice) {
            const lastNumStr = latestInvoice.invoiceNumber.replace(prefix, "");
            nextNum = parseInt(lastNumStr) + 1;
        }
        invoiceData.invoiceNumber = `${prefix}${String(nextNum).padStart(4, '0')}`;

        // 2. GST Logic
        const sellerStateCode = SELLER_DETAILS.stateCode;
        const buyerGST = invoiceData.client.gstNo || "";
        let buyerStateCode = "";
        let buyerStateName = "";

        if (buyerGST && buyerGST.length >= 2) {
            const gstDetails = getGSTDetails(buyerGST);
            if (gstDetails.stateName !== 'Unknown') {
                buyerStateCode = gstDetails.stateCode;
                buyerStateName = gstDetails.stateName;
            }
        }

        if (!buyerStateName && invoiceData.client.state) {
            buyerStateName = invoiceData.client.state;
            const stateEntry = Object.entries((await import('@/lib/utils')).GST_STATES).find(
                ([, name]) => name.toLowerCase() === buyerStateName.toLowerCase()
            );
            if (stateEntry) buyerStateCode = stateEntry[0];
        }

        invoiceData.placeOfSupply = buyerStateName ? `${buyerStateName} (${buyerStateCode})` : "N/A";

        const isIntraState = buyerStateCode === sellerStateCode;
        // Logic for tax calculation will use isIntraState...

        // Normalize items: accept both old format (price/total) and new format (rate/amount)
        invoiceData.items = (invoiceData.items || []).map(item => {
            const rawRate = item.rate || item.price || 0;
            const rate = typeof rawRate === 'string' ? parseFloat(rawRate.replace(/[^0-9.]/g, '')) || 0 : parseFloat(rawRate) || 0;
            const qty = parseInt(item.qty) || 1;

            const rawAmount = item.amount || item.total || 0;
            const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount.replace(/[^0-9.]/g, '')) || (qty * rate) : parseFloat(rawAmount) || (qty * rate);
            return {
                description: item.description || 'Service',
                hsnCode: item.hsnCode || '998311',
                qty,
                rate,
                amount
            };
        });

        // Calculate Subtotal
        const subTotal = invoiceData.items.reduce((sum, item) => sum + item.amount, 0);
        invoiceData.subTotal = subTotal;

        const taxRate = 18; // 18% standard for IT
        let cgst = 0, sgst = 0, igst = 0, utgst = 0;

        if (isIntraState) {
            // Intra-state: CGST + SGST (9% each)
            cgst = (subTotal * (taxRate / 2)) / 100;
            sgst = (subTotal * (taxRate / 2)) / 100;
        } else {
            // Inter-state: IGST (18%)
            igst = (subTotal * taxRate) / 100;
        }

        invoiceData.taxBreakdown = {
            cgst: Math.round(cgst * 100) / 100,
            sgst: Math.round(sgst * 100) / 100,
            igst: Math.round(igst * 100) / 100,
            utgst: 0,
            taxRate
        };

        invoiceData.amount = Math.round((subTotal + cgst + sgst + igst) * 100) / 100;
        invoiceData.totalInWords = numberToWordsIndian(Math.round(invoiceData.amount));

        const newInvoice = await Invoice.create(invoiceData);

        // Notify Client if id is present
        if (newInvoice.client?.id) {
            const { createNotification } = await import('@/lib/actions/notification');
            await createNotification({
                recipientId: newInvoice.client.id,
                title: 'New Invoice Generated',
                message: `A new invoice ${newInvoice.invoiceNumber} for ₹${newInvoice.amount} has been generated.`,
                type: 'invoice',
                link: '#Billing'
            });
        }

        return { success: true, invoice: JSON.parse(JSON.stringify(newInvoice)) };
    } catch (error) {
        console.error('Error creating invoice:', error);
        return { success: false, error: 'Failed to create invoice' };
    }
}

import { cache } from '@/lib/cache';

export async function getSalesAnalytics({ startDate, endDate, groupBy = 'month' } = {}) {
    await validateRole(['super-admin', 'admin']);
    const cacheKey = `sales_analytics_${startDate || 'all'}_${endDate || 'all'}_${groupBy}`;

    return await cache.wrap(cacheKey, async () => {
        await connectDB();
        try {
            // Initial query: filter by status at DB level for performance
            const invoices = await Invoice.find({ status: 'Paid', isManualAmount: { $ne: true } }).lean();
            const users = await User.find({ role: 'client' }).lean();
            const pricingPlans = await PricingPlan.find({}).lean();
            const catalogServices = await CatalogService.find({}).lean();

            // Intercept manual user amounts and merge them as pseudo-invoices to feed the unified analytics
            for (const user of users) {
                if (user.amount && Number(user.amount) > 0) {
                    invoices.push({
                        date: user.createdAt,
                        createdAt: user.createdAt,
                        amount: Number(user.amount),
                        client: { id: user._id, name: user.name, company: user.company },
                        status: 'Paid',
                        isManualAmount: true,
                        plan: user.plan || "Other",
                        items: [{ description: 'Setup Fee / Manual Payment', amount: Number(user.amount) }]
                    });
                }
            }

            const planNames = pricingPlans.map(p => p.name.toLowerCase());
            const serviceNames = catalogServices.map(s => s.name.toLowerCase());

            let totalRevenue = 0;
            const trendMap = {};
            const clientRevenueMap = {};
            const revenueByPlanMap = {};

            // Initialize plans in revenue map to ensure they show up
            pricingPlans.forEach(p => {
                revenueByPlanMap[p.name] = { name: p.name, revenue: 0, count: 0 };
            });
            revenueByPlanMap["Add-on Services"] = { name: "Add-on Services", revenue: 0, count: 0 };
            revenueByPlanMap["Within 2 Hours"] = { name: "Within 2 Hours", revenue: 0, count: 0 };
            revenueByPlanMap["Other"] = { name: "Other", revenue: 0, count: 0 };

            const categoryClients = {}; // To track unique clients per category

            const parseDate = (date) => {
                if (!date) return null;
                const d = new Date(date);
                return isNaN(d.getTime()) ? null : d;
            };

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            const isStartValid = start && !isNaN(start.getTime());
            const isEndValid = end && !isNaN(end.getTime());

            const availableYearsSet = new Set();

            for (const inv of invoices) {
                const dDate = parseDate(inv.date);
                const cDate = parseDate(inv.createdAt);

                const isDateInRange = isStartValid && dDate && dDate >= start && (!isEndValid || dDate <= end);
                const isCreatedInRange = isStartValid && cDate && cDate >= start && (!isEndValid || cDate <= end);
                const isNoFilter = !isStartValid && !isEndValid;

                if (!isNoFilter && !isDateInRange && !isCreatedInRange) continue;

                let invDate = isDateInRange ? dDate : (isCreatedInRange ? cDate : (dDate || cDate));
                if (!invDate) continue;

                availableYearsSet.add(invDate.getFullYear());

                const totalInvAmount = typeof inv.amount === 'number' ? inv.amount :
                    parseFloat(String(inv.amount || 0).replace(/[^0-9.]/g, '')) || 0;
                totalRevenue += totalInvAmount;

                let groupKey;
                let sortKey;

                if (groupBy === 'year') {
                    groupKey = invDate.getFullYear().toString();
                    sortKey = new Date(invDate.getFullYear(), 0, 1).getTime();
                } else if (groupBy === 'quarter') {
                    const q = Math.floor(invDate.getMonth() / 3) + 1;
                    groupKey = `Q${q} ${invDate.getFullYear()}`;
                    sortKey = new Date(invDate.getFullYear(), (q - 1) * 3, 1).getTime();
                } else if (groupBy === 'week') {
                    const d = new Date(invDate);
                    const day = d.getDay();
                    const diff = d.getDate() - day; // Sunday
                    const startOfWeek = new Date(d.setDate(diff));
                    const weekNo = getWeekNumber(startOfWeek);
                    groupKey = `Week ${weekNo} (${startOfWeek.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`;
                    sortKey = startOfWeek.getTime();
                } else if (groupBy === 'day') {
                    groupKey = invDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                    sortKey = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate()).getTime();
                } else { // default month
                    groupKey = invDate.toLocaleString('default', { month: 'short', year: 'numeric' });
                    sortKey = new Date(invDate.getFullYear(), invDate.getMonth(), 1).getTime();
                }

                if (!trendMap[groupKey]) {
                    trendMap[groupKey] = { revenue: 0, sortKey, label: groupKey };
                }
                trendMap[groupKey].revenue += totalInvAmount;

                const cid = inv.client?.id?.toString();
                const items = inv.items || [];

                let primaryCategory = "Other";
                let matchedByItem = false;

                if (items.length > 0) {
                    for (const item of items) {
                        const itemName = (item.description || "").toLowerCase().trim();
                        const matchedPlan = pricingPlans.find(p => {
                            const pName = p.name.toLowerCase().trim();
                            return itemName === pName ||
                                itemName.includes(pName + " plan") ||
                                itemName === pName + " subscription" ||
                                (itemName.includes(pName) && itemName.length < pName.length + 12);
                        });

                        if (matchedPlan) {
                            primaryCategory = matchedPlan.name;
                            matchedByItem = true;
                            break;
                        }
                    }

                    if (!matchedByItem) {
                        for (const item of items) {
                            const itemName = (item.description || "").toLowerCase().trim();
                            if (itemName.includes("within 2 hours") || itemName.includes("within two hours")) {
                                primaryCategory = "Within 2 Hours";
                                matchedByItem = true;
                                break;
                            }
                        }
                    }

                    if (!matchedByItem) {
                        for (const item of items) {
                            const itemName = (item.description || "").toLowerCase().trim();
                            if (serviceNames.some(sn => itemName.includes(sn)) ||
                                itemName.includes("amazon") ||
                                itemName.includes("services") ||
                                itemName.includes("subscription")) {
                                primaryCategory = "Add-on Services";
                                matchedByItem = true;
                                break;
                            }
                        }
                    }
                }

                if (!matchedByItem) {
                    const user = users.find(u => u._id.toString() === cid);
                    if (user?.plan) primaryCategory = user.plan;
                }

                if (!revenueByPlanMap[primaryCategory]) {
                    revenueByPlanMap[primaryCategory] = { name: primaryCategory, revenue: 0, count: 0 };
                }
                revenueByPlanMap[primaryCategory].revenue += totalInvAmount;

                if (cid) {
                    if (!categoryClients[primaryCategory]) categoryClients[primaryCategory] = new Set();
                    categoryClients[primaryCategory].add(cid);
                }

                if (cid) {
                    if (!clientRevenueMap[cid]) {
                        const user = users.find(u => u._id.toString() === cid);
                        clientRevenueMap[cid] = {
                            _id: cid,
                            name: inv.client.name,
                            company: inv.client.company,
                            revenue: 0,
                            plan: user?.plan || "N/A"
                        };
                    }
                    clientRevenueMap[cid].revenue += totalInvAmount;
                }
            }

            Object.keys(revenueByPlanMap).forEach(cat => {
                if (categoryClients[cat]) {
                    revenueByPlanMap[cat].count = categoryClients[cat].size;
                } else {
                    revenueByPlanMap[cat].count = 0;
                }
            });

            const totalClientsCount = users.length;
            const disabledClientsCount = users.filter(u => u.status === 'disabled').length;
            const churnRate = totalClientsCount > 0 ? (disabledClientsCount / totalClientsCount) * 100 : 0;

            const trend = Object.values(trendMap).sort((a, b) => a.sortKey - b.sortKey);
            const topClients = Object.values(clientRevenueMap).sort((a, b) => b.revenue - a.revenue);
            const revenueByPlan = Object.values(revenueByPlanMap)
                .filter(p => p.count > 0 || p.revenue > 0)
                .sort((a, b) => b.revenue - a.revenue);

            const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);
            if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

            return {
                totalRevenue,
                trend: JSON.parse(JSON.stringify(trend)),
                topClients: JSON.parse(JSON.stringify(topClients)),
                revenueByPlan: JSON.parse(JSON.stringify(revenueByPlan)),
                churnRate,
                availableYears
            };

        } catch (error) {
            console.error("Error getting sales analytics:", error);
            return { totalRevenue: 0, trend: [], topClients: [], revenueByPlan: [], churnRate: 0, availableYears: [new Date().getFullYear()] };
        }
    }, 30); // 30 second TTL — keep fresh for revenue updates
}
