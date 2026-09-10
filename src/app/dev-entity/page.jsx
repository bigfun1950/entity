"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminLogin() {
	const [masterKey, setMasterKey] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	const handleLogin = async () => {
		if (!masterKey.trim()) {
			setError("Master key is required");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const res = await fetch("/api/dev-entity/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ masterKey }),
			});

			const data = await res.json();
			if (data.success) {
				router.push("/dev-entity/dashboard");
			} else {
				setError(data.message || "Invalid key");
			}
		} catch (err) {
			console.error("Admin login error:", err);
			setError("Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			handleLogin();
		}
	};

	return (
		<div className="flex justify-center items-center min-h-screen bg-muted/40">
			<Card className="w-[400px] p-6 shadow-lg rounded-2xl">
				<CardHeader>
					<CardTitle className="text-center text-xl font-semibold">
						Admin Login
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Input
						type="password"
						placeholder="Enter master key"
						value={masterKey}
						onChange={(e) => setMasterKey(e.target.value)}
						onKeyDown={handleKeyPress}
					/>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<Button onClick={handleLogin} disabled={loading} className="w-full">
						{loading ? "Logging in..." : "Login"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
