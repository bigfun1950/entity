import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";

export async function GET(req) {
    try {
        const res = new Response();
        const session = await getIronSession(req, res, sessionOptions);

        if (!session.user) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const notifications = await db
            .collection("notifications")
            .find({ username: session.user.username })
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, notifications });
    } catch (err) {
        console.error("Notifications API Error:", err);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
