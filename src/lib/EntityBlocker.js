import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import IPRouter from "ip-router";
import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { redis } from "@/lib/EntityRateLimiter";
import { EntityUaHeadersCheck } from "@/lib/EntityUaHeadersCheck";
import { entityCallThirdApi } from "@/lib/entityCallThirdApi";

/* ---------------- Rate Limiting with Upstash Redis ---------------- */
export async function EntityRateLimit(visitorIp, limit = 5, windowSec = 60) {
    const key = `EntityRateLimiter:${visitorIp}`;
    const count = await redis.incr(key);
    if (count === 1) {
        await redis.expire(key, windowSec);
    }
    return count <= limit;
}

/* ---------------- Entity Helpers (JANG LOAD DB) ---------------- */
const listCache = new Map();
const watchers = new Map();

export async function loadList(filename) {
    if (listCache.has(filename)) {
        return listCache.get(filename);
    }

    const filePath = path.join(process.cwd(), "src/lib/EntityDB", filename);
    const content = await fs.readFile(filePath, "utf8");
    const list = content
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    listCache.set(filename, list);

    if (!watchers.has(filename)) {
        const watcher = fssync.watch(filePath, async (eventType) => {
            if (eventType === "change") {
                try {
                    const updated = await fs.readFile(filePath, "utf8");
                    const parsed = updated
                        .split("\n")
                        .map(l => l.trim())
                        .filter(Boolean);
                    listCache.set(filename, parsed);
                } catch {
                    // JANG LOG ERROR
                }
            }
        });
        watchers.set(filename, watcher);
    }

    return list;
}

/* ---------------- Entity Constants ---------------- */
const RANDOM_REDIRECTS = [
    "https://rickroll.it/",
    "https://http.cat/404",
    "https://http.cat/403",
    "https://http.cat/500",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
];

const BLOCKED_ASN_PATTERNS = [
    "GOOGLE", "AMAZON", "MICROSOFT", "DIGITALOCEAN", "OVH", "LINODE",
    "FACEBOOK", "TWITTER", "CLOUDFLARE", "FASTLY", "TALKTALK", "AKAMAI",
    "VIRGIN MEDIA", "ESTNOC", "HETZNER", "SOFTLAYER", "IBM", "ORACLE",
    "YAHOO", "LIMESTONE NETWORKS", "BELL CANADA", "PACKETHUB",
    "VIDEOTRON LTEE", "M247 EUROPE SRL", "APPLE-ENGINEERING", "MIDCONTINENT", "SHARKTECH", "DEDICATED.COM",
    "WEB OBJECTS LLC", "HOSTROYALE", "QUICKPACKET", "AS-VULTR", "UAB", "J&Y", "LEASEWEB", "DATACAMP LIMITED", "BITDEFENDER",
    "AS-COLOCROSSING", "LOGICWEB", "SUPERHOSTING", "HOSTPAPA", "UGA-ASN", "SCALEWAY", "PHMGMT", "LATITUDE-SH", "KDDI", "BUCKLOG",
    "WOW", "AVAST", "SECURE-AXCESS", "CZECHIA", "CLOUDFRONT", "EDGECAST", "CDN77", "STACKPATH", "ADVIN SERVICES LLC",
];

/* ---------------- Entity Blocker (BLOCK VISITOR NU GEUS KA FILTER) ---------------- */
export function EntityBlock(shortlink, reason) {
    const br = shortlink.botRedirection;

    if (!br) {
        return NextResponse.json(
            { error: reason || "Blocked" },
            { status: 403 }
        );
    }

    if (!isNaN(br)) {
        const status = parseInt(br, 10);

        const defaultMessages = {
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            500: "Internal Server Error",
        };

        return NextResponse.json(
            { error: reason || defaultMessages[status] || "Blocked" },
            { status }
        );
    }

    if (/^https?:\/\//i.test(br)) {
        return NextResponse.redirect(br, 302);
    }

    if (br === "random") {
        const url = RANDOM_REDIRECTS[Math.floor(Math.random() * RANDOM_REDIRECTS.length)];
        return NextResponse.redirect(url, 302);
    }

    return NextResponse.json(
        { error: reason || "Blocked" },
        { status: 403 }
    );
}

/* ---------------- Entity Allow Whitelisted IPs (ALLOW KABEH IP NU DI WHITELIST) ---------------- */
export function EntityIpWhitelistCheck(shortlink, visitorIp) {
    const whitelist = Array.isArray(shortlink.ipWhitelist) ? shortlink.ipWhitelist : [];
    if (whitelist.includes(visitorIp)) {
        return { bypass: true };
    }
    return null;
}

/* ---------------- Entity Block Blacklisted IPs (BLOCK KABEH IP NU KA BLACKLIST) ---------------- */
export function EntityIpBlacklistCheck(shortlink, visitorIp) {
    const ips = Array.isArray(shortlink.ipBlacklist) ? shortlink.ipBlacklist : [];
    if (ips.includes(visitorIp)) {
        return EntityBlock(shortlink);
    }
    return null;
}

/* ---------------- Entity Cek Device (CEK MOBILE/TABLET/DESKTOP) ---------------- */
export function EntityDevice(userAgent) {
    const type = new UAParser(userAgent).getDevice().type || "desktop";
    return { deviceType: type, isMobile: ["mobile", "tablet"].includes(type), isDesktop: type === "desktop" };
}

/* ---------------- Entity Block Device (KECUALI ANU ALLOWED) ---------------- */
export function EntityDeviceCheck(shortlink, userAgent) {
    if (shortlink.allowedDevice === "both") return null;

    const { deviceType, isMobile, isDesktop } = EntityDevice(userAgent);
    const allowed = shortlink.allowedDevice;

    if ((allowed === "mobile" && !isMobile) || (allowed === "desktop" && !isDesktop)) {
        return EntityBlock(shortlink);
    }
    return null;
}

/* ---------------- Entity Block Country (KECUALI ANU ALLOWED) ---------------- */
export function EntityCountry(shortlink, visitorIp, visitorCountry) {
    if (shortlink.allowedCountry && shortlink.allowedCountry !== "all" && shortlink.allowedCountry !== visitorCountry) {
        return EntityBlock(shortlink);
    }
    return null;
}

/* ---------------- Entity Block ASN (ANU GEUS KAFILTER BOT) ---------------- */
export function EntityAsnCheck(shortlink, visitorIp, asnInfo) {
    const org = asnInfo?.org || asnInfo?.autonomous_system_organization;
    if (!org) {
        return null;
    }

    const orgUpper = org.toUpperCase();

    if (BLOCKED_ASN_PATTERNS.some(p => orgUpper.includes(p))) {
        return EntityBlock(shortlink);
    }

    return null;
}

let cidrRouter;

async function buildCidrRouter(cidrList) {
    const router = new IPRouter();
    cidrList.forEach(cidr => router.insert(cidr, true));
    return router;
}

async function getCidrRouter() {
    if (!cidrRouter) {
        const cidrList = await loadList("entity.cidr");
        cidrRouter = await buildCidrRouter(cidrList);

        const filePath = path.join(process.cwd(), "src/lib/EntityDB", "entity.cidr");
        fssync.watch(filePath, async (eventType) => {
            if (eventType === "change") {
                try {
                    const updatedText = await fs.readFile(filePath, "utf8");
                    const updated = updatedText
                        .split("\n")
                        .map(l => l.trim())
                        .filter(Boolean);

                    cidrRouter = await buildCidrRouter(updated);
                } catch (err) {
                    // JANG LOG ERROR
                }
            }
        });
    }
    return cidrRouter;
}

/* ---------------- Entity Block CIDR (BLOCK KABEH IP DATACENTER NU KA LIST DI entity.cidr) ---------------- */
export async function EntityCidrCheck(shortlink, visitorIp) {
    const router = await getCidrRouter();
    if (router.route(visitorIp)) {
        return EntityBlock(shortlink);
    }
    return null;
}

/* ---------------- Entity Block Bots (BLOCK KABEH IP BOT NU KA LIST DI entity.bots) ---------------- */
export async function EntityBotCheck(shortlink, visitorIp, headers) {
    const botList = await loadList("entity.bots");
    const botSet = new Set(botList);
    if (botSet.has(visitorIp)) {
        return EntityBlock(shortlink);
    }

    const { score, reasons, risk } = await EntityUaHeadersCheck(headers);

    const BLOCK_THRESHOLD = 7;

    if (score >= BLOCK_THRESHOLD) {
        // return EntityBlock(shortlink, `Risk Level: ${risk}, Score: ${score}, Reasons: ${reasons}`);
        return EntityBlock(shortlink);
    }

    try {
        const detective = await entityCallThirdApi(visitorIp, "ipdetective");
        if (detective?.bot === true) {
            return EntityBlock(shortlink);
        }
    } catch (err) {
        console.error("EntityBotCheck third-party fallback failed:", err);
    }
    return null;
}
