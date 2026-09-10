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

        const { userId } = await req.json();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const objectId = new ObjectId(userId);

        const userResult = await db.collection("users").deleteOne({ _id: objectId });
        if (userResult.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const collectionsToClean = ["notifications", "shortlinks", "statusLogs", "visitors"];
        await Promise.all(
            collectionsToClean.map((col) =>
                db.collection(col).deleteMany({ userId: objectId })
            )
        );

        return NextResponse.json({ success: true, message: "User and related data deleted successfully" });
    } catch (err) {
        console.error("Delete User Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
