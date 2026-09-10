import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
    try {
        const client = await clientPromise;
        const db = client.db("ENTITY");

        const result = await db.collection("notifications").deleteMany({});

        return NextResponse.json({
            success: true,
            deletedCount: result.deletedCount,
        });
    } catch (err) {
        console.error("Failed to delete notifications:", err);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
