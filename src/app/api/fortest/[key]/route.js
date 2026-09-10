import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { getCountry, getAsn } from "@/lib/EntityGeoIp";
import {
    EntityCountry,
    EntityDeviceCheck,
    EntityAsnCheck,
    EntityCidrCheck,
    EntityBotCheck,
    EntityIpWhitelistCheck,
    EntityIpBlacklistCheck
} from "@/lib/EntityBlockerPublic";
import { entityCallThirdApi } from "@/lib/entityCallThirdApi";

export async function GET(req, context) {
    const { key } = await context.params;

    const visitorIp = req.headers.get("x-visitor-ip-asli") || req.headers.get("x-forwarded-for") || "::1";

    const userAgent = req.headers.get("x-visitor-user-agent") || "";
    const ua = new UAParser(userAgent);
    const deviceType = ua.getDevice().type || "desktop";

    let ipwhois = {};
    try {
        ipwhois = (await entityCallThirdApi(visitorIp, "ipwhois")) || {};
    } catch (err) {
        console.error("ipwhois fetch failed:", err);
        ipwhois = {};
    }

    const {
        type: visitorIpType = null,
        country: visitorCountry = null,
        region = null,
        city = null,
        postal: zip = null,
        capital = null,
        latitude = null,
        longitude = null,
        calling_code: phoneNumberCodeRaw = null,
        connection: connectionRaw = {},
        timezone: timezoneRaw = {}
    } = ipwhois;

    const connection = {
        asn: connectionRaw.asn || null,
        isp: connectionRaw.isp || null
    };

    const timezone = {
        id: timezoneRaw.id || null,
        utc: timezoneRaw.utc || null,
        time_now: timezoneRaw.current_time || null
    };

    const phoneNumberCode = phoneNumberCodeRaw ? `+${phoneNumberCodeRaw}` : null;

    const [visitorCountryCode, visitorAsn] = await Promise.all([
        getCountry(visitorIp),
        getAsn(visitorIp)
    ]);

    try {
        if (visitorIp === req.headers.get("x-forwarded-for") && key === "entity") {
            return NextResponse.json({
                Entity: {
                    info: { success: true, message: "Welcome to Entity!" },
                    visitorIp,
                    visitorIpType,
                    visitorDevice: deviceType,
                    visitorCountry,
                    visitorCountryCode,
                    location: { region, city, zip, capital, latitude, longitude, phoneNumberCode },
                    connection,
                    timezone
                }
            }, { status: 200 });
        }

        if (key !== "x") {
            return NextResponse.json({
                message: "Who the fuck are you?"
            }, { status: 400 });
        }

        const shortlink = {
            shortlinkKey: key,
            activeUrl: "https://example.com",
            allowedDevice: "all",
            ipWhitelist: [],
            ipBlacklist: [],
            allowedCountry: "all",
        };

        const checks = [
            { fn: () => EntityIpWhitelistCheck(shortlink, visitorIp), reason: "whitelisted_ip", async: false },
            { fn: () => EntityIpBlacklistCheck(shortlink, visitorIp), reason: "ip_blacklist", async: false },
            { fn: () => EntityDeviceCheck(shortlink, userAgent), reason: "device_not_allowed", async: false },
            { fn: () => EntityCountry(shortlink, visitorIp, visitorCountryCode), reason: "country_blocked", async: false },
            { fn: () => EntityCidrCheck(shortlink, visitorIp), reason: "cidr_blocked", async: true },
            { fn: () => EntityAsnCheck(shortlink, visitorIp, visitorAsn), reason: "asn_blocked", async: false },
            { fn: () => EntityBotCheck(shortlink, visitorIp, req.headers), reason: "bot_detected", async: true }
        ];

        for (const check of checks) {
            let result;
            try {
                result = check.async ? await check.fn() : check.fn();
            } catch (err) {
                console.error(`Check failed (${check.reason}):`, err);
                result = null;
            }

            if (result) {
                const isBypass = result?.bypass || false;

                return NextResponse.json({
                    Entity: {
                        info: {
                            success: isBypass, blocked: !isBypass,
                            message: isBypass ? "whitelisted" : "visitor_blocked",
                            reason: check.reason,
                        },
                        visitorIp,
                        visitorIpType,
                        visitorDevice: deviceType,
                        visitorCountry,
                        visitorCountryCode,
                        location: { region, city, zip, capital, latitude, longitude, phoneNumberCode },
                        connection,
                        timezone
                    },
                }, { status: isBypass ? 200 : 403 });
            }
        }

        return NextResponse.json({
            Entity: {
                info: { success: true, blocked: false, message: "visitor_allowed" },
                visitorIp,
                visitorIpType,
                visitorDevice: deviceType,
                visitorCountry,
                visitorCountryCode,
                location: { region, city, zip, capital, latitude, longitude, phoneNumberCode },
                connection,
                timezone
            },
        }, { status: 200 });

    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json({
            success: false,
            blocked: true,
            reason: "internal_server_error",
            visitorIp,
            deviceType,
            visitorCountry,
            visitorAsn,
            message: err.message || "unexpected_error"
        }, { status: 500 });
    }
}
