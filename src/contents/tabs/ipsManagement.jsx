"use client";

import { useEffect, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import { TrashIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	EntityManageBlacklist,
	EntityManageWhitelist,
} from "@/components/title/EntityTitle";

export default function IPsManagementTab({ user }) {
	const [shortlinks, setShortlinks] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedKey, setSelectedKey] = useState("");
	const [ips, setIps] = useState([]);
	const [inputValue, setInputValue] = useState("");
	const [saving, setSaving] = useState(false);
	const [mode, setMode] = useState("blacklist");

	const isBlacklist = mode === "blacklist";
	const fieldName = isBlacklist ? "ipBlacklist" : "ipWhitelist";
	const successMsg = `[SUCCESS] ${
		isBlacklist ? "Blacklist" : "Whitelist"
	} Updated!`;
	const errorMsg = `[ERROR] Failed to update ${
		isBlacklist ? "Blacklist" : "Whitelist"
	}!`;
	const emptyMsg = `NO ${isBlacklist ? "BLACKLISTED" : "WHITELISTED"} IPs YET`;
	const addLabel = `Add IPs to ${isBlacklist ? "Blacklist" : "Whitelist"}`;
	const listLabel = `${isBlacklist ? "Blacklisted" : "Whitelisted"} IPs`;

	const fetchShortlinks = async () => {
		if (!user) return;
		setLoading(true);

		try {
			const res = await fetch(
				`/api/shortlinks/list?owner=${encodeURIComponent(user)}`
			);
			const data = await res.json();

			setShortlinks(data?.shortlinks || []);

			if (data?.shortlinks?.length) {
				const firstKey = data.shortlinks[0].shortlinkKey;
				setSelectedKey(firstKey);
				setIps(data.shortlinks[0][fieldName] || []);
			}
		} catch (err) {
			console.error("Failed to fetch shortlinks:", err);
			setShortlinks([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectChange = (key) => {
		setSelectedKey(key);
		const found = shortlinks.find((link) => link.shortlinkKey === key);
		setIps(found?.[fieldName] || []);
	};

	const parseIps = (value) => {
		return value
			.split(/[\n,]+/)
			.map((ip) => ip.trim())
			.filter((ip) => ip.length > 0);
	};

	const saveIps = async (newIps) => {
		if (!selectedKey) return;
		setSaving(true);

		try {
			const res = await fetch("/api/shortlinks/manage", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					owner: user,
					shortlinkKey: selectedKey,
					[fieldName]: newIps,
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Failed to update");

			await fetchShortlinks();
			toast.success(successMsg);
		} catch (err) {
			console.error("Failed to save:", err);
			toast.error(errorMsg);
		} finally {
			setSaving(false);
		}
	};

	const addIps = () => {
		const parsed = parseIps(inputValue);
		if (parsed.length === 0) return;
		const updated = Array.from(new Set([...ips, ...parsed]));
		setInputValue("");
		saveIps(updated);
	};

	const removeIp = (ip) => {
		const updated = ips.filter((item) => item !== ip);
		saveIps(updated);
	};

	useEffect(() => {
		fetchShortlinks();
	}, [user]);

	useEffect(() => {
		const found = shortlinks.find((link) => link.shortlinkKey === selectedKey);
		if (found) setIps(found[fieldName] || []);
	}, [shortlinks, selectedKey, mode]);

	return (
		<div className="grid gap-4 p-4">
			<div className={"mb-6 -mt-2"}>
				{mode === "blacklist" ? (
					<EntityManageBlacklist className="w-42 h-5 sm:h-7" />
				) : (
					<EntityManageWhitelist className="w-42 h-5 sm:h-7" />
				)}
			</div>

			<div className="w-full bg-white dark:bg-neutral-900 shadow-lg rounded-2xl p-6 flex flex-col gap-6">
				{shortlinks.length === 0 && !loading ? (
					<div className="text-center text-gray-500 text-sm">
						No shortlinks available
					</div>
				) : (
					<>
						<div className="w-full max-w-max">
							<Tabs
								value={mode}
								onValueChange={setMode}
								className="w-full mb-3"
							>
								<TabsList className={'border'}>
									<TabsTrigger value="blacklist" className={"cursor-pointer"}>
										Blacklist
									</TabsTrigger>
									<TabsTrigger value="whitelist" className={"cursor-pointer"}>
										Whitelist
									</TabsTrigger>
								</TabsList>
							</Tabs>
							<label className="hidden sm:block text-sm font-medium mb-2">
								Select Shortlink
							</label>
							<label className="block sm:hidden text-sm font-medium mb-2">
								Select Shortlink by Shortlink Key
							</label>
							<Select
								value={selectedKey}
								onValueChange={handleSelectChange}
								disabled={loading}
							>
								<SelectTrigger>
									{loading ? (
										<div className="flex items-center justify-center mx-auto">
											<EntityButtonLoading className="fill-black dark:fill-white w-5 h-5" />
										</div>
									) : (
										<SelectValue placeholder="Choose a shortlink" />
									)}
								</SelectTrigger>
								<SelectContent>
									{shortlinks.map((link) => (
										<SelectItem
											key={link.shortlinkKey}
											value={link.shortlinkKey}
										>
											<Tooltips>
												<TooltipTrigger asChild>
													<div className="flex items-center gap-1 max-w-max sm:max-w-[530px] md:max-w-[380px] lg:max-w-max text-base truncate">
														<span className="text-blue-700 truncate hidden sm:block">
															{link.activeUrl}
														</span>
														<span className="text-green-600 font-bold">
															({link.shortlinkKey})
														</span>
													</div>
												</TooltipTrigger>
												<TooltipContent
													side="top"
													className="max-w-xs break-words"
												>
													{link.activeUrl} ({link.shortlinkKey})
												</TooltipContent>
											</Tooltips>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-2">
								{addLabel}
							</label>
							<div className="flex flex-col gap-3">
								<Textarea
									placeholder="Enter IPs (newline or comma separated)"
									value={inputValue}
									onChange={(e) => setInputValue(e.target.value)}
									disabled={saving || loading}
								/>
								<Button
									onClick={addIps}
									disabled={saving || loading}
									className="w-full max-w-xs cursor-pointer"
								>
									{saving || loading ? (
										<EntityButtonLoading className="fill-white dark:fill-black w-5 h-5" />
									) : (
										"ADD"
									)}
								</Button>
							</div>
						</div>

						<div>
							<h3 className="text-sm font-medium mb-3">{listLabel}</h3>
							<div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
								{loading ? (
									<div className="flex px-5">
										<EntityButtonLoading className="fill-black dark:fill-white w-5 h-5" />
									</div>
								) : ips.length === 0 ? (
									<p className="text-sm text-red-700">{emptyMsg}</p>
								) : (
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
										{ips.map((ip) => (
											<div
												key={ip}
												className="flex justify-between items-center border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
											>
												<span className="text-sm">{ip}</span>
												<Tooltips>
													<TooltipTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={() => removeIp(ip)}
															disabled={saving}
															className={"border-neutral-900/30 cursor-pointer"}
														>
															{saving ? (
																<EntityButtonLoading className="fill-black dark:fill-white w-5 h-5" />
															) : (
																<TrashIcon className="w-4 h-4 text-red-600" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														<p>Remove</p>
													</TooltipContent>
												</Tooltips>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
