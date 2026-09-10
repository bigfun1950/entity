import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
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

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const result = await db.collection("bot_ips").deleteMany({});
        return NextResponse.json({ success: true, deleted: result.deletedCount });
    } catch (err) {
        console.error("Delete bot_ips Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
