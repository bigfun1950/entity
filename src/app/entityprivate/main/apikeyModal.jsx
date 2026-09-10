"use client";

export default function ApiKeyModal({
	show,
	apiKey,
	setApiKey,
	apiKeyError,
	setApiKeyError,
	onCancel,
	onConfirm,
}) {
	if (!show) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 cursor-default">
			<div className="bg-black border border-[#00ff6a] p-6 rounded max-w-sm w-full">
				<h2 className="text-green-400 text-lg mb-2">Enter API Key</h2>

				{apiKeyError && (
					<p className="text-red-500 text-sm mb-2">{apiKeyError}</p>
				)}

				<input
					type="password"
					value={apiKey}
					data-cursor-color="#1D4ED8"
					onChange={(e) => setApiKey(e.target.value)}
					className="w-full p-2 mb-4 border border-[#00ff6a] bg-black text-[#00ff6a] rounded hover:cursor-pointer"
					placeholder="Your API Key"
				/>

				<div className="flex justify-end gap-2">
					<button
						onClick={onCancel}
						data-cursor-color="#1D4ED8"
						className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-black transition hover:cursor-pointer"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						data-cursor-color="#1D4ED8"
						className="px-4 py-2 border border-green-400 text-green-400 rounded hover:bg-green-400 hover:text-black transition hover:cursor-pointer"
					>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}
