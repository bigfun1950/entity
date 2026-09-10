"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
	desktop: {
		label: "Desktop",
		color: "var(--chart-1)",
	},
	mobile: {
		label: "Mobile",
		color: "var(--chart-2)",
	},
};

import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";

export function ChartData({
	user,
	activeChart,
	loading,
	total,
	chartData,
	setActiveChart,
}) {
	if (!user) {
		<div className="flex items-center justify-center">
			<EntityButtonLoading className="invert dark:invert-0 w-22 h-22" />;
		</div>;
	}

	return (
		<Card className="py-0 h-full">
			<CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
				<div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
					<CardTitle className="text-red-800 font-bold">
						{process.env.NEXT_PUBLIC_ORG} CHARTS DATA
					</CardTitle>
					<CardDescription></CardDescription>
				</div>

				<div className="flex">
					{["desktop", "mobile"].map((key) => (
						<Tooltips key={key}>
							<TooltipTrigger asChild>
								<button
									data-active={activeChart === key}
									className={`cursor-pointer data-[active=true]:bg-primary data-[active=true]:text-background relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 ${
										key === "mobile" && activeChart === "mobile"
											? "rounded-none sm:rounded-tr-xl"
											: ""
									}`}
									onClick={() => setActiveChart(key)}
									disabled={loading}
								>
									<span className="text-xs">{chartConfig[key].label}</span>
									<span className="text-lg leading-none font-bold sm:text-3xl flex h-5 md:h-7 lg:h-8">
										{total[key].toLocaleString()}
									</span>
								</button>
							</TooltipTrigger>
							<TooltipContent side="top" className="max-w-xs break-words">
								<p className="text-sm">
									{key === "desktop"
										? "Total visits from Desktop devices"
										: "Total visits from Mobile devices"}
								</p>
							</TooltipContent>
						</Tooltips>
					))}
				</div>
			</CardHeader>

			<CardContent className="px-2">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[440px] w-full"
				>
					<BarChart
						accessibilityLayer
						data={chartData}
						margin={{ left: 12, right: 12 }}
					>
						<CartesianGrid vertical={true} />
						<XAxis
							dataKey="info"
							tickLine={true}
							axisLine={true}
							tickMargin={8}
							minTickGap={1}
						/>
						<ChartTooltip
							content={(props) => (
								<ChartTooltipContent
									{...props}
									labelFormatter={(label) => {
										if (label === "T") return "TOTAL";
										if (label === "H") return "HUMANS";
										if (label === "D") return "DATACENTERS";
										if (label === "B") return "BOT";
										if (label === "BL") return "BLACKLISTED";
										if (label === "WL") return "WHITELISTED";
										if (label === "BLC") return "BLOCKED";
										return label;
									}}
								/>
							)}
						/>
						<Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
