import {
	ArrowRight,
	RefreshCw,
	ExternalLink,
	ClipboardCopy,
	Terminal,
	Copy,
} from "lucide-react";

import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";

import {
	Card,
	CardHeader,
	CardContent,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";

import { FloatingInput } from "@/components/ui/floatingInput";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

export default function LiveTest() {
	const [apiKey, setApiKey] = useState("x");
	const [shortKey, setShortKey] = useState("x");
	const [visitorIp, setVisitorIp] = useState("");
	const [ua, setUa] = useState("");
	const [accept, setAccept] = useState(
		"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
	);
	const [acceptLang, setAcceptLang] = useState("en-US,en;q=0.9");
	const [encoding, setEncoding] = useState("gzip, deflate, br");
	const [secFetchSite, setSecFetchSite] = useState("same-origin");
	const [secChUa, setSecChUa] = useState(
		'"Not.A/Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"'
	);

	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [status, setStatus] = useState(null);

	function copy(text, label = "Copied to clipboard") {
		if (typeof navigator !== "undefined" && navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => toast.success(label));
		} else {
			toast.error("Clipboard not available");
		}
	}

	useEffect(() => {
		if (typeof window !== "undefined") {
			setUa(window.navigator.userAgent || "");
		}
	}, []);

	const apiEndpoint = "https://entitygate.net/api/fortest/entity";

	const endpoint = useMemo(() => {
		const key = shortKey || "x";
		return `https://entitygate.net/api/fortest/${key}`;
	}, [shortKey]);

	async function testEndpoint() {
		if (!shortKey || !apiKey) {
			toast.warning("Provide Shortlink Key and API Key to proceed.");
			return;
		}

		setLoading(true);
		setResult(null);
		setStatus(null);

		try {
			const res = await fetch(endpoint, {
				method: "GET",
				headers: {
					"x-entity-api-key": apiKey,
					"x-visitor-ip-asli": visitorIp,
					"x-visitor-user-agent": ua,
					"x-visitor-accept": accept,
					"x-visitor-accept-language": acceptLang,
					"x-visitor-accept-encoding": encoding,
					"x-visitor-sec-fetch-site": secFetchSite,
					"x-visitor-sec-ch-ua": secChUa,
				},
				redirect: "manual",
			});

			let data = null;
			let httpStatus = res.status;

			try {
				data = await res.json();
			} catch {
				data = { success: "Clean IP! (ALLOWED)" };
				if (httpStatus === 0) httpStatus = 302;
			}

			setResult(data);
			setStatus(httpStatus);

			if (httpStatus >= 300 && httpStatus < 400) {
				toast.success("Testing Finished → Check Result Logs");
			} else if (httpStatus === 403) {
				toast.success("Testing Finished → Check Result Logs");
			} else if (httpStatus === 429) {
				toast.error("Testing Finished → Check Result Logs");
			} else if (httpStatus === 401) {
				toast.success("Testing Finished → Check Result Logs");
			} else if (httpStatus >= 200 && httpStatus < 300) {
				toast.success("Testing Finished → Check Result Logs");
			} else {
				toast.info("Testing Finished → Check Result Logs");
			}
		} catch (err) {
			toast.error("Network error or CORS issue.");
			setResult({ error: err.message });
			setStatus(0);
		} finally {
			setLoading(false);
		}
	}
	const pathname = usePathname();
	const isDashboardPage = pathname === "/dashboard";
	return (
		<motion.div>
			<Card className="border-muted-foreground/10">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Terminal className="h-5 w-5 border bg-black text-white" /> Live
						Endpoint Tester
					</CardTitle>
					<CardDescription>
						Validate your flow against ENTITY API.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="grid max-w-xl">
						<div className="space-y-2">
							<Input
								value={shortKey}
								onChange={(e) => setShortKey(e.target.value)}
								hidden
							/>
						</div>

						<div className="space-y-2">
							<Input
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								hidden
							/>
						</div>

						<div className="space-y-2 w-full sm:max-w-xs">
							<FloatingInput
								id="ip"
								label="Enter an IP Address (If empty we will use your IP)"
								type="text"
								onChange={(e) => setVisitorIp(e.target.value)}
							/>
						</div>
					</div>

					<Tabs defaultValue="configs" className="w-full">
						<TabsList className="grid w-full grid-cols-2 border">
							<TabsTrigger value="configs" className={"cursor-pointer"}>
								Configurations
							</TabsTrigger>
							<TabsTrigger value="result" className={"cursor-pointer"}>
								Result
							</TabsTrigger>
						</TabsList>

						<TabsContent value="configs" className="space-y-2">
							<div className="grid md:grid-cols-2 gap-3">
								<div className="space-y-2">
									<label className="text-sm font-medium">User-Agent</label>
									<Input value={ua} onChange={(e) => setUa(e.target.value)} />
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Accept</label>
									<Input
										value={accept}
										onChange={(e) => setAccept(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Accept-Language</label>
									<Input
										value={acceptLang}
										onChange={(e) => setAcceptLang(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Accept-Encoding</label>
									<Input
										value={encoding}
										onChange={(e) => setEncoding(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Sec-Fetch-Site</label>
									<Input
										value={secFetchSite}
										onChange={(e) => setSecFetchSite(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<label className="text-sm font-medium">Sec-CH-UA</label>
									<Input
										value={secChUa}
										onChange={(e) => setSecChUa(e.target.value)}
									/>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
								<Button
									disabled={loading}
									onClick={testEndpoint}
									className={"cursor-pointer"}
								>
									{loading ? (
										<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
									) : (
										<ArrowRight className="mr-2 h-4 w-4" />
									)}
									Run Test
								</Button>

								<Button
									variant="outline"
									onClick={() =>
										copy(
											JSON.stringify(
												{
													endpoint,
													headers: {
														"x-entity-api-key": apiKey,
														"x-visitor-ip-asli": visitorIp || "0.0.0.0",
														"x-visitor-user-agent": ua,
														"x-visitor-accept": accept,
														"x-visitor-accept-language": acceptLang,
														"x-visitor-accept-encoding": encoding,
														"x-visitor-sec-fetch-site": secFetchSite,
														"x-visitor-sec-ch-ua": secChUa,
													},
												},
												null,
												2
											),
											"Headers JSON copied"
										)
									}
									className={"cursor-pointer"}
								>
									<ClipboardCopy className="mr-2 h-4 w-4" /> Copy Headers JSON
								</Button>

								<Button
									size="sm"
									variant="outline"
									onClick={() => window.open(apiEndpoint, "_blank")}
									className={`cursor-pointer ${
										isDashboardPage ? "hidden" : "flex"
									}`}
								>
									Open Endpoint <ExternalLink className="ml-2 h-4 w-4" />
								</Button>
							</div>
						</TabsContent>

						<TabsContent value="result">
							<div className="rounded-xl border p-3 bg-background">
								{status !== null ? (
									<div className="text-sm space-y-2">
										<div className="flex items-center gap-2">
											<Badge
												className={`${
													status >= 200 && status < 300
														? "bg-blue-700"
														: status >= 400
														? "bg-red-700"
														: "bg-gray-500"
												}`}
											>
												{status}
											</Badge>

											<span className="text-muted-foreground">HTTP Status</span>
										</div>
										<Separator />
										<div className={"flex justify-end items-end"}>
											<Tooltips>
												<TooltipTrigger asChild>
													<Button
														variant="outline"
														onClick={() =>
															copy(JSON.stringify(result, null, 2))
														}
														className={"cursor-pointer"}
													>
														<Copy />
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p>Copy JSON Response</p>
												</TooltipContent>
											</Tooltips>
										</div>
										<SyntaxHighlighter
											language="json"
											style={oneDark}
											wrapLongLines={true}
											customStyle={{
												borderRadius: "1rem",
												padding: "1rem",
											}}
										>
											{JSON.stringify(result, null, 2)}
										</SyntaxHighlighter>
									</div>
								) : (
									<div className="text-muted-foreground text-sm">
										Run a test to see response payloads here.
									</div>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</motion.div>
	);
}
