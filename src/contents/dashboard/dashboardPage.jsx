"use client";

import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import CreateShortlinkTab from "@/contents/tabs/createShortlink";
import ManageShortlinksTab from "@/contents/tabs/manageShortlinks";
import React, { useState, useEffect } from "react";
import ShortlinksStatisticTab from "@/contents/tabs/shortlinksStatistic";
import IPsManagementTab from "@/contents/tabs/ipsManagement";
import DashboardCoreTab from "@/contents/tabs/dashboardCore";
import TutorialTab from "@/contents/tabs/tutorial";
import Loading from "@/app/loading";
import LiveTest from "@/components/livetest/LiveTest";
import { EntityLiveTester } from "@/components/title/EntityTitle";
import ChangelogsTab from "../tabs/changelogs";

export default function DashboardPageContents() {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const tab = searchParams.get("tab") || "core";
	const router = useRouter();
	const Goto = (path) => router.push(path);

	const [entity, setEntity] = useState(null);

	useEffect(() => {
		const fetchUser = async () => {
			const res = await fetch("/api/users/me");
			if (res.ok) {
				const data = await res.json();
				setEntity(data.user);
			} else {
				Goto("/login");
			}
		};
		fetchUser();
	}, []);

	const renderTabComponent = () => {
		if (!entity) return null;

		switch (tab) {
			case "create_shortlink":
				return <CreateShortlinkTab user={entity.username} />;
			case "manage_shortlinks":
				return <ManageShortlinksTab user={entity.username} />;
			case "shortlinks_statistic":
				return (
					<ShortlinksStatisticTab
						user={entity.username}
						apikey={entity.apikey}
					/>
				);
			case "ips_management":
				return <IPsManagementTab user={entity.username} />;
			case "live_tester":
				return (
					<div className="p-4">
						<div className={"mb-10 -mt-2"}>
							<EntityLiveTester className="w-42 h-5 sm:h-7" />
						</div>
						<LiveTest />
					</div>
				);
			case "tutorial":
				return (
					<div className="p-4">
						<TutorialTab />
					</div>
				);
			case "changelogs":
				return <ChangelogsTab />;
			case "core":
				return (
					<DashboardCoreTab owner={entity.username} apikey={entity.apikey} />
				);
			default:
				return <div>Tab not found</div>;
		}
	};

	const tabLabels = {
		create_shortlinks: "Create Shortlink",
		manage_shortlinks: "Manage Shortlinks",
		shortlinks_statistic: "Shortlinks Statistic",
		ips_management: "IPs Management",
		live_tester: "Live Tester",
		tutorial: "Tutorial",
		core: "Dashboard",
	};

	if (!entity) return <Loading />;

	const pathParts = pathname.split("/").filter(Boolean);
	const breadcrumbParts = [
		"",
		...pathParts,
		...(tab && tab !== "core" ? [tab] : []),
	];

	return (
		<SidebarProvider>
			<AppSidebar entity={entity} />
			<SidebarInset className={"bg-neutral-100"}>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 justify-between">
					<div className="flex items-center gap-2 px-4">
						<Tooltips>
							<TooltipTrigger asChild>
								<SidebarTrigger className="-ml-1" />
							</TooltipTrigger>
							<TooltipContent>
								<p>Show/Hide Navigation</p>
							</TooltipContent>
						</Tooltips>
						<Separator
							orientation="vertical"
							className="mr-2 data-[orientation=vertical]:h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								{breadcrumbParts.map((part, index) => {
									const isLast = index === breadcrumbParts.length - 1;
									const href =
										"/" + breadcrumbParts.slice(1, index + 1).join("/");
									const label =
										part === ""
											? "Home"
											: tabLabels[part] ||
											  part
													.replace(/_/g, " ")
													.replace(/\b\w/g, (c) => c.toUpperCase());

									return (
										<React.Fragment key={href || "home"}>
											{index !== 0 && (
												<BreadcrumbSeparator className="hidden md:block" />
											)}
											<BreadcrumbItem
												className={isLast ? "" : "hidden md:block"}
											>
												{isLast ? (
													<span className="font-semibold text-red-700">
														{label}
													</span>
												) : (
													<Link href={href} className="hover:text-blue-700">
														{label}
													</Link>
												)}
											</BreadcrumbItem>
										</React.Fragment>
									);
								})}
							</BreadcrumbList>
						</Breadcrumb>
					</div>
				</header>

				<AnimatePresence mode="wait">
					<motion.div
						key={tab}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.1, ease: "easeInOut" }}
					>
						{renderTabComponent()}
					</motion.div>
				</AnimatePresence>
			</SidebarInset>
		</SidebarProvider>
	);
}
