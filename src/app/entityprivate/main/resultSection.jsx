"use client";

import { motion } from "motion/react";
import {
	CheckCircleIcon,
	XCircleIcon,
	QuestionMarkCircleIcon,
	ExclamationCircleIcon,
} from "@heroicons/react/24/solid";

export default function ResultsSection({ results }) {
	const completedEmails = results.filter((r) => !r.loading).slice(-18);

	const getStatusIcon = (status) => {
		switch (status) {
			case "Accepted":
				return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
			case "Rejected":
				return <XCircleIcon className="w-5 h-5 text-red-500" />;
			case "No MX":
				return <XCircleIcon className="w-5 h-5 text-fuchsia-700" />;
			case "MX Error":
				return <XCircleIcon className="w-5 h-5 text-pink-500" />;
			case "Catch-All":
				return <XCircleIcon className="w-5 h-5 text-white" />;
			case "Timeout":
				return <XCircleIcon className="w-5 h-5 text-amber-500" />;
			case "Unknown":
				return <QuestionMarkCircleIcon className="w-5 h-5 text-purple-500" />;
			case "SPAM Block":
				return <ExclamationCircleIcon className="w-5 h-5 text-red-700" />;
			default:
				return null;
		}
	};

	return (
		<div className="flex-1 border border-[#00ff6a] p-4 bg-black h-96 overflow-y-auto text-sm hide-scrollbar rounded">
			{completedEmails.length === 0 ? (
				<code>NO RESULTS YET...</code>
			) : (
				completedEmails.map((row, i) => (
					<motion.div
						key={i}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.1, delay: i * 0.015 }}
						className="flex items-center gap-2"
					>
						{getStatusIcon(row.status)}
						<code>
							{">"} {row.email} — {row.status.toUpperCase()}
						</code>
					</motion.div>
				))
			)}
		</div>
	);
}
