import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import EntityCheckUrlStatus from "@/lib/EntityCheckUrlStatus";
import { ObjectId } from "mongodb";

export async function POST(req) {
    try {
        const { owner } = await req.json();
        if (!owner) {
            return NextResponse.json({ message: "Missing owner!" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");
        const shortlinks = await db.collection("shortlinks").find({ owner }).toArray();

        await Promise.all(
            shortlinks.map(async (shortlink) => {
                const firstUrlStatus = shortlink.firstUrl
                    ? await EntityCheckUrlStatus(shortlink.firstUrl)
                    : null;

                const secondUrlStatus = shortlink.secondUrl
                    ? await EntityCheckUrlStatus(shortlink.secondUrl)
                    : null;

                let activeUrl = "need update";
                if (firstUrlStatus === "live") activeUrl = shortlink.firstUrl;
                else if (secondUrlStatus === "live") activeUrl = shortlink.secondUrl;

                await db.collection("shortlinks").updateOne(
                    { _id: new ObjectId(shortlink._id) },
                    {
                        $set: {
                            firstUrlStatus,
                            secondUrlStatus,
                            activeUrl,
                            updatedAt: new Date(),
                        },
                    }
                );
            })
        );

        const updatedShortlinks = await db
            .collection("shortlinks")
            .find({ owner })
            .toArray();

        return NextResponse.json({ shortlinks: updatedShortlinks }, { status: 200 });
    } catch (error) {
        console.error("Auto update error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
