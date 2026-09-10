import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import clientPromise from "@/lib/mongodb";
import { sessionOptions } from "@/lib/entityUserSessions";

export async function POST(req, context) {
    try {
        const res = NextResponse.next();
        const session = await getIronSession(req, res, sessionOptions);

        if (!session.user) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }

        const owner = session.user.username;

        const params = await context.params;
        const { key } = params;
        const shortlinkKey = key;

        if (!shortlinkKey) {
            return NextResponse.json({ success: false, message: "Missing shortlink key" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const result = await db.collection("visitors").deleteMany({
            owner,
            shortlinkKey,
        });

        const statusResult = await db.collection("statusLogs").deleteMany({
            owner,
            key: shortlinkKey,
        });

        return NextResponse.json({
            success: true,
            message: `Deleted ${result.deletedCount} visitor logs and ${statusResult.deletedCount} status logs for shortlink : ${shortlinkKey}`,
        });
    } catch (error) {
        console.error("Error clearing visitor logs:", error);
        return NextResponse.json({ success: false, message: "Failed to clear logs." }, { status: 500 });
    }
}
