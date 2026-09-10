import { NextResponse } from "next/server";
import clientPromise from "@/lib/validatorMongoDb";

export async function POST(request) {
    try {
        const { apiKey, total } = await request.json();

        if (!apiKey) {
            return NextResponse.json(
                { valid: false, message: "API key required" },
                { status: 400 }
            );
        }

        const totalCount = Number(total || 0);

        const client = await clientPromise;
        const db = client.db("EntityBounce");
        const collection = db.collection("entityInfo");

        let apiKeyDoc = await collection.findOne({ apiKey });

        if (!apiKeyDoc) {
            return NextResponse.json(
                { valid: false, message: "Invalid API key" },
                { status: 401 }
            );
        }

        const now = new Date();
        const lastReset = new Date(apiKeyDoc.lastReset || 0);
        const resetIntervalMs = 24 * 60 * 60 * 1000;

        if (now.getTime() - lastReset.getTime() > resetIntervalMs) {
            await collection.updateOne(
                { apiKey },
                { $set: { used: 0, lastReset: now } }
            );
            apiKeyDoc.used = 0;
            apiKeyDoc.lastReset = now;
        }

        const limit = apiKeyDoc.limit;
        const used = apiKeyDoc.used;
        const remaining = limit - used;

        if (totalCount > remaining) {
            return NextResponse.json(
                {
                    valid: false,
                    message: `Quota exceeded. Requested ${totalCount}, available ${remaining}`,
                    remaining,
                },
                { status: 429 }
            );
        }

        const newUsed = used + totalCount;
        await collection.updateOne(
            { apiKey },
            { $set: { used: newUsed } }
        );

        return NextResponse.json({
            valid: true,
            remaining: limit - newUsed,
            used: newUsed,
            limit,
            message: "LIMIT SUDAH DIKURANGI, JANGAN CANCEL/CLOSE VALIDATOR KARENA LIMIT TIDAK AKAN KEMBALI :)",
        });
    } catch {
        return NextResponse.json(
            { valid: false, message: "Server error" },
            { status: 500 }
        );
    }
}