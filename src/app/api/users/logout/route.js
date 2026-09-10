import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";

export async function POST(req) {
    try {
        const res = NextResponse.json({ message: "Logged out successfully" });
        const session = await getIronSession(req, res, sessionOptions);

        session.destroy();
        return res;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
