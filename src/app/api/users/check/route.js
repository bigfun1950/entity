import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req) {
    const res = NextResponse.next();
    const session = await getIronSession(req, res, sessionOptions);

    if (!session.user) {
        return NextResponse.json(
            { success: false, message: "Not authenticated" },
            { status: 401 }
        );
    }

    if (session.user.expiresAt && Date.now() > session.user.expiresAt) {
        await session.destroy();
        return NextResponse.json(
            { success: false, message: "Session expired, please log in again." },
            { status: 401 }
        );
    }

    const client = await clientPromise;
    const db = client.db("ENTITY");
    await db.collection("users").updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: { lastLogin: new Date() } }
    );

    return NextResponse.json({ success: true, user: session.user, expiresAt: session.user.expiresAt, });
}
