import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import clientPromise from "@/lib/mongodb";
import { sessionOptions } from "@/lib/entityUserSessions";

export async function DELETE(req, context) {
    try {
        const res = NextResponse.next();
        const session = await getIronSession(req, res, sessionOptions);

        if (!session.user) {
            return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
        }
        const owner = session.user.username;

        if (!owner) {
            return NextResponse.json(
                { success: false, error: "Missing owner parameter" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const [statusLogsResult, visitorsResult, shortlinksResult] = await Promise.all([
            db.collection("statusLogs").deleteMany({ owner }),
            db.collection("visitors").deleteMany({ owner }),
        ]);

        return NextResponse.json({
            success: true,
            message: "All statistics cleared successfully.",
            deleted: {
                statusLogs: statusLogsResult.deletedCount,
                visitors: visitorsResult.deletedCount,
            },
        });
    } catch (err) {
        console.error("Failed to clear statistics:", err);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
