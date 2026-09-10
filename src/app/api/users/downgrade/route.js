import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";
import { ObjectId } from "mongodb";

export async function POST(req) {
    try {
        const res = NextResponse.next();
        const session = await getIronSession(req, res, sessionOptions);

        if (!session.user) {
            return NextResponse.json(
                { success: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");
        const users = db.collection("users");

        const userId = new ObjectId(session.user.id);
        const user = await users.findOne({ _id: userId });
        if (!user) {
            session.destroy();
            return NextResponse.json(
                { success: false, message: "User not found, logging out" },
                { status: 401 }
            );
        }

        const newFreeExpiry = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);

        await users.updateOne(
            { _id: userId },
            { $set: { plan: "free", shortlinksLimit: 1, expiresAt: newFreeExpiry } }
        );

        await db.collection("notifications").insertOne({
            userId: userId,
            username: user.username,
            type: "subscription",
            message: "Your subscription expired and was downgraded to Free.",
            createdAt: new Date(),
            read: false,
        });

        session.user.plan = "free";
        session.user.expiresAt = newFreeExpiry.getTime();
        await session.save();

        return NextResponse.json({
            success: true,
            message: "Subscription downgraded to free!",
            expiresAt: newFreeExpiry,
        });
    } catch (err) {
        console.error("Downgrade API Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
