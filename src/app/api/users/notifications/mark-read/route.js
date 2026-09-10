import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";

export async function POST(req) {
    try {
        const res = new Response();
        const session = await getIronSession(req, res, sessionOptions);

        if (!session.user) {
            return NextResponse.json(
                { success: false, message: "Not authenticated" },
                { status: 401 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");
        const notifications = db.collection("notifications");

        await notifications.updateMany(
            { username: session.user.username, read: false },
            { $set: { read: true } }
        );

        return NextResponse.json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (err) {
        console.error("Notifications Mark-Read Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
