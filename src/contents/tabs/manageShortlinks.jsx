"use client";
import { useEffect, useState } from "react";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import EntityManageShortlinksContent from "@/components/ui/entityManageShortlinksContent";
import { ManageShortlinkSkeleton } from "@/components/ui/entitySkeleton";
import { useRouter } from "next/navigation";
import { EntityManageShortlinks } from "@/components/title/EntityTitle";

export default function ManageShortlinksTab({ user }) {
	const [shortlinks, setShortlinks] = useState([]);
	const [loading, setLoading] = useState(true);
	const [editOpen, setEditOpen] = useState(false);
	const [editData, setEditData] = useState(null);
	const [message, setMessage] = useState("");
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteData, setDeleteData] = useState(null);
	const [skeletonCount, setSkeletonCount] = useState(4);
	const router = useRouter();
	const Goto = (path) => router.push(path);

	const GotoShortlinkCreation = () => {
		Goto("/dashboard?tab=create_shortlink");
	};

	const fetchShortlinks = () => {
		if (!user) return;
		setLoading(true);
		fetch(`/api/shortlinks/list?owner=${encodeURIComponent(user)}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.shortlinks) {
					setSkeletonCount(data.shortlinks.length || 4);
				}
				setTimeout(() => {
					setShortlinks(data.shortlinks || []);
					setLoading(false);
				}, 1000);
			})
			.catch(() => setLoading(false));
	};

	useEffect(() => {
		fetchShortlinks();
	}, [user]);

	const [autoUpdating, setAutoUpdating] = useState(false);

	useEffect(() => {
		if (!user) return;

		const fetchAutoCheck = () => {
			setAutoUpdating(true);

			fetch("/api/shortlinks/check/auto", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ owner: user }),
			})
				.then((res) => res.json())
				.then((data) => {
					if (data.shortlinks) setShortlinks(data.shortlinks);
				})
				.finally(() => setAutoUpdating(false));
		};

		fetchAutoCheck();

		const interval = setInterval(fetchAutoCheck, 2 * 60 * 1000);

		return () => clearInterval(interval);
	}, [user]);

	return (
		<div className="p-4">
			<div className={"mb-10 -mt-2"}>
				<EntityManageShortlinks className="w-42 h-5 sm:h-7" />
			</div>
			{loading ? (
				<ManageShortlinkSkeleton count={skeletonCount} />
			) : shortlinks.length === 0 ? (
				<div className="flex flex-col gap-1 items-center justify-center text-center min-h-[70vh]">
					<p className={"ml-7 sm:ml-13 sm:text-base text-sm"}>
						Create your first shorlink{" "}
						<span
							onClick={GotoShortlinkCreation}
							className="cursor-pointer relative font-bold text-blue-700 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[1.5px] after:bg-red-800 after:transition-all after:duration-300 hover:after:w-full"
						>
							Here
						</span>
					</p>
				</div>
			) : (
				<div className="grid gap-4">
					{shortlinks.map((link) => (
						<div
							key={link.shortlinkKey}
							className="rounded-2xl border bg-card shadow-md p-4"
						>
							<div className="flex flex-col mb-5 border-b border-neutral-900/20 pb-4">
								<h1 className="truncate overflow-hidden whitespace-nowrap max-w-[250px] sm:max-w-xl inline-block">
									Main URL :{" "}
									<span
										className={`font-semibold ${
											link.firstUrlStatus === "live"
												? "text-green-700"
												: link.firstUrlStatus === "rf"
												? "text-red-700"
												: link.firstUrlStatus === "dead"
												? "text-yellow-700"
												: ""
										}`}
									>
										{link.firstUrl}
									</span>
								</h1>
								<h1 className=" truncate overflow-hidden whitespace-nowrap max-w-[250px] sm:max-w-xl inline-block">
									Backup URL :{" "}
									<span
										className={`${
											link.secondUrl === ""
												? "text-red-800 font-semibold"
												: "text-green-700 font-semibold"
										} ${
											link.secondUrlStatus === "live"
												? "text-green-700"
												: link.secondUrlStatus === "rf"
												? "text-red-700"
												: link.secondUrlStatus === "dead"
												? "text-yellow-700"
												: ""
										}`}
									>
										{link.secondUrl === "" ? "NOT SET" : link.secondUrl}
									</span>
								</h1>
								<h1 className=" truncate overflow-hidden whitespace-nowrap max-w-[250px] sm:max-w-xl inline-block">
									Active URL :{" "}
									<span
										className={`${
											link.activeUrl === "need update"
												? "text-red-700 font-semibold uppercase"
												: "text-blue-700 font-semibold"
										}`}
									>
										{link.activeUrl === "" ? "NOT SET" : link.activeUrl}
									</span>
								</h1>
							</div>

							<div className="grid grid-cols-1 lg:grid-cols-6 gap-2 text-sm">
								<div>
									<p className="text-xs uppercase font-semibold">Created at</p>
									<p className="text-green-700 font-semibold mt-0 md:mt-1">
										{link.createdAt
											? new Date(link.createdAt).toLocaleString()
											: "-"}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase font-semibold">Updated at</p>
									<p
										className={`mt-0 md:mt-1 ${
											link.updatedAt
												? "text-blue-700 font-semibold"
												: "text-red-700 font-semibold"
										}`}
									>
										{link.updatedAt
											? new Date(link.updatedAt).toLocaleString()
											: "-"}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase font-semibold">
										Shortlink Key
									</p>
									<p className="text-purple-600 font-semibold mt-0 md:mt-1">
										{link.shortlinkKey}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase font-semibold">
										Main URL Status
									</p>
									<p
										className={`px-2 w-max mt-1 rounded bg-white dark:bg-black/30 ${
											link.firstUrlStatus === "live"
												? "text-green-700 ring-1"
												: link.firstUrlStatus === "rf"
												? "text-red-700 ring-1"
												: link.firstUrlStatus === "dead"
												? "text-yellow-700 ring-1"
												: ""
										} font-semibold flex items-center gap-1`}
									>
										{autoUpdating ? (
											<EntityButtonLoading
												className={"fill-black dark:fill-white w-4 h-5"}
											/>
										) : (
											link.firstUrlStatus?.toUpperCase() ?? "NOT SET"
										)}
									</p>
								</div>
								<div>
									<p className="text-xs uppercase font-semibold">
										Backup URL Status
									</p>
									<p
										className={`px-2 w-max mt-1 rounded bg-white dark:bg-black/30 ${
											link.secondUrlStatus === "live"
												? "text-green-700 ring-1"
												: link.secondUrlStatus === "rf"
												? "text-red-700 ring-1"
												: link.secondUrlStatus === "dead"
												? "text-yellow-700 ring-1"
												: ""
										} font-semibold flex items-center gap-1`}
									>
										{autoUpdating ? (
											<EntityButtonLoading
												className={"fill-black dark:fill-white w-4 h-5"}
											/>
										) : (
											link.secondUrlStatus?.toUpperCase() ?? <span className="text-red-700 font-semibold">NOT SET</span>
										)}
									</p>
								</div>

								<EntityManageShortlinksContent
									editOpen={editOpen}
									setEditOpen={setEditOpen}
									editData={editData}
									setEditData={setEditData}
									deleteData={deleteData}
									setDeleteData={setDeleteData}
									deleteOpen={deleteOpen}
									setDeleteOpen={setDeleteOpen}
									link={link}
									loading={loading}
									setLoading={setLoading}
									user={user}
									fetchShortlinks={fetchShortlinks}
									message={message}
									setMessage={setMessage}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
