import { BetaAnalyticsDataClient } from "@google-analytics/data";

let client = null;

export function getGA4Client() {
    if (!client) {
        let privateKey = process.env.GA4_PRIVATE_KEY || "";
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.slice(1, -1);
        } else if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
            privateKey = privateKey.slice(1, -1);
        }
        privateKey = privateKey.replace(/\\n/g, "\n");
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
