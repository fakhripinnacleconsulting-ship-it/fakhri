import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatINR(number) {
    if (!number) return "0";
    const cleanNumber = typeof number === 'string' ? parseFloat(number.replace(/[^0-9.-]+/g, "")) : Number(number);
    if (isNaN(cleanNumber)) return "0";
    return new Intl.NumberFormat('en-IN').format(cleanNumber);
}
export function calculatePeriodDays(periodText) {
    if (!periodText) return 30;
    const clean = String(periodText).toLowerCase().trim();

    // 1. Try to extract from (X days)
    const daysMatch = clean.match(/\((\d+)\s*days\)/);
    if (daysMatch) return parseInt(daysMatch[1]);

    // 2. Try to extract months and multiply by 30
    let months = 0;
    if (clean === "month") months = 1;
    else if (clean === "1 year" || clean === "year") months = 12;
    else {
        const match = clean.match(/(\d+)/);
        if (match) months = parseInt(match[1]);
    }

    if (months > 0) return months * 30;
    return 30;
}

export function normalizePeriod(period) {
    if (!period) return "";
    let clean = String(period).toLowerCase().trim();

    // 1. Correct "dyas" to "days"
    clean = clean.replace(/dyas/g, "days");

    // 2. Remove existing (X days) to rebuild it correctly
    clean = clean.replace(/\(\d+\s*days\)/g, "").trim();

    // 3. Handle leading slash
    clean = clean.replace(/^\//, "").trim();

    // 4. Add space between number and unit (e.g. 3month -> 3 month)
    clean = clean.replace(/(\d+)([a-z]+)/g, "$1 $2");

    // Return the cleaned period without appending calculated days
    return clean;
}
export function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    function convert_millions(num) {
        if (num >= 1000000) {
            return convert_millions(Math.floor(num / 1000000)) + " Million " + convert_thousands(num % 1000000);
        } else {
            return convert_thousands(num);
        }
    }

    function convert_thousands(num) {
        if (num >= 1000) {
            return convert_hundreds(Math.floor(num / 1000)) + " Thousand " + convert_hundreds(num % 1000);
        } else {
            return convert_hundreds(num);
        }
    }

    function convert_hundreds(num) {
        if (num > 99) {
            return ones[Math.floor(num / 100)] + " Hundred " + convert_tens(num % 100);
        } else {
            return convert_tens(num);
        }
    }

    function convert_tens(num) {
        if (num < 10) return ones[num];
        else if (num >= 10 && num < 20) return teens[num - 10];
        else {
            return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
        }
    }

    if (num === 0) return "Zero";
    return convert_millions(num).trim() + " Only";
}

// Indian specific number to words (Lakhs/Crores)
export function numberToWordsIndian(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = ('0000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return "Indian Rupee " + str.trim() + " Only";
}

export const GST_STATES = {
    "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
    "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar",
    "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
    "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal", "20": "Jharkhand",
    "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra & Nagar Haveli and Daman & Diu",
    "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep", "32": "Kerala",
    "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman & Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh",
    "38": "Ladakh"
};

export function getGSTDetails(gstNo) {
    if (!gstNo || gstNo.length < 2) return { stateName: 'Unknown', stateCode: '' };
    const code = gstNo.substring(0, 2);
    return {
        stateName: GST_STATES[code] || 'Unknown',
        stateCode: code
    };
}

export function getWeekNumber(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.floor((dayOfYear + startOfYear.getDay()) / 7) + 1;
}

/**
 * Parse a plan price string like "₹45,000" or "₹1,00,000" into a numeric value.
 */
export function parsePlanPrice(priceStr) {
    if (!priceStr) return 0;
    const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
}

/**
 * Calculate the upgrade discount (75% of remaining value of the current plan).
 * @param {Object} params
 * @param {Date|string} params.subscriptionStart - When the current subscription started
 * @param {Date|string} params.subscriptionEnd - When the current subscription ends
 * @param {number} params.currentPlanPrice - Numeric price of the current plan
 * @returns {{ remainingDays: number, totalDays: number, remainingValue: number, discount: number }}
 */
export function calculateUpgradeDiscount({ subscriptionStart, subscriptionEnd, currentPlanPrice }) {
    const now = new Date();
    const start = new Date(subscriptionStart);
    const end = new Date(subscriptionEnd);

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    // Daily rate of the current plan
    const dailyRate = currentPlanPrice / totalDays;
    const remainingValue = dailyRate * remainingDays;

    // 75% of remaining value is the discount
    const discount = Math.round(remainingValue * 0.75);

    return {
        remainingDays,
        totalDays,
        remainingValue: Math.round(remainingValue),
        discount
    };
}
