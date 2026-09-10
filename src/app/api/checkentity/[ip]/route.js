import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import clientPromise from "@/lib/mongodb";
import { getCountry, getAsn } from "@/lib/EntityGeoIp";
import { entityCallThirdApi } from "@/lib/entityCallThirdApi";

import {
    EntityCountry,
    EntityDeviceCheck,
    EntityAsnCheck,
    EntityCidrCheck,
    EntityBotCheck,
    EntityIpWhitelistCheck,
    EntityIpBlacklistCheck,
} from "@/lib/EntityBlockerPublic";

const ipRegex =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$|^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9])?[0-9]))$/;

export async function GET(req, context) {
    const { ip } = await context.params;
    const visitorIp = ip;

    const ipwhois = await entityCallThirdApi(visitorIp, "ipwhois");

    if (!ipRegex.test(visitorIp)) {
        return NextResponse.json(
            {
                message: "Welcome To Entity Public Api Endpoint!",
            },
            { status: 400 }
        );
    }

    const userAgent = req.headers.get("x-visitor-user-agent") || req.headers.get("user-agent") || "";
    const ua = new UAParser(userAgent);
    const deviceType = ua.getDevice().type || "desktop";

    try {
        const [visitorCountryCode, visitorAsn] = await Promise.all([
            getCountry(visitorIp),
            getAsn(visitorIp),
        ]);

        const responseObj = {
            Entity: {
                visitorIp,
                visitorIpType: ipwhois.type,
                visitorDevice: deviceType,
                visitorCountry: ipwhois.country,
                visitorCountryCode,
                location: {
                    region: ipwhois.region,
                    city: ipwhois.city,
                    zip: ipwhois.postal,
                    capital: ipwhois.capital,
                    latitude: ipwhois.latitude,
                    longitude: ipwhois.longitude,
                    phoneNumberCode: `+${ipwhois.calling_code}`,
                },
                connection: {
                    asn: ipwhois.connection.asn,
                    isp: ipwhois.connection.isp,
                },
                timezone: {
                    id: ipwhois.timezone.id,
                    utc: ipwhois.timezone.utc,
                    time_now: ipwhois.timezone.current_time,
                },
            },
        };

        const client = await clientPromise;
        const db = client.db("ENTITY");
        await db.collection("checked_ip").updateOne(
            { visitorIp },
            { $setOnInsert: { firstSeen: new Date(), response: responseObj } },
            { upsert: true }
        );

        const shortlink = {
            shortlinkKey: visitorIp,
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
            { fn: () => EntityBotCheck(shortlink, visitorIp, req.headers), reason: "bot_detected", async: true },
        ];

        for (const check of checks) {
            const result = check.async ? await check.fn() : check.fn();
            if (result) {
                const isBypass = result?.bypass || false;
                return NextResponse.json(
                    {
                        Entity: {
                            visitorIp,
                            visitorIpType: ipwhois.type,
                            visitorDevice: deviceType,
                            visitorCountry: ipwhois.country,
                            visitorCountryCode,
                            location: {
                                region: ipwhois.region,
                                city: ipwhois.city,
                                zip: ipwhois.postal,
                                capital: ipwhois.capital,
                                latitude: ipwhois.latitude,
                                longitude: ipwhois.longitude,
                                phoneNumberCode: `+${ipwhois.calling_code}`
                            },
                            connection: {
                                asn: ipwhois.connection.asn,
                                isp: ipwhois.connection.isp
                            },
                            timezone: {
                                id: ipwhois.timezone.id,
                                utc: ipwhois.timezone.utc,
                                time_now: ipwhois.timezone.current_time
                            },
                        },
                    },
                    { status: isBypass ? 200 : 403 }
                );
            }
        }

        return NextResponse.json(
            {
                Entity: {
                    visitorIp,
                    visitorIpType: ipwhois.type,
                    visitorDevice: deviceType,
                    visitorCountry: ipwhois.country,
                    visitorCountryCode,
                    location: {
                        region: ipwhois.region,
                        city: ipwhois.city,
                        zip: ipwhois.postal,
                        capital: ipwhois.capital,
                        latitude: ipwhois.latitude,
                        longitude: ipwhois.longitude,
                        phoneNumberCode: `+${ipwhois.calling_code}`
                    },
                    connection: {
                        asn: ipwhois.connection.asn,
                        isp: ipwhois.connection.isp
                    },
                    timezone: {
                        id: ipwhois.timezone.id,
                        utc: ipwhois.timezone.utc,
                        time_now: ipwhois.timezone.current_time
                    },
                },
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                blocked: true,
                reason: "internal_server_error",
                visitorIp,
                deviceType,
                visitorCountry: null,
                visitorAsn: null,
                status: 500,
                message: err.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}
