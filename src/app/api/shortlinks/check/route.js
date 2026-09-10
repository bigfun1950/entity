import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import EntityCheckUrlStatus from "@/lib/EntityCheckUrlStatus";

export async function POST(req) {
    try {
        const { shortlinkKey, owner } = await req.json();

        if (!shortlinkKey || !owner) {
            return NextResponse.json({ message: "Missing required fields!" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const shortlink = await db.collection("shortlinks").findOne({ shortlinkKey, owner });
        if (!shortlink) {
            return NextResponse.json({ message: "Shortlink not found." }, { status: 404 });
        }

        const firstUrlStatus = shortlink.firstUrl ? await EntityCheckUrlStatus(shortlink.firstUrl) : null;
        const secondUrlStatus = shortlink.secondUrl ? await EntityCheckUrlStatus(shortlink.secondUrl) : null;

        let activeUrl = null;
        if (firstUrlStatus === "live") activeUrl = shortlink.firstUrl;
        else if (secondUrlStatus === "live") activeUrl = shortlink.secondUrl;
        else activeUrl = "need update";

        await db.collection("shortlinks").updateOne(
            { shortlinkKey, owner },
            {
                $set: {
                    firstUrlStatus,
                    secondUrlStatus,
                    activeUrl,
                    updatedAt: new Date(),
                },
            }
        );

        return NextResponse.json(
            {
                shortlinkKey,
                firstUrl: shortlink.firstUrl,
                firstUrlStatus,
                secondUrl: shortlink.secondUrl,
                secondUrlStatus,
                activeUrl,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
