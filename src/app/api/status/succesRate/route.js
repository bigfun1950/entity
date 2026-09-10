import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const owner = searchParams.get("owner");
        const client = await clientPromise;
        const db = client.db("ENTITY");

        if (!owner) {
            return NextResponse.json(
                { success: false, error: "Missing owner parameter" },
                { status: 400 }
            );
        }

        const result = await db.collection("statusLogs").aggregate([
            { $match: { owner } },
            {
                $group: {
                    _id: "$success",
                    count: { $sum: 1 },
                },
            },
        ]).toArray();

        let success = 0;
        let fail = 0;

        result.forEach(r => {
            if (r._id) success = r.count;
            else fail = r.count;
        });

        const total = success + fail;
        const rate = total > 0 ? Math.round((success / total) * 100) : 0;

        return NextResponse.json({
            success: true,
            data: { total, success, fail, rate },
        });
    } catch (err) {
        console.error("Failed to fetch success rate:", err);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
