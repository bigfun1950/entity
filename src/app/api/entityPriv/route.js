import clientPromise from "@/lib/validatorMongoDb";

export async function POST(request) {
    try {
        const { email, apiKey } = await request.json();
        if (!email || !apiKey) {
            return Response.json({ email, status: "Email and API key required", mx: "N/A" }, { status: 400 });
        }

        const rfc5322EmailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:[\x01-\x08\x0b\x0c\x0e-\x7f]+)\]))$/;

        if (!rfc5322EmailRegex.test(email)) {
            return Response.json({ email, status: "Invalid email format", mx: "N/A" });
        }

        const client = await clientPromise;
        const db = client.db("EntityBounce");
        const collection = db.collection("entityInfo");

        const keyData = await collection.findOne({ apiKey });
        if (!keyData) {
            return Response.json({ email, status: "Invalid API key", mx: "N/A" }, { status: 401 });
        }

        const now = new Date();
        const lastReset = new Date(keyData.lastReset);
        const resetTime = keyData.reset === "1day" ? 24 * 60 * 60 * 1000 : 0;

        if (now - lastReset >= resetTime) {
            await collection.updateOne({ apiKey }, { $set: { used: 0, lastReset: now } });
            keyData.used = 0;
        }

        if (keyData.used >= keyData.limit) {
            return Response.json({ email, status: "Limit exceeded", mx: "N/A" });
        }

        await collection.updateOne({ apiKey }, { $inc: { used: 1 } });

        const url = `${process.env.API}=${encodeURIComponent(email)}&key=${process.env.MAILTESTER_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        return Response.json({
            email,
            status: data?.message || "Unknown",
            mx: data?.mx || "N/A",
        });
    } catch (error) {
        return Response.json({ email, status: "Server error", mx: "N/A" }, { status: 500 });
    }
}
