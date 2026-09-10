"use client";

import { motion } from "motion/react";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

export default function CheckingSection({ results }) {
	const checkingEmails = results.filter((r) => r.loading).slice(-18);

	return (
		<div className="flex-1 border border-[#00ff6a] p-4 bg-black h-96 overflow-y-auto text-sm hide-scrollbar rounded">
			{checkingEmails.length === 0 ? (
				<code>NO EMAILS CURRENTLY CHECKING...</code>
			) : (
				checkingEmails.map((row, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.1, delay: i * 0.015 }}
						className="flex items-center gap-2"
					>
						<ArrowPathIcon className="w-5 h-5 animate-spin" />
						<code>
							{">"} {row.email} — CHECKING...
						</code>
					</motion.div>
				))
			)}
		</div>
	);
}
