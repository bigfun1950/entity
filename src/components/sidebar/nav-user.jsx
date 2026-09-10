"use client";

import {
	BadgeCheck,
	Bell,
	ChevronsUpDown,
	LogOut,
	Sparkles,
	Copy,
	Check,
	ChevronLeft,
	Settings2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNotificationSound } from "@/hooks/useNotificationSound";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

import EntityButtonLoading from "@/components/ui/entityButtonLoading";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NavUser({ user, handleLogout, loading, username }) {
	const { isMobile } = useSidebar();
	const [copied, setCopied] = useState(false);
	const [openAccountManagementDialog, setOpenAccountManagementDialog] =
		useState(false);
	const [openAccountInfoDialog, setOpenAccountInfoDialog] = useState(false);
	const [paying, setPaying] = useState(false);
	const [countdown, setCountdown] = useState("");
	const [openNotificationsDialog, setOpenNotificationsDialog] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const prevUnreadRef = useRef(0);
	const playNotificationSound = useNotificationSound("/notif.wav");
	const [entity, setEntity] = useState(null);
	const router = useRouter();
	const Goto = (path) => router.push(path);

	const logoutTimerRef = useRef(null);
	const countdownTimerRef = useRef(null);

	const handleCopy = async () => {
		if (!user?.apikey) return;
		await navigator.clipboard.writeText(user.apikey);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const formatCountdown = (ms) => {
		const seconds = Math.floor(ms / 1000) % 60;
		const minutes = Math.floor(ms / (1000 * 60)) % 60;
		const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
		const days = Math.floor(ms / (1000 * 60 * 60 * 24));

		if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
		if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
		if (minutes > 0) return `${minutes}m ${seconds}s`;
		return `${seconds}s`;
	};

	const ExpiredPlan = async () => {
		try {
			await fetch("/api/users/downgrade", { method: "POST" });
			await fetch("/api/users/logout", { method: "POST" });
		} finally {
			router.push("/login");
		}
	};

	useEffect(() => {
		if (!username) return;
		const controller = new AbortController();

		const fetchUser = async () => {
			try {
				const res = await fetch(`/api/users/live?username=${username}`, {
					cache: "no-store",
					signal: controller.signal,
				});

				if (!res.ok) throw new Error("Fetch failed");

				const data = await res.json();
				const u = data.user;
				setEntity(u);

				if (!u || (u.expiresAt && new Date(u.expiresAt) <= new Date())) {
					await SignOut();
					return;
				}

				clearTimeout(logoutTimerRef.current);
				clearInterval(countdownTimerRef.current);

				if (u.expiresAt) {
					const msUntilExpire = new Date(u.expiresAt) - Date.now();
					logoutTimerRef.current = setTimeout(ExpiredPlan, msUntilExpire);

					countdownTimerRef.current = setInterval(() => {
						const remaining = new Date(u.expiresAt) - new Date();
						if (remaining <= 0) {
							setCountdown("Expired");
							clearInterval(countdownTimerRef.current);
						} else {
							setCountdown(formatCountdown(remaining));
						}
					}, 1000);
				}
			} catch (err) {
				if (err.name !== "AbortError") {
					setEntity(null);
					await SignOut();
				}
			}
		};

		fetchUser();
		const interval = setInterval(fetchUser, 5000);

		return () => {
			controller.abort();
			clearInterval(interval);
			clearTimeout(logoutTimerRef.current);
			clearInterval(countdownTimerRef.current);
		};
	}, [username, router]);

	const SignOut = async () => {
		const res = await fetch("/api/users/logout", { method: "POST" });
		if (res.ok) router.push("/login");
	};

	const handlePayment = async () => {
		if (paying) return;
		setPaying(true);

		const createTransactionAndPay = async () => {
			const res = await fetch("/api/payment/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					amount: 150000,
					items: [
						{
							id: "pro-150k",
							price: 150000,
							quantity: 1,
							name: "Pro Subscription - 7 Days",
						},
					],
					customer: {
						first_name: username || "ENTITY",
						email: user?.email || "user@entity.com",
					},
				}),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data?.error || "Failed to create payment");
			if (!window?.snap) throw new Error("Midtrans Snap not loaded");

			return new Promise((resolve, reject) => {
				window.snap.pay(data.token, {
					onSuccess: async (result) => {
						try {
							await fetch("/api/users/upgrade", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ plan: "pro" }),
							});
							router.push("/login");
						} finally {
							setPaying(false);
						}
						resolve(result);
					},
					onPending: function (result) {
						setPaying(false);
						toast.info("Payment is pending!");
						resolve(result);
					},
					onError: function (result) {
						setPaying(false);
						if (result.error_code === "INSUFFICIENT_FUNDS") {
							reject(new Error("INSUFFICIENT_FUNDS"));
						} else if (result.error_code === "INVALID_CARD") {
							reject(new Error("INVALID_CARD"));
						} else {
							reject(new Error("PAYMENT_FAILED"));
						}
					},
					onClose: function () {
						setPaying(false);
						reject(new Error("USER_CLOSED_PAYMENT"));
					},
				});
			});
		};

		try {
			await toast.promise(createTransactionAndPay(), {
				loading: "Processing payment...",
				success: () => "Payment successful!",
				error: (err) => {
					if (err.message === "USER_CLOSED_PAYMENT")
						return "Payment was cancelled!";
					if (err.message === "INSUFFICIENT_FUNDS")
						return "Insufficient funds. Please check your balance!";
					if (err.message === "INVALID_CARD")
						return "Invalid card. Please verify your card details!";
					if (err.message === "PAYMENT_FAILED")
						return "Payment failed. Please try again!";
					return "There was an error processing your payment. Please try again!";
				},
			});
		} catch {}
	};

	useEffect(() => {
		if (unreadCount > prevUnreadRef.current) {
			playNotificationSound();
		}
		prevUnreadRef.current = unreadCount;
	}, [unreadCount, playNotificationSound]);

	let interval;

	useEffect(() => {
		const fetchNotifications = async () => {
			try {
				const res = await fetch("/api/users/notifications");
				if (res.ok) {
					const data = await res.json();
					setNotifications(data.notifications || []);
					setUnreadCount(data.notifications.filter((n) => !n.read).length);
				}
			} catch (err) {
				console.error("Notifications fetch error:", err);
			}
		};

		fetchNotifications();
		interval = setInterval(fetchNotifications, 5000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (openNotificationsDialog && unreadCount > 0) {
			setUnreadCount(0);
			fetch("/api/users/notifications/mark-read", { method: "POST" });
		}
	}, [openNotificationsDialog, unreadCount]);

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={user.avatar} alt={user.name} />
								<AvatarFallback className="rounded-lg">-</AvatarFallback>
							</Avatar>
							{loading ? (
								"Loading..."
							) : (
								<div className="grid flex-1 text-left text-sm leading-tight">
									<div className="flex gap-1">
										<span className="truncate font-semibold capitalize">
											{user.name}
										</span>
										<span className="truncate font-semibold capitalize">
											{paying ? (
												<EntityButtonLoading
													className={"w-4 h-4 ml-2 mt-[1px]"}
												/>
											) : (
												<span>( {entity?.plan} )</span>
											)}
										</span>
									</div>
									<span className="truncate text-xs">{user.email}</span>
								</div>
							)}
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "bottom"}
						align="center"
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuItem
								onClick={handlePayment}
								className={"cursor-pointer"}
							>
								<Sparkles />
								Upgrade to Pro (7 Day)
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuGroup>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenAccountManagementDialog(true)}
							>
								<Settings2 />
								Account Management
							</DropdownMenuItem>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={() => setOpenAccountInfoDialog(true)}
							>
								<BadgeCheck />
								Account Info
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setOpenNotificationsDialog(true)}
							>
								<div className="flex justify-between w-full items-center">
									<Bell className="mr-2" />
									<p className="w-full cursor-pointer">Notifications</p>
									{unreadCount > 0 && (
										<>
											<Badge className="h-5 min-w-5 rounded-full px-1 font-bold tabular-nums">
												{unreadCount}
											</Badge>
										</>
									)}
								</div>
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleLogout}
							className={"cursor-pointer"}
						>
							<LogOut />
							<span className="font-semibold text-red-700">Log out</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<AlertDialog
					open={openAccountManagementDialog}
					onOpenChange={setOpenAccountManagementDialog}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Account Management</AlertDialogTitle>
							<AlertDialogDescription>
								You can manage your account here.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<div className="flex items-center justify-between rounded-lg border p-3 bg-muted">
							<p>COMING SOON</p>
						</div>
						<AlertDialogFooter>
							<AlertDialogCancel
								onClick={() => setOpenAccountManagementDialog(false)}
								className={"border-neutral-900/30 cursor-pointer"}
							>
								<ChevronLeft />
							</AlertDialogCancel>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog
					open={openAccountInfoDialog}
					onOpenChange={setOpenAccountInfoDialog}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								<span className={"capitalize"}>{user?.name}</span> ({" "}
								<span>{user?.email}</span> )
							</AlertDialogTitle>
							<AlertDialogDescription>
								You can see your account info here.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="p-3 border rounded-lg mb-4 bg-muted">
							<p className="font-semibold">
								Current Plan :{" "}
								<span
									className={
										entity?.plan === "free"
											? "text-red-700"
											: entity?.plan === "pro"
											? "text-blue-700"
											: ""
									}
								>
									{entity?.plan
										? entity?.plan.charAt(0).toUpperCase() +
										  entity?.plan.slice(1).toLowerCase()
										: "Unknown"}{" "}
									{entity?.plan === "free"
										? "( Upgrade your plan to use ENTITY )"
										: ""}
								</span>
							</p>

							<p className="font-semibold">
								Shortlinks Creation Limit :{" "}
								<span
									className={
										entity?.shortlinksLimit === 1
											? "text-red-700"
											: entity?.shortlinksLimit === 5
											? "text-blue-700"
											: ""
									}
								>
									{entity?.shortlinksLimit}
								</span>
							</p>

							<div className="flex justify-between">
								<p className="font-semibold  truncate max-w-[190px] sm:max-w-full">
									Apikey :{" "}
									<span className="font-normal text-yellow-600">
										{user.apikey || "No API key available"}
									</span>
								</p>
								<Tooltips>
									<TooltipTrigger asChild>
										<div
											onClick={handleCopy}
											className="ml-2 text-muted-foreground hover:text-foreground transition cursor-pointer"
										>
											{copied ? (
												<Check className="h-4 w-4 text-green-600 mt-[6px]" />
											) : (
												<Copy className="h-4 w-4 mt-[6px]" />
											)}
										</div>
									</TooltipTrigger>
									<TooltipContent>
										<p>Copy your apikey</p>
									</TooltipContent>
								</Tooltips>
							</div>

							{entity?.expiresAt && (
								<p className="flex text-sm mt-1 gap-2">
									Expires in :{" "}
									{countdown || (
										<EntityButtonLoading className="invert-0 w-5 h-5" />
									)}
								</p>
							)}
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel
								onClick={() => setOpenAccountInfoDialog(false)}
								className={"border-neutral-900/30 cursor-pointer"}
							>
								<ChevronLeft />
							</AlertDialogCancel>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog
					open={openNotificationsDialog}
					onOpenChange={setOpenNotificationsDialog}
				>
					<AlertDialogContent className="max-h-[80vh] overflow-y-auto">
						<AlertDialogHeader>
							<AlertDialogTitle>Your Notifications</AlertDialogTitle>
							<AlertDialogDescription>
								All notifications will be stored here.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<div className="space-y-3 mt-2">
							{notifications.length > 0 ? (
								notifications.map((n, i) => (
									<div
										key={i}
										className={`p-3 rounded-lg border ${
											n.read ? "bg-muted" : "bg-blue-100 dark:bg-blue-900"
										}`}
									>
										{n.read ? (
											<div className="flex w-full justify-between">
												<div className="flex flex-col">
													<p>{n.message}</p>
													<p>
														{n.url ? (
															<span
																onClick={() => Goto(n.url)}
																href={n.url}
																className="cursor-pointer relative font-bold text-green-700 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1.5px] after:bg-green-700 after:transition-all after:duration-300 hover:after:w-full"
															>
																Open
															</span>
														) : (
															""
														)}
													</p>
												</div>
											</div>
										) : (
											<div className="flex w-full justify-between">
												<div className="flex flex-col">
													<p>{n.message}</p>
													<p>
														{n.url ? (
															<span
																onClick={() => Goto(n.url)}
																href={n.url}
																className="cursor-pointer relative font-bold text-green-700 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1.5px] after:bg-green-700 after:transition-all after:duration-300 hover:after:w-full"
															>
																Open
															</span>
														) : (
															""
														)}
													</p>
												</div>
												<Badge className="h-5 min-w-5 rounded-full px-1 tabular-nums font-bold">
													New!
												</Badge>
											</div>
										)}
										<p className="text-xs font-bold text-blue-700 mt-1">
											{new Date(n.createdAt).toLocaleString()}
										</p>
									</div>
								))
							) : (
								<p className="text-sm">No notifications yet.</p>
							)}
						</div>

						<AlertDialogFooter>
							<AlertDialogCancel
								onClick={() => setOpenNotificationsDialog(false)}
								className={"border-neutral-900/30 cursor-pointer"}
							>
								<ChevronLeft />
							</AlertDialogCancel>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
