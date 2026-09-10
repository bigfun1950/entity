import clientPromise from "@/lib/mongodb";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const owner = searchParams.get("owner");
        if (!owner) {
            return new Response(JSON.stringify({ message: "Missing owner param" }), { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db("ENTITY");
        const shortlinks = await db
            .collection("shortlinks")
            .find({ owner })
            .sort({ createdAt: -1 })
            .toArray();
        return new Response(
            JSON.stringify({ shortlinks }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
    }
}
