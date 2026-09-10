"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Tooltips,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleQuestionMark } from "lucide-react";

export default function EntityBackupUrlHelperPopover() {
	return (
		<div className="relative flex items-center">
			<TooltipProvider>
				<Tooltips>
					<Popover>
						<TooltipTrigger asChild>
							<PopoverTrigger asChild>
								<button
									type="button"
									className="absolute right-2 -top-8 cursor-help rounded-full"
								>
									<CircleQuestionMark className="w-4 h-4 fill-white text-black dark:fill-black/10 dark:text-white hover:text-blue-700 transition duration-150" />
								</button>
							</PopoverTrigger>
						</TooltipTrigger>
						<PopoverContent side="right" align="center" className="w-80 p-4">
							<p className="text-sm text-black/80 dark:text-white/80">
								The Backup URL is an optional link that will be used if the main
								URL is flagged or dead. This helps ensure your shortlink always
								works, even if the primary destination is down.
							</p>
						</PopoverContent>
					</Popover>
					<TooltipContent side="right" align="center">
						What's this?
					</TooltipContent>
				</Tooltips>
			</TooltipProvider>
		</div>
	);
}
