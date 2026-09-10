"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FloatingInput } from "@/components/ui/floatingInput";
import Image from "next/image";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";

export default function EntityDashboard() {
	const [users, setUsers] = useState([]);
	const [filtered, setFiltered] = useState([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [editingUser, setEditingUser] = useState(null);
	const [deletingUser, setDeletingUser] = useState(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [giftingUser, setGiftingUser] = useState(null);
	const [giftMessage, setGiftMessage] = useState("");
	const [exportingBotIps, setExportingBotIps] = useState(false);
	const [deletingBotIps, setDeletingBotIps] = useState(false);
	const [deletingNotif, setDeletingNotif] = useState(false);
	const [format, setFormat] = useState("json");
	const [url, setUrl] = useState("");
	const [form, setForm] = useState({
		username: "",
		email: "",
		plan: "",
		expiresAt: "",
		password: "",
		shortlinksLimit: "",
	});

	const router = useRouter();

	const fetchUsers = async () => {
		try {
			const res = await fetch(`/api/dev-entity/users/list`, {
				credentials: "include",
				cache: "no-store",
			});

			if (res.status === 401) {
				router.push("/dev-entity");
				return;
			}

			const data = await res.json();
			if (data.success) {
				setUsers(data.users);
				setFiltered((prev) => {
					if (!query) return data.users;
					const q = query.toLowerCase();
					return data.users.filter(
						(u) =>
							u.username.toLowerCase().includes(q) ||
							u.email.toLowerCase().includes(q)
					);
				});
			}
		} catch (err) {
			console.error("Failed to fetch users:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
		const interval = setInterval(fetchUsers, 5000);
		return () => clearInterval(interval);
	}, [router, query]);

	const handleLogout = async () => {
		await toast.promise(
			(async () => {
				const res = await fetch("/api/dev-entity/auth/logout", {
					method: "POST",
					credentials: "include",
				});

				if (!res.ok) throw new Error("Logout failed.");
				router.push("/dev-entity");
			})(),
			{
				loading: "Logging out...",
				success: "Logged out successfully.",
				error: "Logout failed.",
			}
		);
	};

	const handleEdit = (user) => {
		setEditingUser(user);
		setForm({
			username: user.username,
			email: user.email,
			plan: user.plan,
			expiresAt: user.expiresAt
				? new Date(user.expiresAt).toISOString().split("T")[0]
				: "",
			password: "",
			shortlinksLimit: user.shortlinksLimit || "",
		});
	};

	const handleUpdate = async () => {
		await toast.promise(
			(async () => {
				const payload = {
					userId: editingUser._id,
					username: form.username || undefined,
					email: form.email || undefined,
					plan: form.plan || undefined,
					expiresAt: form.expiresAt || undefined,
					password: form.password || undefined,
					shortlinksLimit: form.shortlinksLimit
						? Number(form.shortlinksLimit)
						: undefined,
				};

				const res = await fetch("/api/dev-entity/users/update", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				if (!res.ok) throw new Error("Failed to update user");

				setEditingUser(null);
				setForm({
					username: "",
					email: "",
					plan: "",
					expiresAt: "",
					password: "",
				});
				await fetchUsers();
			})(),
			{
				loading: "Updating user...",
				success: "User updated successfully!",
				error: "Failed to update user.",
			}
		);
	};

	const handleDelete = async () => {
		if (!deletingUser) return;

		await toast.promise(
			(async () => {
				const res = await fetch("/api/dev-entity/users/delete", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: deletingUser._id }),
				});

				if (!res.ok) throw new Error("Failed to delete user");

				await fetchUsers();
				setDeletingUser(null);
				setConfirmOpen(false);
			})(),
			{
				loading: "Deleting user...",
				success: "User deleted successfully!",
				error: "Failed to delete user",
			}
		);
	};

	const handleExport = async () => {
		setExportingBotIps(true);
		try {
			const res = await fetch("/api/dev-entity/botip/export", {
				credentials: "include",
				cache: "no-store",
			});

			if (!res.ok) throw new Error("Failed to fetch bot_ips");

			const { docs } = await res.json();

			let content;
			let filename;

			if (format === "txt") {
				content = docs.map((d) => d.visitorIp).join("\n");
				filename = "bot_ips.txt";
			} else {
				content = JSON.stringify(docs, null, 2);
				filename = "bot_ips.json";
			}

			const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			a.click();
			URL.revokeObjectURL(url);

			toast.success(`Exported ${docs.length} documents as ${filename}`);
		} catch (err) {
			console.error(err);
			toast.error("Failed to export bot_ips");
		} finally {
			setExportingBotIps(false);
		}
	};

	return (
		<div className="p-8 bg-neutral-900/10 min-h-screen">
			<Card className="rounded-2xl border border-gray-200">
				<CardHeader className="grid sm:flex sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<Image
							src="/entity.svg"
							alt="entity"
							width={20}
							height={20}
							className="w-12 h-12"
						/>
						<CardTitle className="text-xl font-semibold">
							{process.env.NEXT_PUBLIC_ORG}
						</CardTitle>
					</div>

					<div className="flex flex-col sm:flex-row sm:items-center gap-3">
						<div className="relative sm:w-64">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
							<Input
								placeholder="Search by username or email..."
								className="pl-8"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</div>
						<Button
							variant="default"
							onClick={handleLogout}
							className="flex items-center gap-2 text-red-700 font-semibold"
						>
							<LogOut className="h-4 w-4 text-red-700" />
							Logout
						</Button>
					</div>
				</CardHeader>

				<CardContent>
					<div className="pb-10">
						<h1 className="text-xl font-bold mb-4">Karma Control Panel</h1>

						<div className="grid md:grid-cols-2 gap-2">
							<div className="grid gap-5 sm:flex sm:justify-between sm:items-center bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
								<div>
									<p className="font-semibold text-red-800">
										Delete All Users Notifications
									</p>
									<p className="text-sm text-red-600">
										This action cannot be undone.
									</p>
								</div>
								<Button
									size="sm"
									variant="destructive"
									disabled={deletingNotif}
									onClick={async () => {
										setDeletingNotif(true);
										await toast.promise(
											(async () => {
												const res = await fetch(
													"/api/dev-entity/notifications/delete",
													{
														method: "POST",
														credentials: "include",
													}
												);
												setDeletingNotif(false);
												if (!res.ok)
													throw new Error("Failed to delete notifications");
											})(),
											{
												loading: "Deleting notifications...",
												success: "All notifications deleted successfully!",
												error: "Failed to delete notifications",
											}
										);
									}}
									className="font-semibold w-22"
								>
									{deletingNotif ? (
										<EntityButtonLoading className={"w-4 h-4"} />
									) : (
										"Delete"
									)}
								</Button>
							</div>

							<div className="grid gap-5 sm:flex sm:justify-between sm:items-center bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
								<div>
									<p className="font-semibold text-red-800">
										Delete All stored bot IPs in MongoDB
									</p>
									<p className="text-sm text-red-600">
										Removes all IPs from MongoDB. This cannot be undone.
									</p>
								</div>
								<Button
									size="sm"
									variant="destructive"
									disabled={deletingBotIps}
									onClick={async () => {
										setDeletingBotIps(true);
										await toast.promise(
											(async () => {
												const res = await fetch(
													"/api/dev-entity/botip/delete",
													{
														method: "POST",
														credentials: "include",
													}
												);
												setDeletingBotIps(false);
												if (!res.ok)
													throw new Error("Failed to delete bot_ips");
											})(),
											{
												loading: "Deleting bot_ips...",
												success: "All bot IPs deleted successfully!",
												error: "Failed to delete bot_ips",
											}
										);
									}}
									className="font-semibold w-22"
								>
									{deletingBotIps ? (
										<EntityButtonLoading className="w-4 h-4" />
									) : (
										"Delete"
									)}
								</Button>
							</div>

							<div className="grid gap-5 sm:flex sm:justify-between sm:items-center bg-neutral-50 border rounded-xl p-4 shadow-sm">
								<div>
									<p className="font-semibold text-gray-800">
										Export stored bot IPs in MongoDB
									</p>
									<p className="text-sm text-gray-500">
										Choose format and download data.
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Select value={format} onValueChange={setFormat}>
										<SelectTrigger className="w-28">
											<SelectValue placeholder="Format" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="json">JSON</SelectItem>
											<SelectItem value="txt">TXT</SelectItem>
										</SelectContent>
									</Select>
									<Button
										disabled={exportingBotIps}
										onClick={handleExport}
										className="font-semibold w-22"
									>
										{exportingBotIps ? (
											<EntityButtonLoading className={"w-4 h-4"} />
										) : (
											"Export"
										)}
									</Button>
								</div>
							</div>
						</div>
					</div>

					{loading ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{Array.from({ length: 6 }).map((_, i) => (
								<Skeleton key={i} className="h-40 rounded-xl" />
							))}
						</div>
					) : filtered.length === 0 ? (
						<p className="text-sm text-muted-foreground text-center py-6">
							No users found.
						</p>
					) : (
						<div className="grid gap-4">
							<h1 className="text-xl font-bold">Karma User List</h1>
							{filtered.map((user) => {
								const cardColor =
									user.plan === "pro"
										? "bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200"
										: "bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200";

								return (
									<Card
										key={user._id}
										className={`p-5 shadow-md hover:shadow-lg transition-shadow rounded-2xl border ${cardColor}`}
									>
										<div>
											<div className="flex items-center justify-between">
												<h3 className="font-semibold text-lg capitalize">
													{user.username}
												</h3>
												<span
													className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
														user.plan === "pro"
															? "bg-blue-600 text-background"
															: "bg-neutral-500 text-background"
													}`}
												>
													{user.plan}
												</span>
											</div>

											<p className="text-sm text-blue-700 truncate mb-5 font-semibold">
												{user.email}
											</p>

											<div className="grid grid-cols-1 lg:grid-cols-5 gap-2 text-sm text-gray-800">
												<div>
													<p className="font-semibold">
														SHORTLINK CREATIONS LIMIT
													</p>
													<span className="text-blue-700 font-semibold">
														{user.shortlinksLimit || 0}
													</span>
												</div>
												<div>
													<p className="font-semibold">TOTAL SHORTLINK</p>
													<span className="text-blue-700 font-semibold">
														{user.totalShortlinks || 0}
													</span>
												</div>
												<div>
													<p className="font-semibold">ACCOUNT CREATED AT</p>
													<span className="text-green-700 font-semibold">
														{user.createdAt
															? new Date(user.createdAt).toLocaleDateString()
															: "—"}
													</span>
												</div>
												<div>
													<p className="font-semibold">ACCOUNT EXPIRED AT</p>
													<span className="text-red-700 font-semibold">
														{user.expiresAt
															? new Date(user.expiresAt).toLocaleDateString()
															: "—"}
													</span>
												</div>
												<div>
													<p className="font-semibold">LAST LOGIN</p>
													<span className="text-purple-700 font-semibold">
														{user.lastLogin
															? new Date(user.lastLogin).toLocaleString()
															: "—"}
													</span>
												</div>
												<div>
													<p className="font-semibold">APIKEY</p>
													<span className="text-amber-600 font-semibold">
														{user.apikey || "—"}
													</span>
												</div>
											</div>
										</div>

										<div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
											<Button
												size="sm"
												variant="default"
												onClick={() => {
													setGiftingUser(user);
													setGiftMessage("");
												}}
												className={"font-semibold"}
											>
												Gift User
											</Button>
											<Button
												size="sm"
												variant="default"
												onClick={() => handleEdit(user)}
												className={"font-semibold"}
											>
												Edit User
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => {
													setDeletingUser(user);
													setConfirmOpen(true);
												}}
												className={"font-semibold"}
											>
												Delete User
											</Button>
										</div>
									</Card>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<Dialog open={!!giftingUser} onOpenChange={() => setGiftingUser(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Send Gift</DialogTitle>
					</DialogHeader>

					<div className="space-y-4">
						<p>
							Send a gift notification to{" "}
							<strong>{giftingUser?.username}</strong>.
						</p>
						<FloatingInput
							id="giftMessage"
							label="Gift Message"
							type="text"
							value={giftMessage}
							onChange={(e) => setGiftMessage(e.target.value)}
						/>
						<FloatingInput
							id="url"
							label="URL"
							type="text"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
						/>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={() => setGiftingUser(null)}>
							Cancel
						</Button>
						<Button
							onClick={async () => {
								await toast.promise(
									(async () => {
										const res = await fetch("/api/dev-entity/gift", {
											method: "POST",
											credentials: "include",
											headers: { "Content-Type": "application/json" },
											body: JSON.stringify({
												userId: giftingUser._id,
												url: url || undefined,
												message: giftMessage || undefined,
											}),
										});

										if (!res.ok) throw new Error("Failed to send gift");

										setGiftingUser(null);
										setGiftMessage("");
										setUrl("");
									})(),
									{
										loading: "Sending gift...",
										success: "Gift sent successfully!",
										error: "Failed to send gift",
									}
								);
							}}
						>
							Send Gift
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Delete</DialogTitle>
					</DialogHeader>
					<p>
						Are you sure you want to delete{" "}
						<strong>{deletingUser?.username}</strong>? This action cannot be
						undone.
					</p>
					<DialogFooter className="mt-4 flex justify-end gap-2">
						<Button variant="outline" onClick={() => setConfirmOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<FloatingInput
							id="username"
							label="Change Username"
							type="text"
							onChange={(e) => setForm({ ...form, username: e.target.value })}
						/>
						<FloatingInput
							id="email"
							label="Change Email"
							type="text"
							onChange={(e) => setForm({ ...form, email: e.target.value })}
						/>
						<FloatingInput
							id="plan"
							label="Change Plan"
							type="text"
							onChange={(e) => setForm({ ...form, plan: e.target.value })}
						/>
						<FloatingInput
							id="expiresAt"
							label="Change Plan Expiration Date"
							type="date"
							value={form.expiresAt}
							onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
						/>
						<FloatingInput
							id="password"
							label="New Password (leave empty to keep old)"
							type="password"
							value={form.password}
							onChange={(e) => setForm({ ...form, password: e.target.value })}
						/>
						<FloatingInput
							id="shortlinksLimit"
							label="Change Creations Limit"
							type="number"
							onChange={(e) =>
								setForm({ ...form, shortlinksLimit: e.target.value })
							}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditingUser(null)}>
							Cancel
						</Button>
						<Button onClick={handleUpdate}>Save Changes</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
