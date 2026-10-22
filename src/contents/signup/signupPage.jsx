"use client";

import { useState, useRef } from "react";
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
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
	Tooltips,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import Header from "@/components/ui/header";

export default function SignupPageContents() {
	const [form, setForm] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const recaptchaRef = useRef(null);
	const router = useRouter();
	const Goto = (path) => {
		router.push(path);
	};

	const handleChange = (e) => {
		setForm({ ...form, [e.target.id]: e.target.value });
		setErrors({ ...errors, [e.target.id]: "" });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			await toast.promise(
				(async () => {
					if (!recaptchaRef.current) {
						throw new Error("reCAPTCHA is still loading. Please try again.");
					}

					let timeoutId;
					const captchaToken = await Promise.race([
						recaptchaRef.current.executeAsync(),
						new Promise((_, reject) => {
							timeoutId = setTimeout(() => {
								reject(
									new Error(
										"reCAPTCHA timed out. Disable browser shields for this site and try again."
									)
								);
							}, 15000);
						}),
					]);
					clearTimeout(timeoutId);
					recaptchaRef.current.reset();
					const res = await fetch("/api/users/create", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...form, captcha: captchaToken }),
				});

				const data = await res.json();

				if (!res.ok) {
					let newErrors = {};

					if (data.message === "All fields are required.") {
						Object.keys(form).forEach((key) => {
							if (!form[key]) newErrors[key] = "This field is required.";
						});
					} else if (data.message.includes("Username")) {
						newErrors.username = data.message;
					} else if (data.message.includes("email")) {
						newErrors.email = data.message;
					} else if (data.message.includes("Password")) {
						if (data.message.includes("match")) {
							newErrors.confirmPassword = data.message;
						} else {
							newErrors.password = data.message;
						}
					}

					setErrors(newErrors);
					throw new Error(data.message || "Signup failed");
				}

				setForm({ username: "", email: "", password: "", confirmPassword: "" });
				setErrors({});
				Goto("/login");
				return data.message || "Account created successfully!";
				})(),
				{
					loading: "Creating your account...",
					success: (msg) => msg,
					error: (err) => err.message || "Something went wrong",
				}
			);
		} catch {
			// toast.promise already displays the error to the user.
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Header />
			<div className="flex items-center justify-center min-h-screen">
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle>Create an account</CardTitle>
						<CardDescription>
							Enter your preferred username, email, and password below to create
							a new account.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-5">
							<div className="relative">
								<div className="grid gap-1">
									<Label htmlFor="username">Username</Label>
									<Input
										id="username"
										type="text"
										value={form.username}
										onChange={handleChange}
										placeholder="yourname"
										className={
											errors.username
												? "pr-10 ring-1 ring-red-700 focus-visible:ring-red-700 focus-visible:border-red-700"
												: ""
										}
									/>
								</div>
								{errors.username && (
									<TooltipProvider>
										<Tooltips>
											<TooltipTrigger asChild>
												<div className="absolute right-2 top-7 text-red-700">
													<AlertCircle size={15} />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>{errors.username}</p>
											</TooltipContent>
										</Tooltips>
									</TooltipProvider>
								)}
							</div>

							<div className="relative">
								<div className="grid gap-1">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="text"
										value={form.email}
										onChange={handleChange}
										placeholder="users@entitygate.com"
										className={
											errors.email
												? "pr-10 ring-1 ring-red-700 focus-visible:ring-red-700 focus-visible:border-red-700"
												: ""
										}
									/>
								</div>
								{errors.email && (
									<TooltipProvider>
										<Tooltips>
											<TooltipTrigger asChild>
												<div className="absolute right-2 top-7 text-red-700">
													<AlertCircle size={15} />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>{errors.email}</p>
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
										<EyeOff size={15} className={"cursor-pointer"} />
									) : (
										<Eye size={15} className={"cursor-pointer"} />
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

							<div className="relative">
								<div className="grid gap-1">
									<Label htmlFor="confirmPassword">Confirm Password</Label>
									<Input
										id="confirmPassword"
										type={showConfirmPassword ? "text" : "password"}
										value={form.confirmPassword}
										onChange={handleChange}
										className={
											errors.confirmPassword
												? "pr-10 ring-1 ring-red-700 focus-visible:ring-red-700 focus-visible:border-red-700"
												: ""
										}
									/>
								</div>
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="absolute right-8 top-7 text-gray-600 hover:text-gray-800"
								>
									{showConfirmPassword ? (
										<EyeOff size={15} className={"cursor-pointer"} />
									) : (
										<Eye size={15} className={"cursor-pointer"} />
									)}
								</button>
								{errors.confirmPassword && (
									<TooltipProvider>
										<Tooltips>
											<TooltipTrigger asChild>
												<div className="absolute right-2 top-7 text-red-700">
													<AlertCircle size={15} />
												</div>
											</TooltipTrigger>
											<TooltipContent>
												<p>{errors.confirmPassword}</p>
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
									"Signup"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
