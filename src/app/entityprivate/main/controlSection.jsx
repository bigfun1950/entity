"use client";

export default function ControlSection({
	emails,
	running,
	stopping,
	paused,
	processedCount,
	startValidation,
	stopValidation,
	startNew,
	musicPlaying,
	toggleMusic,
}) {
	const createButton = (onClick, isDisabled, text, borderColor, hoverColor) => {
		const cursorAttr = !isDisabled ? { "data-cursor-color": "#1D4ED8" } : {};
		return (
			<button
				onClick={onClick}
				disabled={isDisabled}
				{...cursorAttr}
				className={`px-4 py-2 bg-black border ${borderColor} text-${borderColor.slice(
					7
				)} hover:${hoverColor} hover:text-black transition rounded
        ${
					isDisabled
						? "opacity-30 cursor-not-allowed"
						: "enabled:hover:cursor-pointer"
				}`}
			>
				<code data-cursor-color="#1D4ED8">{text}</code>
			</button>
		);
	};

	// Determine button states
	const startDisabled =
		emails.length === 0 ||
		running ||
		stopping ||
		processedCount === emails.length;
	const pauseDisabled = !running || processedCount === emails.length;
	const newDisabled = processedCount !== emails.length || emails.length === 0;

	return (
		<div className="flex mb-4 flex-wrap justify-between">
			<div className="flex gap-2">
				{createButton(
					startValidation,
					startDisabled,
					paused && processedCount !== emails.length ? "CONTINUE" : "▶ START",
					"border-[#00ff6a]",
					"bg-[#00ff6a]"
				)}

				{createButton(
					stopValidation,
					pauseDisabled,
					"■ PAUSE",
					"border-amber-500",
					"bg-red-500"
				)}

				{createButton(
					startNew,
					newDisabled,
					"START NEW CHECK",
					"border-red-500",
					"bg-red-500"
				)}
			</div>

			<button
				onClick={toggleMusic}
				data-cursor-color="#1D4ED8"
				className="px-4 py-2 bg-black border border-blue-400 text-blue-400 
               hover:bg-blue-400 hover:text-black transition rounded hover:cursor-pointer"
			>
				<code data-cursor-color="#1D4ED8">
					{musicPlaying ? "⏸ PAUSE MUSIC" : "▶ PLAY MUSIC"}
				</code>
			</button>
		</div>
	);
}
