import fetch from "node-fetch";
import fs from "fs";
import path from "path";

let validLanguageSubtags = null;

function EntityLoadLanguageSubtags() {
    if (validLanguageSubtags) return validLanguageSubtags;

    const filePath = path.resolve(
        process.cwd(),
        "src/lib/EntityDB/entity.subtag"
    );
    const text = fs.readFileSync(filePath, "utf8");

    const lines = text.split("\n");
    const subtags = new Set();
    let isLanguageBlock = false;

    for (const line of lines) {
        if (line.startsWith("%%")) {
            isLanguageBlock = false;
        } else if (line.startsWith("Type: language")) {
            isLanguageBlock = true;
        } else if (isLanguageBlock && line.startsWith("Subtag:")) {
            subtags.add(line.split(":")[1].trim().toLowerCase());
        }
    }

    validLanguageSubtags = subtags;
    return validLanguageSubtags;
}

const STRICT_LANG_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?$/;

export async function EntityIsValidLanguageTag(tag) {
    const [langPart] = tag.split(";").map(s => s.trim());

    if (!STRICT_LANG_REGEX.test(langPart)) return false;

    const parts = langPart.split("-");
    const language = parts[0].toLowerCase();
    const region = parts[1] ? parts[1].toUpperCase() : null;

    const subtags = await EntityLoadLanguageSubtags();

    if (!subtags.has(language)) return false;
    if (region && !/^[A-Z]{2}$/.test(region)) return false;

    return true;
}

export async function EntityValidateAcceptLanguage(header) {
    if (!header) return false;

    const tags = header.split(",").map(l => l.trim());
    for (const tag of tags) {
        if (!(await EntityIsValidLanguageTag(tag))) return false;
    }
    return true;
}

const BAD_UA_PATTERNS = /(curl|wget|python|java|node|axios|go-http-client|scrapy|phantom|selenium|headless|bot|spider|crawler)/i;

const UA_RISK_WEIGHTS = {
    bad_ua: 6,
    invalid_accept: 2,
    invalid_accept_language: 2,
    missing_sec_ch_ua: 3,
    missing_sec_fetch: 2,
    no_encoding: 2
};

export async function EntityUaHeadersCheck(headers) {
    const userAgent = headers.get("x-visitor-user-agent") || headers.get("user-agent") || "";
    const accept = headers.get("x-visitor-accept") || headers.get("accept") || "";
    const acceptLang = headers.get("x-visitor-accept-language") || headers.get("accept-language") || "";
    const encoding = headers.get("x-visitor-accept-encoding") || headers.get("accept-encoding") || "";
    const secFetch = headers.get("x-visitor-sec-fetch-site") || headers.get("sec-fetch-site") || "";
    const secChUa = headers.get("x-visitor-sec-ch-ua") || headers.get("sec-ch-ua") || "";

    let score = 0;
    const reasons = [];

    if (!userAgent || userAgent.length < 10 || BAD_UA_PATTERNS.test(userAgent)) {
        score += UA_RISK_WEIGHTS.bad_ua;
        reasons.push("bad_ua - suspicious user-agent");
    }

    if (!accept.includes("text/html")) {
        score += UA_RISK_WEIGHTS.invalid_accept;
        reasons.push(`invalid_accept - Accept header "${accept}" missing "text/html"`);
    }

    if (!(await EntityValidateAcceptLanguage(acceptLang))) {
        score += UA_RISK_WEIGHTS.invalid_accept_language;
        reasons.push(`invalid_accept_language - Accept-Language "${acceptLang}" invalid`);
    }

    if (!secChUa && /Chrome|Safari|Firefox/i.test(userAgent)) {
        score += UA_RISK_WEIGHTS.missing_sec_ch_ua;
        reasons.push("missing_sec_ch_ua - missing sec-ch-ua header for browser");
    }

    if (!secFetch && /Chrome|Safari|Firefox/i.test(userAgent)) {
        score += UA_RISK_WEIGHTS.missing_sec_fetch;
        reasons.push("missing_sec_fetch - missing sec-fetch-site header for browser");
    }

    if (!encoding.includes("gzip") && !encoding.includes("br")) {
        score += UA_RISK_WEIGHTS.no_encoding;
        reasons.push(`no_encoding - Accept-Encoding "${encoding}" missing gzip/br`);
    }

    let risk;
    if (score >= 7) {
        risk = "high";
    } else if (score >= 4) {
        risk = "medium";
    } else {
        risk = "low";
    }

    return { score, reasons, risk };
}
