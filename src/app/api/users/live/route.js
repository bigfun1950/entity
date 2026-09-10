import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
    try {
        const client = await clientPromise;
        const db = client.db("ENTITY");
        const users = db.collection("users");

        const url = new URL(req.url);
        const username = url.searchParams.get("username");

        if (!username) {
            return NextResponse.json(
                { success: false, message: "Missing username" },
                { status: 400 }
            );
        }

        let user = await users.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (user.expiresAt && new Date(user.expiresAt) <= new Date()) {
            if (user.plan !== "free") {
                const newFreeExpiry = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

                await users.updateOne(
                    { username },
                    { $set: { plan: "free", expiresAt: newFreeExpiry } }
                );

                user.plan = "free";
                user.expiresAt = newFreeExpiry;
            } else {
                return NextResponse.json(
                    { success: false, message: "Free expired" },
                    { status: 401 }
                );
            }
        }

        const responseUser = {
            username: user.username,
            apikey: user.apikey,
            plan: user.plan,
            shortlinksLimit: user.shortlinksLimit,
            totalShortlinks: user.totalShortlinks,
            createdAt: user.createdAt,
            expiresAt: user.expiresAt
        };

        return NextResponse.json({ success: true, user: responseUser });
    } catch (err) {
        console.error("Entity Live API Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
