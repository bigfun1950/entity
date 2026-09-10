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

        const { plan } = await req.json();

        const subscriptionPlans = {
            free: { durationMs: 1 * 24 * 60 * 60 * 1000 },
            pro: { durationMs: 7 * 24 * 60 * 60 * 1000 },
        };

        if (!subscriptionPlans[plan]) {
            return NextResponse.json(
                { success: false, message: "Invalid subscription plan" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");
        const users = db.collection("users");

        const newExpiresAt = new Date(Date.now() + subscriptionPlans[plan].durationMs);

        await users.updateOne(
            { username: session.user.username },
            { $set: { plan: plan, shortlinksLimit: 5, expiresAt: newExpiresAt } }
        );

        const userId = new ObjectId(session.user.id);
        await db.collection("notifications").insertOne({
            userId: userId,
            username: session.user.username,
            type: "subscription",
            message: `Your subscription successfully upgraded to PRO (7 Day)!`,
            createdAt: new Date(),
            read: false,
        });

        session.user.plan = plan;
        session.user.expiresAt = newExpiresAt.getTime();
        await session.save();

        return NextResponse.json({
            success: true,
            message: `Subscription upgraded to ${plan}!`,
            plan,
            expiresAt: newExpiresAt,
        });

    } catch (err) {
        console.error("Paid API Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
