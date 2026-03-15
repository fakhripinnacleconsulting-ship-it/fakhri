import { BetaAnalyticsDataClient } from "@google-analytics/data";

let client = null;

export function getGA4Client() {
    if (!client) {
        const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");
        client = new BetaAnalyticsDataClient({
            credentials: {
                client_email: process.env.GA4_CLIENT_EMAIL,
                private_key: privateKey,
            },
        });
    }
    return client;
}

export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;
