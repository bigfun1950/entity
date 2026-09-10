import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";

export async function GET(req) {
    try {
        const res = NextResponse.next();
        const session = await getIronSession(req, res, sessionOptions);

        if (!session.user) {
            return NextResponse.json(
                { message: "Not authenticated" },
                { status: 401 }
            );
        }

        let { id, username, email, apikey, totalShortlinks, shortlinksLimit, plan, createdAt } = session.user;

        if (createdAt) {
            createdAt = new Date(createdAt);
        }

        return NextResponse.json({
            user: { id, username, email, apikey, totalShortlinks, shortlinksLimit, plan, createdAt },
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}