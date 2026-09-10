"use client";

import { ChartData } from "@/components/ui/chartData";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrashIcon, BanIcon } from "lucide-react";
import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { ClearStatisticIconSkeleton } from "@/components/ui/entitySkeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityStatistic } from "@/components/title/EntityTitle";

export default function ShortlinksStatisticTab({ user, apikey }) {
	const [activeChart, setActiveChart] = useState("desktop");
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(true);
	const [shortlinks, setShortlinks] = useState([]);
	const [selectedKey, setSelectedKey] = useState("");
	const [clearing, setClearing] = useState(false);
	const [clearOpen, setClearOpen] = useState(false);
	const [total, setTotal] = useState({ desktop: 0, mobile: 0 });
	const [visitors, setVisitors] = useState([]);

	useEffect(() => {
		const fetchShortlinks = async () => {
			setLoading(true);
			if (!user) return;

			try {
				const res = await fetch(`/api/shortlinks/list?owner=${user}`);
				const data = await res.json();
				if (data.shortlinks?.length) {
					setShortlinks(data.shortlinks);
					setSelectedKey(data.shortlinks[0].shortlinkKey);
				}
			} catch (err) {
				console.error("Failed to fetch shortlinks:", err);
			} finally {
				setLoading(false);
			}
		};

		if (user) fetchShortlinks();
	}, [user]);

	useEffect(() => {
		let interval;

		const fetchData = async () => {
			if (!selectedKey) return;

			try {
				const [statsRes, visitorsRes] = await Promise.all([
					fetch(`/api/visitors/stats?shortlinkKey=${selectedKey}`),
					fetch(`/api/visitors/list?shortlinkKey=${selectedKey}`),
				]);

				const statsData = await statsRes.json();
				const visitorsData = await visitorsRes.json();

				setChartData(statsData.chartData || []);
				setTotal(statsData.total || { desktop: 0, mobile: 0 });

				setVisitors(visitorsData.visitors || []);
			} catch (err) {
				console.error("Failed to fetch data:", err);
			}
		};

		if (user && selectedKey) {
			fetchData();
			interval = setInterval(fetchData, 5000);
		}

		return () => clearInterval(interval);
	}, [user, selectedKey]);

	const handleClearLogs = async () => {
		if (!selectedKey || !apikey) return;

		setClearing(true);

		await toast.promise(
			(async () => {
				const res = await fetch(`/api/visitors/clear/${selectedKey}`, {
					method: "POST",
					headers: {
						"x-entity-api-key": apikey,
					},
				});
				const result = await res.json();

				setClearing(false);

				if (result.success) {
					return "Logs cleared!";
				} else {
					throw new Error("Failed to clear logs.");
				}
			})(),
			{
				loading: "Clearing Visitor Logs...",
				success: (msg) => msg,
				error: (err) => err.message || "Something went wrong.",
			}
		);
	};

	return (
		<div className="p-4 grid gap-6 min-h-[70vh]">
			<div className={"mb-4 -mt-2"}>
				<EntityStatistic className="w-42 h-5 sm:h-7" />
			</div>
			<div className="w-full max-w-sm bg-background">
				{loading ? (
					<Skeleton className="w-full max-w-sm h-9 bg-neutral-900/10" />
				) : (
					<Select
						value={selectedKey}
						onValueChange={setSelectedKey}
						disabled={shortlinks.length === 0}
					>
						<SelectTrigger className="border-neutral-900/30 w-full">
							<SelectValue
								placeholder={
									shortlinks.length === 0
										? "No shortlinks available"
										: "Select a shortlink"
								}
							/>
						</SelectTrigger>

						<SelectContent>
							{shortlinks.length === 0 ? (
								<SelectItem
									disabled
									value="none"
									className="text-neutral-500 text-xs cursor-not-allowed"
								>
									<p className="flex items-center gap-1 max-w-[200px] sm:max-w-[380px] truncate overflow-hidden whitespace-nowrap text-xs sm:text-sm">
										No shortlinks available.
									</p>
								</SelectItem>
							) : (
								shortlinks.map((link) => (
									<SelectItem
										key={link.shortlinkKey}
										value={link.shortlinkKey}
										className="cursor-pointer"
									>
										<Tooltips>
											<TooltipTrigger asChild>
												<p className="flex items-center gap-1 max-w-[200px] sm:max-w-[380px] truncate overflow-hidden whitespace-nowrap text-xs sm:text-sm">
													<span className="text-blue-700 truncate">
														{link.activeUrl === "need update"
															? "NEED UPDATE"
															: link.activeUrl}
													</span>
													<span className="text-green-700 font-bold">
														({link.shortlinkKey})
													</span>
												</p>
											</TooltipTrigger>
											<TooltipContent
												side="top"
												className="max-w-xs break-words"
											>
												{link.activeUrl}
											</TooltipContent>
										</Tooltips>
									</SelectItem>
								))
							)}
						</SelectContent>
					</Select>
				)}
			</div>
			<div className="grid gap-6 lg:grid-cols-2">
				<ChartData
					user={user}
					activeChart={activeChart}
					loading={loading}
					total={total}
					chartData={chartData}
					setActiveChart={setActiveChart}
				/>

				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle>Visitors Info</CardTitle>
							{selectedKey ? (
								<AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
									<AlertDialogTrigger asChild>
										<Tooltips>
											<TooltipTrigger asChild>
												<Button
													variant="outline"
													size={"icon"}
													onClick={() => setClearOpen(true)}
													disabled={!selectedKey || clearing}
													className={
														"border-neutral-900/30 cursor-pointer rounded"
													}
												>
													{clearing ? (
														<EntityButtonLoading className="fill-black dark:fill-white w-5 h-5" />
													) : (
														<TrashIcon className="w-4 h-4 text-red-700" />
													)}
												</Button>
											</TooltipTrigger>
											<TooltipContent>
												<p>Clear Visitor Logs</p>
											</TooltipContent>
										</Tooltips>
									</AlertDialogTrigger>

									<AlertDialogContent>
										<AlertDialogDescription />
										<AlertDialogHeader>
											<AlertDialogTitle>
												Clear Logs for "{selectedKey}" ?
											</AlertDialogTitle>
										</AlertDialogHeader>
										<div>
											This will <b>permanently delete</b> all visitor logs for
											this shortlink.
										</div>
										<AlertDialogFooter>
											<AlertDialogCancel
												className={"border-neutral-900/30 cursor-pointer"}
											>
												<ChevronLeft />
											</AlertDialogCancel>
											<AlertDialogAction asChild>
												<Tooltips>
													<TooltipTrigger asChild>
														<Button
															type="button"
															variant="outline"
															onClick={() => {
																setClearOpen(false);
																handleClearLogs();
															}}
															className={"border-neutral-900/30 cursor-pointer"}
														>
															<TrashIcon className="h-4 w-4 text-red-700" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Clear Visitor Logs</p>
													</TooltipContent>
												</Tooltips>
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							) : (
								<ClearStatisticIconSkeleton />
							)}
						</div>
					</CardHeader>
					<CardContent className="max-h-110 scroll">
						<div className="space-y-4">
							{visitors.length === 0 ? (
								<i className="text-sm">No recent visitors.</i>
							) : (
								visitors.slice(0, 9999).map((v, idx) => {
									let icon, typeLabel;

									if (v.isBot && v.blockReason === "bot") {
										icon = (
											<Image
												src={"/robot.svg"}
												alt="robot"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "BOT";
									} else if (v.isBot && v.blockReason === "cidr") {
										icon = (
											<Image
												src={"/server.svg"}
												alt="server"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "DATACENTER";
									} else if (v.blockReason === "ipBlacklist") {
										icon = (
											<Image
												src={"/blackblock.svg"}
												alt="blackblock"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "IP BLACKLISTED";
									} else if (v.blockReason === "country") {
										icon = (
											<Image
												src={`https://cdn.ipwhois.io/flags/${v.visitorCountry.toLowerCase()}.svg`}
												alt={`${v.visitorCountry} flag`}
												width={1}
												height={1}
												className="w-5"
											/>
										);
										typeLabel = "COUNTRY NOT ALLOWED";
									} else if (v.blockReason === "asn") {
										icon = (
											<Image
												src={"/crawler.svg"}
												alt="crawler"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "CRAWLER";
									} else if (v.blockReason === "device") {
										icon = (
											<Image
												src={"/device.svg"}
												alt="device"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "DEVICE NOT ALLOWED";
									} else if (v.isBlocked) {
										icon = <BanIcon className="h-4 w-4 text-red-700" />;
										typeLabel = v.blockReason?.toUpperCase() || "BLOCKED";
									} else if (v.note?.toLowerCase().includes("whitelist")) {
										icon = (
											<Image
												src={"/whitelisted.svg"}
												alt="whitelisted"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "IP WHITELISTED";
									} else {
										icon = (
											<Image
												src={"/human.svg"}
												alt="human"
												width={1}
												height={1}
												className="h-4 w-4"
											/>
										);
										typeLabel = "HUMAN";
									}

									return (
										<div
											key={idx}
											className="flex items-start gap-3 border-b pb-2 last:border-none last:pb-0"
										>
											<div className="mt-1">{icon}</div>
											<div className="flex-1">
												<p className="text-sm font-medium">{typeLabel}</p>
												<p className="text-xs text-muted-foreground">
													{v.visitorIp} - {v.visitorCountry}{" "}
													<span className="capitalize">( {v.deviceType} )</span>
												</p>
											</div>
											<p className="flex flex-col text-xs text-muted-foreground whitespace-nowrap">
												<span>
													{new Date(v.timestamp).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
												<span
													className={`text-[11px] ${
														v.isBlocked ? "text-red-700" : "text-green-600"
													}`}
												>
													{v.isBlocked ? "BLOCKED" : "ALLOWED"}
												</span>
											</p>
										</div>
									);
								})
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
