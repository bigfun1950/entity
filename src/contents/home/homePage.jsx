"use client";

import { motion } from "framer-motion";
import {
	Card,
	CardHeader,
	CardContent,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	Shield,
	Bot,
	Network,
	Database,
	BarChart3,
	ArrowRight,
	Link,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { EntityAnimation } from "@/contents/home/animatedLoader";
import Header from "@/components/ui/header";
import LiveTest from "@/components/livetest/LiveTest";
import {
	EntityCapabilities,
	EntityLiveTester,
    Faqs,
} from "@/components/title/EntityTitle";

export default function HomePageContents() {
	const router = useRouter();
	const Goto = (path) => router.push(path);

	return (
		<TooltipProvider>
			<div className="min-h-screen w-full bg-black/60">
				<Header />
				<section className="relative min-h-screen pt-20">
					<EntityAnimation src={"/lottie/robot.json"} />
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.5 }}
						className="mx-auto max-w-7xl px-6 pt-16 pb-10"
					>
						<div className="flex flex-col items-center text-center gap-6">
							<Badge className="rounded-2xl px-3 py-1" variant="secondary">
								Real-time Anti-Bot Bridge for High-Integrity Traffic
							</Badge>

							<h1 className="text-4xl md:text-6xl text-white tracking-tight font-semibold">
								{process.env.NEXT_PUBLIC_ORG}
								<span className="text-red-700">GATE</span>
							</h1>

							<p className="max-w-3xl text-white text-lg md:text-xl">
								Inspect every click before it touches your origin. Rate
								limiting, ASN/CIDR screening, device & header sanity checks, and
								safe redirects — all orchestrated through a lean API gateway.
							</p>

							<div className="flex gap-3">
								<Button
									size="lg"
									onClick={() =>
										document
											.getElementById("quickstart")
											?.scrollIntoView({ behavior: "smooth" })
									}
									className={"cursor-pointer"}
								>
									Quickstart <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
								<Button
									size="lg"
									variant="outline"
									onClick={() =>
										document
											.getElementById("features")
											?.scrollIntoView({ behavior: "smooth" })
									}
									className={"cursor-pointer"}
								>
									Explore Features
								</Button>
							</div>
						</div>
					</motion.div>
				</section>

				<section
					id="features"
					className="mx-auto max-w-7xl px-6 min-h-screen pt-20"
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.4 }}
						className="text-2xl md:text-3xl font-bold mb-10"
					>
						<EntityCapabilities className="w-42 h-5 sm:w-62 sm:h-7" />
					</motion.h2>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.5 }}
					>
						<div className="grid md:grid-cols-3 gap-4">
							{[
								{
									icon: Shield,
									title: "Defense Layers",
									desc: "Whitelist/Blacklist, device gating, country filters, ASN & CIDR blocks, and bot signatures.",
									color: "text-blue-700",
								},
								{
									icon: Bot,
									title: "Bot Forensics",
									desc: "Header sanity checks + third-party intel fallback for decisive bot verdicts.",
									color: "text-red-700",
								},
								{
									icon: Network,
									title: "Edge Rate Limiting",
									desc: "Upstash-backed throttle preventing abuse while preserving legitimate sessions.",
									color: "text-purple-500",
								},
								{
									icon: Database,
									title: "Visitor Ledger",
									desc: "Append-only logs for decisions, device posture, ASN, and geo signals.",
									color: "text-amber-500",
								},
								{
									icon: BarChart3,
									title: "Success Ratio KPI",
									desc: "Hourly status KPIs via statusLogs with upsert semantics for lightweight analytics.",
									color: "text-green-700",
								},
								{
									icon: Link,
									title: "Bridge Redirects",
									desc: "Clean 302 hand-off to active URLs only when traffic passes all gates.",
									color: "text-blue-700",
								},
							].map((f, idx) => (
								<motion.div
									key={f.title}
									initial={{ opacity: 0, y: 10 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: false }}
									transition={{ duration: 0.4, delay: idx * 0.05 }}
								>
									<Card className="h-full">
										<CardHeader className="space-y-1">
											<div className="flex items-center gap-2">
												<f.icon className={`h-5 w-5 ${f.color}`} />
												<span className="font-semibold">{f.title}</span>
											</div>
											<CardDescription>{f.desc}</CardDescription>
										</CardHeader>
									</Card>
								</motion.div>
							))}
						</div>
					</motion.div>
				</section>

				<section
					id="quickstart"
					className="mx-auto max-w-7xl px-6 min-h-screen pt-20"
				>
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.4 }}
						className="text-2xl md:text-3xl font-bold mb-10 "
					>
						<EntityLiveTester
							className="w-42 h-5 sm:w-62 sm:h-7"
							color={"stroke-white/90"}
						/>
					</motion.h2>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.5 }}
					>
						<LiveTest />
					</motion.div>
				</section>

				<section className="mx-auto max-w-7xl px-6 py-40">
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.4 }}
						className="text-2xl md:text-3xl font-bold mb-10 text-white"
					>
						<Faqs className="w-42 h-5 sm:w-62 sm:h-7" />
					</motion.h2>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.5 }}
					>
						<Card className="border-muted-foreground/10 p-6">
							<Accordion type="single" collapsible className="max-w-4xl">
								<AccordionItem value="asn">
									<AccordionTrigger className="cursor-pointer font-semibold">
										How does ENTITYGATE handle ASN blocking?
									</AccordionTrigger>
									<AccordionContent>
										The <code>EntityAsnCheck</code> helper inspects the
										visitor’s autonomous system number (ASN) and organization
										name. If the ASN matches patterns you configure (e.g.,
										datacenter networks, cloud hosts), ENTITYGATE can block or
										challenge the request.
									</AccordionContent>
								</AccordionItem>

								<AccordionItem value="geo">
									<AccordionTrigger className="cursor-pointer font-semibold">
										Can I block or allow visitors by country?
									</AccordionTrigger>
									<AccordionContent>
										Yes. The <code>EntityCountry</code> helper resolves visitor
										IPs to geographic locations. You can enforce allowlists or
										blocklists at the policy layer to restrict access from
										specific countries or regions.
									</AccordionContent>
								</AccordionItem>

								<AccordionItem value="device">
									<AccordionTrigger className="cursor-pointer font-semibold">
										Does ENTITYGATE detect devices and bots?
									</AccordionTrigger>
									<AccordionContent>
										ENTITYGATE uses <code>EntityDeviceCheck</code> and{" "}
										<code>EntityBotCheck</code> to analyze User-Agent strings
										and other headers. This allows detection of common browsers,
										mobile devices, and automated clients attempting to bypass
										controls.
									</AccordionContent>
								</AccordionItem>

								<AccordionItem value="rate-limit">
									<AccordionTrigger className="cursor-pointer font-semibold">
										What happens when a visitor exceeds rate limits?
									</AccordionTrigger>
									<AccordionContent>
										ENTITYGATE integrates with the Redis-based{" "}
										<code>EntityRateLimiter</code>. When limits are exceeded,
										the API returns <code>429 Too Many Requests</code> and logs
										the event. You can adjust window sizes and thresholds per
										integration.
									</AccordionContent>
								</AccordionItem>

								<AccordionItem value="api">
									<AccordionTrigger className="cursor-pointer font-semibold">
										How do I test the API with my own headers?
									</AccordionTrigger>
									<AccordionContent>
										Use the <strong>Live Endpoint Tester</strong> or call the
										API directly with your custom headers (
										<code>x-entity-api-key</code>,{" "}
										<code>x-visitor-ip-asli</code>,{" "}
										<code>x-visitor-user-agent</code>, etc.). The API validates
										each layer before returning a decision.
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</Card>
					</motion.div>
				</section>

				<section className="mx-auto max-w-7xl px-6 pb-20">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: false }}
						transition={{ duration: 0.5 }}
					>
						<Card className="border-primary/30">
							<CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
								<div>
									<h3 className="text-xl md:text-2xl font-semibold">
										Operationalize high-fidelity traffic control today.
									</h3>
									<p className="text-muted-foreground mt-1">
										Deploy the bridge, wire your headers, and start observing
										pristine redirect hygiene.
									</p>
								</div>
								<div className="flex gap-3">
									<Button
										onClick={() => Goto("/login")}
										className={"cursor-pointer"}
									>
										Get Started
									</Button>
									<Button
										variant="outline"
										onClick={() =>
											window.scrollTo({ top: 0, behavior: "smooth" })
										}
										className={"cursor-pointer"}
									>
										Back to Top
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</section>
			</div>
		</TooltipProvider>
	);
}
