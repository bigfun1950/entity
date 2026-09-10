import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { adminSessionOptions } from "@/lib/entityAdminSessions";

export async function POST(req) {
    try {
        const res = NextResponse.json({ success: true, message: "Logged out" });
        const session = await getIronSession(req, res, adminSessionOptions);

        session.destroy();
        return res;
    } catch (err) {
        console.error("Admin logout error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
