"use client";

import { motion, AnimatePresence } from "motion/react";

export default function InfoSection({
	emails,
	fileName,
	running,
	paused,
	processedCount,
	stopping,
	summary,
	downloadResults,
}) {
	return (
		<AnimatePresence mode="popLayout">
			{!running ? (
				<motion.div
					key="idle"
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.25 }}
					className="mb-2 leading-tight"
				>
					{emails.length > 0 ? (
						<>
							<code>
								{">"} {emails.length.toLocaleString()} EMAILS LOADED FROM:{" "}
								{fileName.toUpperCase()}
							</code>

							{paused && (
								<>
									<motion.p
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.2 }}
										className="text-yellow-400"
									>
										<code>
											{">"} PROCESS PAUSED AT {processedCount}/{emails.length}
										</code>
									</motion.p>
									<motion.p
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.3 }}
										className={stopping ? "text-yellow-400" : "text-green-400"}
									>
										<code>
											{stopping
												? "> PROCESS STOPPING..."
												: "> READY TO CONTINUE"}
										</code>
									</motion.p>
								</>
							)}

							{!paused && processedCount === 0 && (
								<motion.p
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.1 }}
								>
									<code>{">"} READY TO START</code>
								</motion.p>
							)}

							{!running && (processedCount > 0 || paused) && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.1 }}
									className={paused ? "text-yellow-400" : "text-green-400"}
								>
									{paused ? (
										<div className="flex justify-between items-center mt-2 flex-wrap gap-2">
											<div>
												<code className="text-green-400">
													{">"} CURRENT ACCEPTED: {summary.accepted}
												</code>{" "}
												-{" "}
												<code className="text-red-800">
													CURRENT REJECTED: {summary.rejected}
												</code>
											</div>
											<button
												data-cursor-color="#1D4ED8"
												onClick={downloadResults}
												className="transition text-blue-700 hover:text-green-400 rounded px-2 py-1 border border-blue-700 hover:border-green-400 enabled:hover:cursor-pointer"
											>
												<code data-cursor-color="#1D4ED8">
													DOWNLOAD CURRENT RESULTS
												</code>
											</button>
										</div>
									) : (
										<div className="flex flex-col gap-2">
											<code>
												{">"} PROCESS COMPLETE — {processedCount} EMAILS
												VALIDATED
											</code>
											<div className="flex justify-between items-center flex-wrap gap-2">
												<div>
													{">"}{" "}
													<code className="text-green-400">
														TOTAL ACCEPTED: {summary.accepted}
													</code>{" "}
													-{" "}
													<code className="text-red-800">
														TOTAL REJECTED: {summary.rejected}
													</code>
												</div>
												<button
													data-cursor-color="#1D4ED8"
													onClick={downloadResults}
													className="transition text-blue-700 hover:text-green-400 rounded px-2 py-1 border border-blue-700 enabled:hover:cursor-pointer"
												>
													<code data-cursor-color="#1D4ED8">
														DOWNLOAD RESULTS
													</code>
												</button>
											</div>
										</div>
									)}
								</motion.div>
							)}
						</>
					) : (
						<code>{">"} NO FILE DETECTED</code>
					)}
				</motion.div>
			) : (
				<motion.p
					key="running"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.25 }}
					className="mb-2 animate-pulse"
				>
					<code>
						{processedCount} / {emails.length} PROCESSING...
					</code>
				</motion.p>
			)}
		</AnimatePresence>
	);
}
