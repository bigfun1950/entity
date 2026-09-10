import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const shortlinkKey = searchParams.get("shortlinkKey");
        const owner = searchParams.get("owner");

        if (!shortlinkKey && !owner) {
            return NextResponse.json(
                { success: false, message: "Missing shortlinkKey or owner" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        let query = {};
        if (shortlinkKey) query.shortlinkKey = shortlinkKey;
        if (owner) query.owner = owner;

        const visitors = await db
            .collection("visitors")
            .find(query)
            .sort({ timestamp: -1 })
            .limit(999999999)
            .project({
                _id: 0,
                owner: 1,
                visitorIp: 1,
                visitorCountry: 1,
                deviceType: 1,
                isBot: 1,
                isBlocked: 1,
                blockReason: 1,
                note: 1,
                timestamp: 1,
            })
            .toArray();

        return NextResponse.json({ success: true, visitors });
    } catch (error) {
        console.error("Error fetching visitors list:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch visitors" },
            { status: 500 }
        );
    }
}
