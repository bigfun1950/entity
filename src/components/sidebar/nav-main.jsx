"use client";

import { ChevronRight } from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

export function NavMain({ items }) {
	const router = useRouter();
	const Goto = (path) => {
		if (
			typeof path === "string" &&
			(path.startsWith("http://") || path.startsWith("https://"))
		) {
			window.open(path, "_blank", "noopener,noreferrer");
		} else {
			router.push(path);
		}
	};
	return (
		<SidebarGroup>
			<SidebarGroupLabel
				onClick={() => Goto("/dashboard")}
				className={
					"cursor-pointer w-max text-red-700 font-bold hover:text-blue-700 transition duration-200"
				}
			>
				{process.env.NEXT_PUBLIC_ORG}
			</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						asChild
						defaultOpen={item.isActive}
						className="group/collapsible"
					>
						<SidebarMenuItem>
							<CollapsibleTrigger asChild>
								<SidebarMenuButton tooltip={item.title}>
									{item.icon && <item.icon className={item.color} />}
									<span className="font-semibold">{item.title}</span>
									<ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
								</SidebarMenuButton>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<SidebarMenuSub>
									{item.items?.map((subItem) => (
										<SidebarMenuSubItem key={subItem.title}>
											<SidebarMenuSubButton asChild>
												<p
													onClick={() => Goto(subItem.url)}
													className="cursor-pointer"
												>
													<span className="font-bold text-lg text-purple-800">
														*
													</span>
													<span>{subItem.title}</span>
												</p>
											</SidebarMenuSubButton>
										</SidebarMenuSubItem>
									))}
								</SidebarMenuSub>
							</CollapsibleContent>
						</SidebarMenuItem>
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
