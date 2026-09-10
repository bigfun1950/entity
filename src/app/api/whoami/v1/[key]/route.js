import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { UAParser } from "ua-parser-js";
import { getCountry, getAsn } from "@/lib/EntityGeoIp";
import { EntityApiSuccessRate } from "@/lib/entityApiSuccessRate";

import {
    EntityCountry,
    EntityDeviceCheck,
    EntityAsnCheck,
    EntityCidrCheck,
    EntityBotCheck,
    EntityRateLimit,
    EntityIpWhitelistCheck,
    EntityIpBlacklistCheck
} from "@/lib/EntityBlocker";

export async function GET(req, context) {
    const params = await context.params;
    const { key } = params;

    const apiKey = req.headers.get("x-entity-api-key");
    const visitorIp = req.headers.get("x-visitor-ip-asli") || req.headers.get('x-forwarded-for') || "";
    const userAgent = req.headers.get("x-visitor-user-agent") || "";

    const client = await clientPromise;
    const db = client.db("ENTITY");

    try {
        const allowed = await EntityRateLimit(visitorIp, 10, 60);
        if (!allowed) {
            await EntityApiSuccessRate({ key, owner: null, visitorIp, status: 429, success: false });
            return NextResponse.json(
                { error: "Too Many Requests - Rate limit exceeded" },
                { status: 429 }
            );
        }

        const user = await db.collection("users").findOne({ apikey: apiKey });

        if (!user) {
            await EntityApiSuccessRate({ key, owner: null, visitorIp, status: 401, success: false });
            return NextResponse.json({ error: "Invalid API Key" }, { status: 401 });
        }

        const shortlink = await db.collection("shortlinks").findOne({
            shortlinkKey: key,
            owner: user.username,
        });

        if (!shortlink) {
            await EntityApiSuccessRate({ key, owner: user.username, visitorIp, status: 404, success: false });
            return NextResponse.json({ error: "Shortlink not found" }, { status: 404 });
        }

        if (user.plan === "free") {
            await EntityApiSuccessRate({ key, owner: user.username, visitorIp, status: 403, success: false });
            return NextResponse.json({ error: "Free accounts cannot use Entity" }, { status: 403 });
        }

        if (shortlink.activeUrl === "need update" || !shortlink.activeUrl) {
            await EntityApiSuccessRate({ key, owner: user.username, visitorIp, status: 503, success: false });
            return NextResponse.json({ error: "No active URL available" }, { status: 503 });
        }

        const visitorCountry = await getCountry(visitorIp);
        const visitorAsn = await getAsn(visitorIp);

        const ua = new UAParser(userAgent);
        const deviceType = ua.getDevice().type || "desktop";

        const checks = [
            { fn: () => EntityIpWhitelistCheck(shortlink, visitorIp), reason: "whitelist", async: false },
            { fn: () => EntityIpBlacklistCheck(shortlink, visitorIp), reason: "ipBlacklist", async: false },
            { fn: () => EntityDeviceCheck(shortlink, userAgent), reason: "device", async: false },
            { fn: () => EntityCountry(shortlink, visitorIp, visitorCountry), reason: "country", async: false },
            { fn: () => EntityCidrCheck(shortlink, visitorIp), reason: "cidr", async: true },
            { fn: () => EntityAsnCheck(shortlink, visitorIp, visitorAsn), reason: "asn", async: false },
            { fn: () => EntityBotCheck(shortlink, visitorIp, req.headers), reason: "bot", async: true },
        ];

        const logBase = {
            shortlinkKey: key,
            owner: user.username,
            visitorIp,
            userAgent,
            visitorCountry,
            visitorAsn,
            deviceType,
            timestamp: new Date(),
        };

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentLog = await db.collection("visitors").findOne({
            visitorIp,
            shortlinkKey: key,
            timestamp: { $gte: oneHourAgo },
        });

        for (const check of checks) {
            const result = check.async ? await check.fn() : check.fn();
            if (result) {
                if (result?.bypass) {
                    if (!recentLog) {
                        await db.collection("visitors").insertOne({
                            ...logBase,
                            isBot: false,
                            isBlocked: false,
                            blockReason: null,
                            note: "Whitelisted IP",
                        });
                    }
                    await EntityApiSuccessRate({ key, owner: user.username, visitorIp, status: 302, success: true });
                    return NextResponse.redirect(shortlink.activeUrl, 302);
                }

                if (check.reason === "bot") {
                    await db.collection("bot_ips").insertOne({
                        visitorIp,
                        blockReason: check.reason,
                        isBot: true,
                    });
                }

                if (!recentLog) {
                    await db.collection("visitors").insertOne({
                        ...logBase,
                        isBot: ["bot", "cidr"].includes(check.reason),
                        isBlocked: true,
                        blockReason: check.reason,
                    });
                }
                await EntityApiSuccessRate({ key, owner: user.username, visitorIp, status: 403, success: false });
                return result instanceof Response
                    ? result
                    : NextResponse.json({ blocked: true, reason: check.reason });
            }
        }

        if (!recentLog) {
            await db.collection("visitors").insertOne({
                ...logBase,
                isBot: false,
                isBlocked: false,
                blockReason: null,
            });
        }
        await EntityApiSuccessRate({ key, owner: user.username, visitorIp, status: 302, success: true });
        return NextResponse.redirect(shortlink.activeUrl, 302);

    } catch (err) {

        await EntityApiSuccessRate({ key, owner: null, visitorIp, status: 500, success: false });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
