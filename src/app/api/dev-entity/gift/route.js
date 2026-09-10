import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getIronSession } from "iron-session";
import { adminSessionOptions } from "@/lib/entityAdminSessions";

export async function POST(req) {
    try {
        const res = NextResponse.next();
        const session = await getIronSession(req, res, adminSessionOptions);

        if (!session.admin) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { userId, message, url } = await req.json();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        await db.collection("notifications").insertOne({
            userId: new ObjectId(userId),
            username: user.username,
            type: "gift",
            url: url,
            message: message,
            createdAt: new Date(),
            read: false,
        });

        return NextResponse.json({
            success: true,
            message: "Gift notification sent successfully!",
        });
    } catch (err) {
        console.error("Gift API Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
