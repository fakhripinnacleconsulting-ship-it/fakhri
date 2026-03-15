import { NextResponse } from "next/server";
import { getGA4Client, GA4_PROPERTY_ID } from "@/lib/ga4Client";

function getDateRange(period, from, to) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
        case "24h":
            startDate = "yesterday";
            endDate = "today";
            break;
        case "7d":
            startDate = "7daysAgo";
            endDate = "today";
            break;
        case "30d":
            startDate = "30daysAgo";
            endDate = "today";
            break;
        case "90d":
            startDate = "90daysAgo";
            endDate = "today";
            break;
        case "custom":
            startDate = from || "7daysAgo";
            endDate = to || "today";
            break;
        case "all":
            startDate = "365daysAgo";
            endDate = "today";
            break;
        default:
            startDate = "7daysAgo";
            endDate = "today";
    }

    return { startDate, endDate };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "7d";
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const client = getGA4Client();
        const propertyId = GA4_PROPERTY_ID;

        if (!propertyId) {
            return NextResponse.json({ success: false, error: "GA4_PROPERTY_ID not configured" }, { status: 500 });
        }

        const { startDate, endDate } = getDateRange(period, from, to);

        // Run all requests in parallel
        const [
            overviewRes,
            dailyRes,
            topPagesRes,
            deviceRes,
            browserRes,
            countryRes,
            sourceRes,
            realtimeRes
        ] = await Promise.all([
            // 1. Overview metrics
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                metrics: [
                    { name: "activeUsers" },
                    { name: "sessions" },
                    { name: "screenPageViews" },
                    { name: "averageSessionDuration" },
                    { name: "bounceRate" },
                    { name: "newUsers" },
                    { name: "engagedSessions" },
                    { name: "userEngagementDuration" },
                ],
            }),

            // 2. Daily/hourly traffic
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: period === "24h" ? "hour" : "date" }],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "activeUsers" },
                    { name: "sessions" },
                ],
                orderBys: [{ dimension: { dimensionName: period === "24h" ? "hour" : "date", orderType: "ALPHANUMERIC" } }],
            }),

            // 3. Top pages
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "pagePath" }],
                metrics: [
                    { name: "screenPageViews" },
                    { name: "averageSessionDuration" },
                    { name: "activeUsers" },
                ],
                orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
                limit: 15,
            }),

            // 4. Device breakdown
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "deviceCategory" }],
                metrics: [{ name: "activeUsers" }, { name: "sessions" }],
                orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
            }),

            // 5. Browser breakdown
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "browser" }],
                metrics: [{ name: "activeUsers" }],
                orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
                limit: 10,
            }),

            // 6. Country breakdown
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "country" }],
                metrics: [{ name: "activeUsers" }, { name: "sessions" }],
                orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
                limit: 10,
            }),

            // 7. Traffic source
            client.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: "sessionDefaultChannelGroup" }],
                metrics: [{ name: "sessions" }, { name: "activeUsers" }],
                orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
                limit: 10,
            }),

            // 8. Realtime (active users in real time)
            client.runRealtimeReport({
                property: `properties/${propertyId}`,
                metrics: [{ name: "activeUsers" }],
            }).catch(() => null), // Realtime might not be available for all properties
        ]);

        // Parse overview
        const overviewRow = overviewRes[0]?.rows?.[0];
        const overview = {
            activeUsers: parseInt(overviewRow?.metricValues?.[0]?.value || "0"),
            sessions: parseInt(overviewRow?.metricValues?.[1]?.value || "0"),
            pageViews: parseInt(overviewRow?.metricValues?.[2]?.value || "0"),
            avgSessionDuration: parseFloat(overviewRow?.metricValues?.[3]?.value || "0"),
            bounceRate: parseFloat(overviewRow?.metricValues?.[4]?.value || "0"),
            newUsers: parseInt(overviewRow?.metricValues?.[5]?.value || "0"),
            engagedSessions: parseInt(overviewRow?.metricValues?.[6]?.value || "0"),
            totalEngagementDuration: parseFloat(overviewRow?.metricValues?.[7]?.value || "0"),
        };

        // Parse daily visits
        const dailyVisits = (dailyRes[0]?.rows || []).map((row) => {
            const raw = row.dimensionValues[0].value;
            let label;
            if (period === "24h") {
                label = `${raw}:00`;
            } else {
                // raw format is YYYYMMDD
                label = `${raw.slice(4, 6)}/${raw.slice(6, 8)}`;
            }
            return {
                _id: label,
                views: parseInt(row.metricValues[0].value),
                users: parseInt(row.metricValues[1].value),
                sessions: parseInt(row.metricValues[2].value),
            };
        });

        // Parse top pages
        const topPaths = (topPagesRes[0]?.rows || []).map((row) => ({
            _id: row.dimensionValues[0].value,
            views: parseInt(row.metricValues[0].value),
            avgTime: parseFloat(row.metricValues[1].value),
            users: parseInt(row.metricValues[2].value),
        }));

        // Parse device stats
        const deviceStats = (deviceRes[0]?.rows || []).map((row) => ({
            _id: row.dimensionValues[0].value,
            count: parseInt(row.metricValues[0].value),
            sessions: parseInt(row.metricValues[1].value),
        }));

        // Parse browser stats
        const browserStats = (browserRes[0]?.rows || []).map((row) => ({
            _id: row.dimensionValues[0].value,
            count: parseInt(row.metricValues[0].value),
        }));

        // Parse country stats
        const countryStats = (countryRes[0]?.rows || []).map((row) => ({
            _id: row.dimensionValues[0].value,
            users: parseInt(row.metricValues[0].value),
            sessions: parseInt(row.metricValues[1].value),
        }));

        // Parse traffic sources
        const trafficSources = (sourceRes[0]?.rows || []).map((row) => ({
            _id: row.dimensionValues[0].value,
            sessions: parseInt(row.metricValues[0].value),
            users: parseInt(row.metricValues[1].value),
        }));

        // Parse real-time users
        const realtimeUsers = realtimeRes ? parseInt(realtimeRes[0]?.rows?.[0]?.metricValues?.[0]?.value || "0") : 0;

        return NextResponse.json({
            success: true,
            stats: {
                overview,
                dailyVisits,
                topPaths,
                deviceStats,
                browserStats,
                countryStats,
                trafficSources,
                realtimeUsers,
            },
        });
    } catch (error) {
        console.error("GA4 stats fetch error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch GA4 data" },
            { status: 500 }
        );
    }
}
