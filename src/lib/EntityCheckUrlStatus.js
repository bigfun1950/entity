export default async function EntityCheckUrlStatus(url) {
    if (!url) return null;

    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

    const body = {
        client: { clientId: "entity-app", clientVersion: "1.0" },
        threatInfo: {
            threatTypes: [
                "MALWARE",
                "SOCIAL_ENGINEERING",
                "UNWANTED_SOFTWARE",
                "POTENTIALLY_HARMFUL_APPLICATION"
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }]
        }
    };

    try {
        let response;
        try {
            response = await fetch(url, { method: "HEAD", redirect: "manual" });
        } catch {
            try {
                response = await fetch(url, { method: "GET", redirect: "manual" });
            } catch {
                return "dead";
            }
        }

        if (!response.ok && response.status >= 400) {
            return "dead";
        }

        let safeData;
        try {
            const safeResponse = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            safeData = await safeResponse.json();
        } catch {
            return "dead";
        }

        if (safeData?.matches?.length > 0) {
            return "rf";
        }

        return "live";
    } catch {
        return "dead";
    }
}
