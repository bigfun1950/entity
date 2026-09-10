import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const shortlinkKey = searchParams.get("shortlinkKey");

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const matchStage = shortlinkKey ? { $match: { shortlinkKey } } : {};

        const pipeline = [
            ...(shortlinkKey ? [matchStage] : []),
            {
                $project: {
                    deviceType: {
                        $cond: [
                            { $in: ["$deviceType", ["mobile", "tablet"]] },
                            "mobile",
                            "desktop"
                        ],
                    },
                    isBot: { $ifNull: ["$isBot", false] },
                    blockReason: { $ifNull: ["$blockReason", null] },
                    isBlocked: { $ifNull: ["$isBlocked", false] },
                    note: { $ifNull: ["$note", null] }
                }
            },
            {
                $facet: {
                    T: [
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ],
                    H: [
                        { $match: { isBot: false } },
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ],
                    D: [
                        { $match: { blockReason: "cidr" } },
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ],
                    B: [
                        { $match: { isBot: true } },
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ],
                    BL: [
                        { $match: { blockReason: "ipBlacklist" } },
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ],
                    WL: [
                        { $match: { note: "Whitelisted IP" } },
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ],
                    BLC: [
                        { $match: { isBlocked: true } },
                        { $group: { _id: "$deviceType", count: { $sum: 1 } } }
                    ]
                }
            }
        ];

        const aggregation = await db.collection("visitors").aggregate(pipeline).toArray();
        const [data] = aggregation;

        const result = {
            T: { desktop: 0, mobile: 0 },
            H: { desktop: 0, mobile: 0 },
            D: { desktop: 0, mobile: 0 },
            B: { desktop: 0, mobile: 0 },
            BL: { desktop: 0, mobile: 0 },
            WL: { desktop: 0, mobile: 0 },
            BLC: { desktop: 0, mobile: 0 }
        };

        for (const [type, counts] of Object.entries(data)) {
            counts.forEach(({ _id, count }) => {
                if (result[type]) {
                    result[type][_id] = count;
                }
            });
        }

        const chartData = Object.entries(result)
            .filter(([info]) => info !== "TOTAL")
            .map(([info, values]) => ({
                info,
                ...values
            }));

        return NextResponse.json({
            total: result.T,
            chartData
        });
    } catch (error) {
        console.error("Error in /api/visitors/stats:", error);
        return NextResponse.json(
            { error: "Failed to get visitor stats" },
            { status: 500 }
        );
    }
}
