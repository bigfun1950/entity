"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";

export default function Header() {
	const pathname = usePathname();

	const isSignupPage = pathname === "/signup";
	const isLoginPage = pathname === "/login";
	const isDashboardPage = pathname === "/dashboard";

	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 10 && !scrolled) {
				setScrolled(true);
			} else {
				setScrolled(false);
			}
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [scrolled]);

	return (
		<motion.header
			className={`flex justify-end p-2 bg-transparent ${
				isDashboardPage ? "absolute right-4 top-2" : "sticky top-0"
			} z-50 ${isSignupPage || isLoginPage ? "border-none" : "border-none"}`}
		>
			<div className="flex">
				<Popover>
					<PopoverTrigger asChild>
						<div
							className={`${
								isDashboardPage ? "w-8 h-8" : "w-12 h-12"
							} flex items-center justify-center cursor-pointer rounded-full bg-black`}
						>
							<Image
								src="/entity.svg"
								width={22}
								height={18}
								alt="entity"
								className={`animate-pulse hover:animate-spin ${
									isDashboardPage ? "w-6" : "w-8"
								} ${isSignupPage || isLoginPage ? "invert" : "invert"}`}
							/>
						</div>
					</PopoverTrigger>
					<PopoverContent side="top" className="w-42 p-4 mr-2">
						{isDashboardPage ? (
							<div className="flex flex-col gap-3">
								<Link href="/">
									<Button className="w-full">Home</Button>
								</Link>
							</div>
						) : (
							<div className="flex flex-col gap-3">
								<Link href="/login">
									<Button variant="default" className="w-full">
										Log In
									</Button>
								</Link>
								<Link href="/signup">
									<Button className="w-full">Sign Up</Button>
								</Link>
								<Link href="/">
									<Button className="w-full">Home</Button>
								</Link>
							</div>
						)}
					</PopoverContent>
				</Popover>
			</div>
		</motion.header>
	);
}
