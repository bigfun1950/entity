"use client";

import * as React from "react";
import { BookOpen, Bot, Link, Settings2 } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AppSidebar(props) {
	const [user, setUser] = useState(null);
	const [entity, setEntity] = useState(null);
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			try {
				const res = await fetch("/api/users/me");
				if (res.ok) {
					const data = await res.json();
					setUser(data.user);
					setEntity(data.user);
				} else {
					router.push("/login");
				}
			} catch (err) {
				console.error("Failed to fetch user:", err);
				router.push("/login");
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, [router]);

	const data = {
		user: {
			name: user?.username,
			email: user?.email,
			apikey: user?.apikey,
			plan: user?.plan,
			avatar: "/entity.svg",
		},
		navMain: [
			{
				title: "Shortlinks",
				url: "#",
				icon: Link,
				color: "text-blue-700",
				isActive: false,
				items: [
					{
						title: "Create Shortlink",
						url: "?tab=create_shortlink",
					},
					{
						title: "Manage Shortlink",
						url: "?tab=manage_shortlinks",
					},
					{
						title: "Shortlink Statistic",
						url: "?tab=shortlinks_statistic",
					},
				],
			},
			{
				title: "IPs Management",
				url: "#",
				icon: Bot,
				color: "text-red-700",
				items: [
					{
						title: "Whitelist & Blacklist",
						url: "?tab=ips_management",
					},
				],
			},
			{
				title: "Documentation",
				url: "#",
				icon: BookOpen,
				color: "text-yellow-500",
				isActive: true,
				items: [
					{
						title: "Live Tester",
						url: "?tab=live_tester",
					},
					{
						title: "Download Entity",
						url: "/entity.zip",
					},
					{
						title: "Tutorials",
						url: "?tab=tutorial",
					},
					{
						title: "Changelog",
						url: "?tab=changelogs",
					},
                    {
                        title: "Contact Admin",
                        url: "https://t.me/nisaetus_x",
                    },
				],
			},
		],
	};

	const handleLogout = async () => {
		try {
			const res = await fetch("/api/users/logout", { method: "POST" });
			if (res.ok) {
				router.push("/login");
			} else {
				const data = await res.json();
				alert(data.message || "Logout failed");
			}
		} catch (err) {
			console.error("Logout failed:", err);
			alert("Logout failed");
		}
	};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader className={"bg-card shadow-md"}>
				<NavUser
					entity={entity}
					user={data.user}
					username={user?.username}
					handleLogout={handleLogout}
					loading={loading}
				/>
			</SidebarHeader>
			<SidebarContent className={"bg-card shadow-md"}>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
