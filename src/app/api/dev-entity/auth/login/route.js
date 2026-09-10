import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { adminSessionOptions } from "@/lib/entityAdminSessions";

export async function POST(req) {
    try {
        const { masterKey } = await req.json();

        if (!masterKey || masterKey !== process.env.ENTITY_MASTER_KEY) {
            return NextResponse.json(
                { success: false, message: "Invalid master key" },
                { status: 401 }
            );
        }

        const res = NextResponse.json({
            success: true,
            message: "Admin authenticated",
        });

        const session = await getIronSession(req, res, adminSessionOptions);
        session.admin = true;
        await session.save();

        return res;
    } catch (err) {
        console.error("Admin login error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
