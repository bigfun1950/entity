import { Skeleton } from "@/components/ui/skeleton";
import * as React from "react";

function ManageShortlinkSkeleton({ count = 3 }) {
	return (
		<>
			{/* <div className="flex flex-col -mt-2 mb-7 space-y-2">
				<Skeleton className="h-10 w-[260px] sm:h-10 sm:w-[270px] rounded-md" />
			</div> */}
			<div className="grid gap-4">
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className="rounded-2xl border bg-card
                                shadow-md p-4 backdrop-blur"
					>
						<div className="flex flex-col mb-4 space-y-2">
							<Skeleton className="h-[22px] w-1/2 rounded-md bg-black/10" />
							<Skeleton className="h-[22px] w-1/2 rounded-md bg-black/10" />
							<Skeleton className="h-[22px] w-1/2 rounded-md bg-black/10" />
						</div>

						<div className="flex flex-col h-[15px] lg:h-[15px]"></div>

						<div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
							{Array.from({ length: 5 }).map((_, j) => (
								<div key={j} className="space-y-1 md:space-y-2">
									<Skeleton className="h-3 w-22 rounded-md bg-black/10" />
									<Skeleton className="h-3 w-12 rounded-md bg-black/10" />
								</div>
							))}
							<div
								className={
									"flex items-center lg:justify-end gap-2 mt-5 lg:mt-0"
								}
							>
								<Skeleton className="h-8 w-8 rounded-md bg-black/10" />
								<Skeleton className="h-8 w-8 rounded-md bg-black/10" />
								<Skeleton className="h-8 w-8 rounded-md bg-black/10" />
							</div>
						</div>
					</div>
				))}
			</div>
		</>
	);
}

function ApiKeySkeleton() {
	return (
		<>
			<Skeleton className="h-4 w-full sm:w-[300px] rounded-sm" />
			<Skeleton className="h-6 w-6 rounded-md" />
		</>
	);
}

function UsernameSkeleton() {
	return (
		<>
			<Skeleton className="h-4 w-48 sm:w-38 rounded-sm bg-neutral-300 dark:bg-accent" />
		</>
	);
}

function ClearStatisticIconSkeleton() {
	return;
}

export {
	ManageShortlinkSkeleton,
	ApiKeySkeleton,
	ClearStatisticIconSkeleton,
	UsernameSkeleton,
};
