import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { adminSessionOptions } from "@/lib/entityAdminSessions";

export async function POST(req) {
    try {
        const res = NextResponse.next();
        const session = await getIronSession(req, res, adminSessionOptions);

        if (!session.admin) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { userId, username, email, plan, expiresAt, password, shortlinksLimit } =
            await req.json();

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db("ENTITY");

        const oldUser = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        if (!oldUser) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const updateFields = {};

        if (username) updateFields.username = username;
        if (email) updateFields.email = email;
        if (plan) updateFields.plan = plan;
        if (expiresAt) updateFields.expiresAt = new Date(expiresAt);
        if (typeof shortlinksLimit === "number") {
            updateFields.shortlinksLimit = shortlinksLimit;
        }

        if (password) {
            if (password.length < 8) {
                return NextResponse.json(
                    { success: false, message: "Password must be at least 8 characters" },
                    { status: 400 }
                );
            }
            if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Password must contain at least one letter and one number",
                    },
                    { status: 400 }
                );
            }
            updateFields.password = await bcrypt.hash(password, 10);
        }

        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: updateFields }
        );

        if (result.matchedCount > 0) {
            if (plan && oldUser.plan !== plan) {
                let notifMessage = "";

                if (oldUser.plan === "free" && plan === "pro") {
                    notifMessage = "You've received a free PRO plan from Karma!";
                } else if (oldUser.plan === "pro" && plan === "free") {
                    notifMessage = "Your plan has been downgraded to FREE!";
                } else {
                    notifMessage = `Your plan has been changed to ${plan.toUpperCase()}!`;
                }

                await db.collection("notifications").insertOne({
                    userId: oldUser._id,
                    username: oldUser.username,
                    type: "plan",
                    message: notifMessage,
                    createdAt: new Date(),
                    read: false,
                });
            }

            return NextResponse.json({
                success: true,
                message: "User updated successfully",
            });
        }

        return NextResponse.json(
            { success: false, message: "User not updated" },
            { status: 400 }
        );
    } catch (err) {
        console.error("Update User Error:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
