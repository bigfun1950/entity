import { Button } from "@/components/ui/button";
import {
	AllowedDeviceSelect,
	AllowedCountrySelect,
	BotRedirectionSelect,
} from "@/components/ui/entityShortlinkSelector";
import { FloatingInput } from "@/components/ui/floatingInput";
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogFooter,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
	CheckIcon,
	ChevronLeft,
	CogIcon,
	InfoIcon,
	TrashIcon,
} from "lucide-react";
import {
	Tooltips,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import EntityButtonLoading from "@/components/ui/entityButtonLoading";
import { useState } from "react";

export default function EntityManageShortlinksContent({
	editOpen,
	setEditOpen,
	editData,
	setEditData,
	deleteData,
	setDeleteData,
	deleteOpen,
	setDeleteOpen,
	user,
	link,
	setLoading,
	fetchShortlinks,
	setMessage,
}) {
	const [checking, setChecking] = useState();
	const handleDelete = (link) => {
		setDeleteData({ ...link });
		setDeleteOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteData) return;

		await toast.promise(
			(async () => {
				const res = await fetch("/api/shortlinks/delete", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						shortlinkKey: deleteData.shortlinkKey,
						owner: user,
					}),
				});

				const data = await res.json();

				if (res.ok) {
					const msg = `${data.message}`;
					setDeleteOpen(false);
					setDeleteData(null);
					fetchShortlinks();
					return msg;
				} else {
					const msg = `${data.message || "Failed to delete shortlink"}`;
					throw new Error(msg);
				}
			})(),
			{
				loading: "Deleting Shortlink...",
				success: (message) => message,
				error: (err) => err.message || "Error",
			}
		);
	};

	const handleEdit = (link) => {
		setEditData({ ...link });
		setEditOpen(true);
	};

	const handleEditChange = (field, value) => {
		setEditData((prev) => ({ ...prev, [field]: value }));
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setMessage("");
		if (!editData) return;

		await toast.promise(
			(async () => {
				const payload = {
					...editData,
					owner: user,
					originalShortlinkKey: link.shortlinkKey,
				};

				const res = await fetch("/api/shortlinks/manage", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				const data = await res.json();
				setLoading(false);

				if (res.ok) {
					const msg = `${data.message}`;
					setEditOpen(false);
					setEditData(null);
					fetchShortlinks();
					return msg;
				} else {
					const msg = `${data.message || "Error"}`;
					setMessage(msg);
					throw new Error(msg);
				}
			})(),
			{
				loading: "Updating Shortlink...",
				success: (message) => message,
				error: (err) => err.message || "Error",
			}
		);
	};

	const handleCheckUrl = async (link) => {
		setChecking(true);
		await toast.promise(
			(async () => {
				const res = await fetch("/api/shortlinks/check", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						shortlinkKey: link.shortlinkKey,
						owner: user,
					}),
				});

				const data = await res.json();
				setChecking(false);
				if (!res.ok) {
					throw new Error(data.message || "Failed to check URLs");
				}

				fetchShortlinks();

				const showStatusToast = (label, status) => {
					switch (status) {
						case "live":
							toast.success(`${label} is LIVE!`);
							break;
						case "dead":
							toast.warning(`${label} is DEAD!`);
							break;
						case "rf":
							toast.error(`${label} is RF!`);
							break;
						default:
							toast.error(`NOT SET`);
					}
				};

				showStatusToast(data.firstUrl, data.firstUrlStatus);
				showStatusToast(data.secondUrl, data.secondUrlStatus);

				if (data.activeUrl === "need update") {
					toast.warning("NEED UPDATE!");
				} else if (data.activeUrl) {
					toast.info(`Active URL → ${data.activeUrl}`);
				} else {
					toast.warning("NEED UPDATE!");
				}
			})(),
			{
				loading: "Checking URLs...",
				success: () => "URLs checked!",
				error: (err) => err.message || "Error",
			}
		);
	};

	return (
		<div className="flex items-center lg:justify-end gap-2 mt-5 lg:mt-0">
			<AlertDialog
				open={editOpen && editData?._id === link._id}
				onOpenChange={setEditOpen}
			>
				<AlertDialogTrigger asChild>
					<Tooltips>
						<TooltipTrigger asChild>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleEdit(link)}
								className={"border-neutral-900/30 cursor-pointer"}
							>
								<CogIcon className="h-4 w-4 text-yellow-600" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Edit Shortlink</p>
						</TooltipContent>
					</Tooltips>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogDescription></AlertDialogDescription>
					<AlertDialogHeader>
						<AlertDialogTitle>Edit Shortlink</AlertDialogTitle>
					</AlertDialogHeader>
					{editData && (
						<form onSubmit={handleEditSubmit} className="space-y-2 mt-2">
							<FloatingInput
								id="edit-main-url"
								label="Main URL"
								type="url"
								value={editData.firstUrl || ""}
								onChange={(e) => handleEditChange("firstUrl", e.target.value)}
								required
							/>
							<FloatingInput
								id="edit-backup-url"
								label="Backup URL"
								type="url"
								value={editData.secondUrl || ""}
								onChange={(e) => handleEditChange("secondUrl", e.target.value)}
							/>
							<FloatingInput
								id="edit-shortlinkkey"
								label="Shortlink Key"
								type="text"
								value={editData.shortlinkKey || ""}
								onChange={(e) =>
									handleEditChange("shortlinkKey", e.target.value)
								}
								required
							/>
							<AllowedDeviceSelect
								value={editData.allowedDevice || "both"}
								onChange={(value) => handleEditChange("allowedDevice", value)}
							/>
							<AllowedCountrySelect
								value={editData.allowedCountry || "all"}
								onChange={(value) => handleEditChange("allowedCountry", value)}
							/>
							<BotRedirectionSelect
								value={editData.botRedirection || "404"}
								onChange={(value) => handleEditChange("botRedirection", value)}
							/>
							<AlertDialogFooter>
								<AlertDialogCancel
									className={"border-neutral-900/30 cursor-pointer"}
								>
									<ChevronLeft />
								</AlertDialogCancel>
								<AlertDialogAction asChild>
									<Tooltips>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												className={"border-neutral-900/30 cursor-pointer"}
											>
												<CheckIcon className="h-4 w-4 text-green-700" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Update Shortlink</p>
										</TooltipContent>
									</Tooltips>
								</AlertDialogAction>
							</AlertDialogFooter>
						</form>
					)}
				</AlertDialogContent>
			</AlertDialog>
			<Tooltips>
				<TooltipTrigger asChild>
					<Button
						size="sm"
						variant="outline"
						onClick={() => handleCheckUrl(link)}
						className={"border-neutral-900/30 cursor-pointer"}
					>
						{checking ? (
							<EntityButtonLoading
								className={"fill-black dark:fill-white w-5 h-5"}
							/>
						) : (
							<InfoIcon className="h-4 w-4 text-blue-700" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Check URL</p>
				</TooltipContent>
			</Tooltips>
			<AlertDialog
				open={deleteOpen && deleteData?._id === link._id}
				onOpenChange={setDeleteOpen}
			>
				<AlertDialogTrigger asChild>
					<Tooltips>
						<TooltipTrigger asChild>
							<Button
								size="sm"
								variant="outline"
								onClick={() => handleDelete(link)}
								className={"border-neutral-900/30 cursor-pointer"}
							>
								<TrashIcon className="h-4 w-4 text-red-700" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Delete Shortlink</p>
						</TooltipContent>
					</Tooltips>
				</AlertDialogTrigger>
				<AlertDialogContent>
					<AlertDialogDescription></AlertDialogDescription>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<Tooltips>
								<div className="flex w-full gap-2">
									<TooltipTrigger asChild>
										<p className="truncate max-w-[225px] sm:max-w-sm">
											Delete{" "}
											<span className="text-blue-700">{link.activeUrl}</span>
										</p>
									</TooltipTrigger>
									<p>?</p>
								</div>
								<TooltipContent>
									<p>{link.activeUrl}</p>
								</TooltipContent>
							</Tooltips>
						</AlertDialogTitle>
					</AlertDialogHeader>
					<div>
						This will delete the shortlink and all related visitor logs and This
						action cannot be undone. Are you sure you want to delete this
						shortlink?
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel
							className={"border-neutral-900/30 cursor-pointer"}
						>
							<ChevronLeft />
						</AlertDialogCancel>
						<AlertDialogAction asChild>
							<Tooltips>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="outline"
										onClick={handleDeleteConfirm}
										className={"border-neutral-900/30 cursor-pointer"}
									>
										<TrashIcon className="h-4 w-4 text-red-700" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Delete Shortlink</p>
								</TooltipContent>
							</Tooltips>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
