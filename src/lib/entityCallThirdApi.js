/**
 * ENTITY GEROAN API PIHAK KATILU (JAGA-JAGA)
 *
 * SUPPORTED JANG AYEUNA :
 * - ipwho.is
 * - ipdetective (via RapidAPI)
 *
 * @param {string} visitorIp - IP address to lookup
 * @param {"ipwhois" | "ipdetective"} provider - API MANA NU REK DI PAKE
 * @returns {Promise<Object>} PARSED RESPONSE DATA
 */
export async function entityCallThirdApi(visitorIp, provider = "ipwhois") {
    if (!visitorIp) throw new Error("IP address is required");

    try {
        if (provider === "ipwhois") {
            const res = await fetch(`https://ipwho.is/${visitorIp}`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`ipwho.is failed: ${res.status}`);
            return await res.json();
        }

        if (provider === "ipdetective") {
            const res = await fetch(`https://ipdetective.p.rapidapi.com/ip/${visitorIp}?info=true`, {
                method: "GET",
                headers: {
                    "x-rapidapi-key": process.env.X_RAPID_API_KEY,
                    "x-rapidapi-host": "ipdetective.p.rapidapi.com",
                },
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`ipdetective failed: ${res.status}`);
            return await res.json();
        }

        throw new Error(`Unknown provider: ${provider}`);
    } catch (err) {
        console.error(`Failed to fetch IP info from ${provider}:`, err);
        return { visitorIp, provider, success: false, error: err.message };
    }
}
