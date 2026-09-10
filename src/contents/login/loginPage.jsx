"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import {
	Tooltips,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import ReCAPTCHA from "react-google-recaptcha";
import Header from "@/components/ui/header";

export default function LoginPageContents() {
	const [form, setForm] = useState({ emailOrUsername: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const recaptchaRef = useRef(null);
	const router = useRouter();
	const Goto = (path) => {
		router.push(path);
	};

	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await fetch("/api/users/check");
				if (res.ok) {
					const data = await res.json();
					if (res.status === 401) {
						router.replace("/login");
						return;
					}
					if (data.user) {
						router.replace("/dashboard");
					}
				}
			} catch (err) {
				console.error("Session check failed:", err);
			}
		};
		checkSession();
	}, [router]);

	const handleChange = (e) => {
		setForm({ ...form, [e.target.id]: e.target.value });
		setErrors({ ...errors, [e.target.id]: "" });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		await toast.promise(
			(async () => {
				const captchaToken = await recaptchaRef.current.executeAsync();
				recaptchaRef.current.reset();
				const res = await fetch("/api/users/login", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...form, captcha: captchaToken }),
				});

				const data = await res.json();
				setLoading(false);

				if (!res.ok) {
					let newErrors = {};

					if (data.message?.includes("required")) {
						Object.keys(form).forEach((key) => {
							if (!form[key]) {
								newErrors[key] = "This field is required.";
							}
						});
					} else {
						newErrors.emailOrUsername = "Invalid credentials!";
						newErrors.password = "Invalid credentials!";
					}

					setErrors(newErrors);
					throw new Error(data.message || "Login failed");
				}

				Goto("/dashboard");
				return data.message;
			})(),
			{
				loading: "Checking...",
				success: (msg) => msg,
				error: (err) => err.message,
			}
		);
	};

	return (
		<>
			<Header />
			<div className="flex items-center justify-center min-h-screen">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>Login to your account</CardTitle>
						<CardDescription>
							Enter your email/username below to login to your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-5">
							<div className="relative">
								<div className="grid gap-1">
									<Label htmlFor="emailOrUsername">Email / Username</Label>
									<Input
										id="emailOrUsername"
										type="text"
										value={form.emailOrUsername}
										onChange={handleChange}
										placeholder="users@entitygate.com"
										className={
											errors.emailOrUsername
												? "pr-10 ring-1 ring-red-700 focus-visible:ring-red-700 focus-visible:border-red-700"
												: ""
										}
									/>
								</div>
								{errors.emailOrUsername && (
									<TooltipProvider>
										<Tooltips>
											<TooltipTrigger asChild>
												<div className="absolute right-2 top-7 text-red-700">
													<AlertCircle size={15} />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>{errors.emailOrUsername}</p>
											</TooltipContent>
										</Tooltips>
									</TooltipProvider>
								)}
							</div>

							<div className="relative">
								<div className="grid gap-1">
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										value={form.password}
										onChange={handleChange}
										className={
											errors.password
												? "pr-10 ring-1 ring-red-700 focus-visible:ring-red-700 focus-visible:border-red-700"
												: ""
										}
									/>
								</div>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-8 top-7 text-gray-600 hover:text-gray-800"
								>
									{showPassword ? (
										<EyeOff size={15} className="cursor-pointer" />
									) : (
										<Eye size={15} className="cursor-pointer" />
									)}
								</button>
								{errors.password && (
									<TooltipProvider>
										<Tooltips>
											<TooltipTrigger asChild>
												<div className="absolute right-2 top-7 text-red-700">
													<AlertCircle size={15} />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>{errors.password}</p>
											</TooltipContent>
										</Tooltips>
									</TooltipProvider>
								)}
							</div>

							<ReCAPTCHA
								ref={recaptchaRef}
								size="invisible"
								badge="bottomright"
								sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
							/>
							{errors.captcha && (
								<p className="text-sm text-red-700">{errors.captcha}</p>
							)}

							<Button
								type="submit"
								className="w-full cursor-pointer"
								disabled={loading}
							>
								{loading ? (
									<EntityButtonLoading
										className={"dark:fill-black fill-white w-6 h-6"}
									/>
								) : (
									"Login"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
