import clientPromise from "@/lib/mongodb";
import EntityCheckUrlStatus from "@/lib/EntityCheckUrlStatus";

export async function PUT(req) {
    try {
        const {
            shortlinkKey,
            owner,
            firstUrl,
            secondUrl,
            allowedDevice,
            allowedCountry,
            botRedirection,
            originalShortlinkKey,
            ipBlacklist,
            ipWhitelist
        } = await req.json();

        const lookupKey = originalShortlinkKey || shortlinkKey;

        if (!shortlinkKey || !owner) {
            return new Response(
                JSON.stringify({ message: "Missing required fields!" }),
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        if (shortlinkKey !== lookupKey) {
            const existing = await db.collection("shortlinks").findOne({
                owner,
                shortlinkKey,
            });
            if (existing) {
                return new Response(
                    JSON.stringify({
                        message:
                            "Shortlink key already exists! Please choose another key.",
                    }),
                    { status: 409 }
                );
            }
        }

        const updateFields = {};
        let firstUrlStatus, secondUrlStatus;

        if (firstUrl !== undefined) {
            firstUrlStatus = await EntityCheckUrlStatus(firstUrl);
            updateFields.firstUrl = firstUrl;
            updateFields.firstUrlStatus = firstUrlStatus;
        }

        if (secondUrl !== undefined) {
            secondUrlStatus = await EntityCheckUrlStatus(secondUrl);
            updateFields.secondUrl = secondUrl;
            updateFields.secondUrlStatus = secondUrlStatus;
        }

        if (firstUrl !== undefined || secondUrl !== undefined) {
            updateFields.activeUrl =
                firstUrlStatus === "live"
                    ? firstUrl
                    : secondUrlStatus === "live"
                        ? secondUrl
                        : "need update";
        }

        if (shortlinkKey !== undefined) updateFields.shortlinkKey = shortlinkKey;
        if (allowedDevice !== undefined) updateFields.allowedDevice = allowedDevice;
        if (allowedCountry !== undefined) updateFields.allowedCountry = allowedCountry;
        if (botRedirection !== undefined) updateFields.botRedirection = botRedirection;
        if (ipBlacklist !== undefined) updateFields.ipBlacklist = ipBlacklist;
        if (ipWhitelist !== undefined) updateFields.ipWhitelist = ipWhitelist;

        updateFields.updatedAt = new Date();

        const result = await db.collection("shortlinks").updateOne(
            { shortlinkKey: lookupKey, owner },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            return new Response(
                JSON.stringify({
                    message: "Shortlink not found or not owned by user.",
                }),
                { status: 404 }
            );
        }

        return new Response(
            JSON.stringify({ message: "Shortlink updated!" }),
            { status: 200 }
        );
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
            status: 500,
        });
    }
}
