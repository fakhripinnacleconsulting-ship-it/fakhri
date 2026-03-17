"use client";

import React, { forwardRef } from 'react';
import { formatINR, numberToWordsIndian, getGSTDetails, GST_STATES } from '@/lib/utils';

const SELLER_DETAILS = {
    name: 'Fakhri IT Services (India) Private Limited',
    address: '12B, Saeed Colony, Housing Board Karond',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    stateCode: '23',
    pincode: '462038',
    country: 'India',
    gstNo: '23AADCF5985D1ZO',
    email: 'info@fakhriitservices.com',
    phone: '+91 9876543210',
};

const BANK_DETAILS = {
    name: 'Fakhri IT Services India Private Limited',
    bankName: 'Axis Bank',
    branch: 'Peergate Bhopal',
    accountNo: '919020001300562',
    ifscCode: 'UTIB0002819',
    accountType: 'Current A/C'
};

const InvoiceLayout = forwardRef(({ invoice }, ref) => {
    if (!invoice) return null;

    // --- Dynamic data extraction with safe defaults ---
    const client = invoice.client || {};
    const items = (invoice.items || []).map(item => {
        const qty = Number(item.qty) || 1;
        let amount = Number(item.amount || item.total) || 0;
        let rate = Number(item.rate || item.price) || 0;

        // Defensively calculate rate or amount depending on what's available
        if (amount > 0 && rate === 0) {
            rate = amount / qty;
        } else if (rate > 0 && amount === 0) {
            amount = rate * qty;
        } else if (rate > 0 && amount > 0) {
            // Recalculate correctly if needed
            amount = rate * qty;
        }

        return {
            description: item.description || item.name || 'Service',
            hsnCode: item.hsnCode || '998311',
            qty,
            rate,
            amount,
        };
    });

    // Compute subTotal from items dynamically (auto-calculate)
    const subTotal = items.reduce((sum, item) => sum + item.amount, 0);

    // --- GST / State logic ---
    // Determine buyer state from stored placeOfSupply, client.state, or GSTIN
    let buyerStateCode = '';
    let buyerStateName = '';

    if (client.gstNo && client.gstNo.length >= 2) {
        const gstDetails = getGSTDetails(client.gstNo);
        if (gstDetails.stateName !== 'Unknown') {
            buyerStateCode = gstDetails.stateCode;
            buyerStateName = gstDetails.stateName;
        }
    }

    if (!buyerStateName && client.state) {
        // Fallback to client.state if GSTIN prefix is unknown or missing
        buyerStateName = client.state;
        const stateEntry = Object.entries(GST_STATES).find(
            ([, name]) => name.toLowerCase() === client.state.toLowerCase()
        );
        if (stateEntry) buyerStateCode = stateEntry[0];
    }

    let placeOfSupply = invoice.placeOfSupply;
    if (!placeOfSupply || placeOfSupply.includes('Unknown')) {
        placeOfSupply = buyerStateName ? `${buyerStateName} (${buyerStateCode})` : 'N/A';
    }

    // Compute tax breakdown dynamically (auto-calculate)
    let taxBreakdown = null;

    // UT state codes
    const UT_STATES = ['04', '26', '31', '35', '38'];
    const isUT = UT_STATES.includes(buyerStateCode);
    const isIntraState = buyerStateCode === SELLER_DETAILS.stateCode;
    const taxRate = 18;

    if (isUT) {
        taxBreakdown = {
            cgst: Math.round((subTotal * (taxRate / 2)) / 100 * 100) / 100,
            sgst: 0,
            utgst: Math.round((subTotal * (taxRate / 2)) / 100 * 100) / 100,
            igst: 0,
            taxRate
        };
    } else if (isIntraState) {
        taxBreakdown = {
            cgst: Math.round((subTotal * (taxRate / 2)) / 100 * 100) / 100,
            sgst: Math.round((subTotal * (taxRate / 2)) / 100 * 100) / 100,
            utgst: 0,
            igst: 0,
            taxRate
        };
    } else {
        taxBreakdown = {
            cgst: 0,
            sgst: 0,
            utgst: 0,
            igst: Math.round((subTotal * taxRate) / 100 * 100) / 100,
            taxRate
        };
    }

    const isIGST = taxBreakdown.igst > 0;
    const isUTGST = taxBreakdown.utgst > 0;
    const totalTax = (taxBreakdown.cgst || 0) + (taxBreakdown.sgst || 0) + (taxBreakdown.utgst || 0) + (taxBreakdown.igst || 0);
    const totalAmount = subTotal + totalTax;
    const totalInWords = numberToWordsIndian(Math.round(totalAmount));
    const isPaid = invoice.status === 'Paid';
    const balanceDue = isPaid ? 0 : totalAmount;

    const formattedDate = invoice.date
        ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const invoiceNumber = invoice.invoiceNumber || invoice._id?.toString().slice(-8).toUpperCase() || 'DRAFT';

    return (
        <div ref={ref} className="mx-auto p-[0.5in] bg-white text-slate-800 print:shadow-none print:border-none font-sans w-full max-w-[210mm]" id="invoice-container">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="mb-4">
                        <img src="/Logo.png" alt="Fakhri Logo" className="h-10 w-auto object-contain mb-2" />
                        <p className="text-[12px] font-bold text-slate-900 leading-tight">{SELLER_DETAILS.name}</p>
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug font-medium">
                        <p>{SELLER_DETAILS.address}</p>
                        <p>{SELLER_DETAILS.city}, {SELLER_DETAILS.state} - {SELLER_DETAILS.pincode}</p>
                        <p>{SELLER_DETAILS.country}</p>
                        <p className="font-bold text-slate-800 mt-1">GSTIN: {SELLER_DETAILS.gstNo}</p>
                        <p>State: {SELLER_DETAILS.state} | Code: {SELLER_DETAILS.stateCode}</p>
                        <p>{SELLER_DETAILS.email}</p>
                        <p>{SELLER_DETAILS.phone}</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-light text-slate-900 tracking-tight mb-1">TAX INVOICE</h2>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoice # {invoiceNumber}</p>
                    <div className="mt-6">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Balance Due</p>
                        <p className="text-2xl font-bold text-slate-900">₹{formatINR(balanceDue)}</p>
                    </div>
                </div>
            </div>

            {/* Bill To & Info */}
            <div className="flex justify-between mb-4">
                <div className="w-1/2">
                    <h3 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</h3>
                    <div className="text-[13px] font-extrabold uppercase text-slate-900 mb-1">
                        {client.company || client.name || 'N/A'}
                    </div>
                    <div className="text-[11px] text-slate-600 leading-snug font-medium">
                        {client.name && client.company && (
                            <p className="font-semibold text-slate-800">{client.name}</p>
                        )}
                        {client.address && <p>{client.address}</p>}
                        <p>
                            {[client.city, client.state].filter(Boolean).join(', ')}
                            {client.pincode && ` - ${client.pincode}`}
                        </p>
                        {client.country && <p>{client.country}</p>}
                        {client.gstNo && (
                            <p className="font-bold text-slate-800 mt-1">GSTIN: {client.gstNo}</p>
                        )}
                        {buyerStateName && (
                            <p className="text-slate-500 text-[10px]">
                                State: {buyerStateName} | Code: {buyerStateCode}
                            </p>
                        )}
                        {client.email && <p>{client.email}</p>}
                        {client.phone && <p>{client.phone}</p>}
                    </div>
                </div>
                <div className="text-right flex flex-col justify-start gap-1">
                    <div className="flex justify-end gap-x-6">
                        <span className="text-[11px] font-medium text-slate-500">Invoice Date:</span>
                        <span className="text-[11px] font-bold text-slate-900">{formattedDate}</span>
                    </div>
                    <div className="flex justify-end gap-x-6">
                        <span className="text-[11px] font-medium text-slate-500">Status:</span>
                        <span className={`text-[11px] font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {invoice.status || 'Pending'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Place of Supply */}
            <div className="mb-4 px-4 py-1.5 bg-slate-50 rounded border border-slate-100">
                <p className="text-[11px] font-medium text-slate-800">
                    <span className="text-slate-500">Place Of Supply: </span>
                    <span className="font-bold">{placeOfSupply}</span>
                </p>
            </div>

            {/* Items Table */}
            <div className="overflow-hidden rounded border border-slate-200 mb-5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800 text-white text-[9px] uppercase tracking-wider font-bold">
                            <th className="px-3 py-2 border-r border-slate-700 w-10 text-center">#</th>
                            <th className="px-3 py-2 border-r border-slate-700">Item & Description</th>
                            <th className="px-2 py-2 border-r border-slate-700 text-center w-20">HSN/SAC</th>
                            <th className="px-2 py-2 border-r border-slate-700 text-right w-12">Qty</th>
                            <th className="px-2 py-2 border-r border-slate-700 text-right w-22">Rate</th>
                            <th className="px-3 py-2 text-right w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px]">
                        {items.map((item, index) => {
                            return (
                                <tr key={index} className="border-b border-slate-100 align-top hover:bg-slate-50/50 transition-colors">
                                    <td className="px-3 py-3 text-center text-slate-400 font-medium">{index + 1}</td>
                                    <td className="px-3 py-3">
                                        <span className="font-bold block text-slate-900 mb-0.5">{item.description}</span>
                                        {item.hsnCode === '998311' && (
                                            <span className="text-[9px] text-slate-400 font-medium">IT / Professional Services</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-3 text-center text-slate-500 font-medium">{item.hsnCode}</td>
                                    <td className="px-2 py-3 text-right font-medium">{item.qty}</td>
                                    <td className="px-2 py-3 text-right font-medium">₹{formatINR(item.rate)}</td>
                                    <td className="px-3 py-3 text-right font-bold text-slate-900">₹{formatINR(item.amount)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6">
                <div className="w-72">
                    <div className="flex justify-between py-1.5 text-[11px] font-medium border-b border-slate-50">
                        <span className="text-slate-500">Sub Total</span>
                        <span className="text-slate-900">₹{formatINR(subTotal)}</span>
                    </div>
                    {isIGST ? (
                        <div className="flex justify-between py-1.5 text-[11px] font-bold border-b border-slate-50">
                            <span className="text-slate-500 uppercase text-[9px] tracking-wider">IGST @ {taxRate}%</span>
                            <span className="text-slate-900">₹{formatINR(taxBreakdown.igst)}</span>
                        </div>
                    ) : isUTGST ? (
                        <>
                            <div className="flex justify-between py-1.5 text-[11px] font-bold border-b border-slate-50">
                                <span className="text-slate-400 uppercase text-[9px] tracking-wider">CGST @ {taxRate / 2}%</span>
                                <span className="text-slate-900">₹{formatINR(taxBreakdown.cgst)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-[11px] font-bold border-b border-slate-50">
                                <span className="text-slate-400 uppercase text-[9px] tracking-wider">UTGST @ {taxRate / 2}%</span>
                                <span className="text-slate-900">₹{formatINR(taxBreakdown.utgst)}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between py-1.5 text-[11px] font-bold border-b border-slate-50">
                                <span className="text-slate-400 uppercase text-[9px] tracking-wider">CGST @ {taxRate / 2}%</span>
                                <span className="text-slate-900">₹{formatINR(taxBreakdown.cgst)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 text-[11px] font-bold border-b border-slate-50">
                                <span className="text-slate-400 uppercase text-[9px] tracking-wider">SGST @ {taxRate / 2}%</span>
                                <span className="text-slate-900">₹{formatINR(taxBreakdown.sgst)}</span>
                            </div>
                        </>
                    )}
                    <div className="flex justify-between py-2 text-md font-black text-slate-900 border-b border-slate-100">
                        <span>Total</span>
                        <span>₹{formatINR(totalAmount)}</span>
                    </div>
                    {isPaid && (
                        <div className="flex justify-between py-1.5 text-[11px] text-emerald-600 font-bold border-b border-slate-50">
                            <span className="font-medium">Payment Received</span>
                            <span>(-) ₹{formatINR(totalAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2 text-md font-black bg-slate-50 px-3 mt-2 rounded border-l-4 border-slate-900">
                        <span className="uppercase text-[9px] tracking-widest self-center text-slate-400">Balance Due</span>
                        <span className="text-lg">₹{formatINR(balanceDue)}</span>
                    </div>
                </div>
            </div>

            {/* Total in Words and Notes */}
            <div className="grid grid-cols-1 gap-6 mb-10">
                <div className="flex items-start gap-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 whitespace-nowrap">Total In Words:</span>
                    <span className="text-[12px] font-bold italic text-slate-800 leading-tight">{totalInWords}</span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Notes</h4>
                        <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
                            {invoice.notes || 'Thank you for your business!'}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bank Details</h4>
                        <div className="text-[10px] text-slate-600 leading-tight font-medium bg-slate-50/30 p-3 rounded border border-slate-100">
                            <div className="grid grid-cols-[70px_1fr] gap-y-1">
                                <span className="text-slate-400 font-bold text-[8px] uppercase">Bank:</span>
                                <span className="text-slate-700">{BANK_DETAILS.bankName}</span>

                                <span className="text-slate-400 font-bold text-[8px] uppercase">A/C No:</span>
                                <span className="text-slate-800 font-bold">{BANK_DETAILS.accountNo}</span>

                                <span className="text-slate-400 font-bold text-[8px] uppercase">IFSC:</span>
                                <span className="text-slate-700 font-bold">{BANK_DETAILS.ifscCode}</span>

                                <span className="text-slate-400 font-bold text-[8px] uppercase">Type:</span>
                                <span className="text-slate-700">{BANK_DETAILS.accountType}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Signature Area */}
            <div className="pt-6 border-t border-slate-100 print:break-inside-avoid">
                <div className="flex justify-between items-end">
                    <div className="text-[9px] text-slate-400 font-medium max-w-[400px]">
                        <p>© {new Date().getFullYear()} {SELLER_DETAILS.name}</p>
                        <p className="mt-1 leading-tight">Declaration: This is a computer generated invoice and does not require a physical signature. All particulars are true and correct.</p>
                    </div>
                    {/* <div className="w-56 text-center">
                        <div className="border-b border-slate-800 mb-1 h-8 flex items-end justify-center italic text-slate-200 text-xs pb-1">
                            Authorized Representative
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authorized Signature</p>
                    </div> */}
                </div>
            </div>
        </div>
    );
});

InvoiceLayout.displayName = 'InvoiceLayout';

export default InvoiceLayout;
