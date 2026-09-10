import clientPromise from "@/lib/mongodb";

/**
 * LOGS RASIO SUKSES AKSES API
 *
 * @param {Object} params
 * @param {string} params.key - KEY SHORTLINK
 * @param {string|null} params.owner - USERNAME (LAMUN AYA)
 * @param {string} params.visitorIp - Visitors IP
 * @param {number} params.status - HTTP STATUS KODE
 * @param {boolean} params.success - TRUE LAMUN REDIREK, SELAIN ETA FALSE
 */
export async function EntityApiSuccessRate({ key, owner, visitorIp, status, success }) {
    try {
        if (!key || !visitorIp || typeof status !== "number") {
            throw new Error("Invalid parameters passed to EntityApiSuccessRate");
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const now = new Date();
        const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}`;

        await db.collection("statusLogs").updateOne(
            { key, visitorIp, hourKey },
            {
                $set: {
                    key,
                    owner: owner || null,
                    visitorIp,
                    status,
                    success,
                    hourKey,
                    timestamp: now,
                },
            },
            { upsert: true }
        );
    } catch (err) {
        console.error("Failed to log API success rate:", err);
    }
}
