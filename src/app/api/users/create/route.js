import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(req) {
    try {
        const { username, email, password, confirmPassword, captcha, plan = "free" } = await req.json();

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

        if (!username || !email || !password || !confirmPassword) {
            return NextResponse.json(
                { message: "All fields are required!" },
                { status: 400 }
            );
        }

        if (username.length < 3) {
            return NextResponse.json(
                { message: "Username must be at least 3 characters long!" },
                { status: 400 }
            );
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return NextResponse.json(
                { message: "Username can only contain letters, numbers, and underscores!" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Please use valid email!" },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { message: "Passwords do not match!" },
                { status: 400 }
            );
        }
        if (password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters long!" },
                { status: 400 }
            );
        }
        if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
            return NextResponse.json(
                { message: "Password must contain at least one letter and one number!" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const existingUser = await db.collection("users").findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            return NextResponse.json(
                {
                    message:
                        existingUser.email === email
                            ? "User with this email already exists!"
                            : "Username is already taken!",
                },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const apiKey = crypto.randomBytes(16).toString("hex");
        const subscriptionPlans = {
            free: { durationMs: 1 * 24 * 60 * 60 * 1000 },
            pro: { durationMs: 7 * 24 * 60 * 60 * 1000 },
        };

        const s = subscriptionPlans[plan] ? plan : "free";
        const expiresAt = new Date(Date.now() + subscriptionPlans[s].durationMs);

        const result = await db.collection("users").insertOne({
            username,
            email,
            password: hashedPassword,
            apikey: apiKey,
            shortlinksLimit: 1,
            totalShortlinks: 0,
            plan: 'free',
            createdAt: new Date(),
            expiresAt,
            lastLogin: null
        });

        await db.collection("notifications").insertOne({
            username,
            type: "account",
            message: `Welcome to ENTITY! Upgrade your plan to use ENTITY!`,
            createdAt: new Date(),
            read: false,
        });

        return NextResponse.json(
            { message: "User created successfully! You can now login!", userId: result.insertedId },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}