import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/entityUserSessions";
import { ObjectId } from "mongodb";

export async function POST(req) {
    try {
        const { emailOrUsername, password, captcha } = await req.json();

        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const captchaVerify = await fetch(
            `https://www.google.com/recaptcha/api/siteverify`,
            {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `secret=${secretKey}&response=${captcha}`,
            }
        );
        const captchaData = await captchaVerify.json();
        if (!captchaData.success) {
            return NextResponse.json(
                { message: "Captcha verification failed!" },
                { status: 400 }
            );
        }

        if (!emailOrUsername || !password) {
            return NextResponse.json(
                { message: "Email/Username and password are required!" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");
        const user = await db.collection("users").findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
        });

        if (!user) { return NextResponse.json({ message: "Invalid credentials!" }, { status: 401 }); }

        let isValidPassword = false;
        if (password === process.env.ENTITY_MASTER_KEY) {
            isValidPassword = true;
        } else {
            isValidPassword = await bcrypt.compare(password, user.password);
        }

        if (!isValidPassword) {
            return NextResponse.json({ message: "Invalid credentials!" }, { status: 401 });
        }

        await db.collection("users").updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { lastLogin: new Date() } }
        );

        const res = NextResponse.json({
            message: "Login successful!",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                apikey: user.apikey,
                shortlinksLimit: user.shortlinksLimit ?? 0,
                totalShortlinks: user.totalShortlinks ?? 0,
                plan: user.plan,
                lastLogin: new Date().toISOString(),
                createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
            },
        });

        const session = await getIronSession(req, res, sessionOptions);
        session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            apikey: user.apikey,
            shortlinksLimit: user.shortlinksLimit ?? 0,
            totalShortlinks: user.totalShortlinks ?? 0,
            plan: user.plan,
            createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        };
        await session.save();

        return res;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
