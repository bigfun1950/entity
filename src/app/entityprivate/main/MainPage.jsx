"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import CheckingSection from "./checkingSection";
import ResultsSection from "./resultSection";
import InfoSection from "./infoSection";
import ApiKeyModal from "./apikeyModal";
import ControlSection from "./controlSection";

export default function HomePage() {
	const [emails, setEmails] = useState([]);
	const [results, setResults] = useState([]);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [running, setRunning] = useState(false);
	const [processedCount, setProcessedCount] = useState(0);
	const [showDenied, setShowDenied] = useState(false);
	const [fileName, setFileName] = useState("");
	const [paused, setPaused] = useState(false);
	const [concurrency] = useState(18);
	const [stopping, setStopping] = useState(false);
	const [apiKey, setApiKey] = useState("");
	const [showApiKeyModal, setShowApiKeyModal] = useState(false);
	const [apiKeyError, setApiKeyError] = useState("");
	const [musicPlaying, setMusicPlaying] = useState(false);
	const audioRef = useRef(null);

	const stopFlag = useRef(false);

	const handleFileUpload = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		setFileName(file.name);

		const chunkSize = 1024 * 1024;
		const chunks = Math.ceil(file.size / chunkSize);
		let text = "";

		for (let i = 0; i < chunks; i++) {
			const slice = file.slice(i * chunkSize, (i + 1) * chunkSize);
			text += await slice.text();
			setUploadProgress(Math.round(((i + 1) / chunks) * 100));
			await new Promise((r) => setTimeout(r, 0));
		}

		const list = text
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter(Boolean);
		setEmails(list);
		setUploadProgress(0);
		setResults([]);
		setProcessedCount(0);
		stopFlag.current = false;

		new Audio("/beep.mp3").play().catch(() => {});
		setPaused(false);
	};

	const validateEmail = async (email) => {
		if (stopFlag.current) return null;

		setResults((prev) => [
			...prev,
			{ email, status: "Checking...", mx: "", loading: true },
		]);

		const maxRetries = 5;
		let attempts = 0;
		const delay = (ms) => new Promise((res) => setTimeout(res, ms));

		while (attempts < maxRetries) {
			try {
				const res = await fetch("/api/entityPriv", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, apiKey }),
				});

				const data = await res.json();

				if (data.status === "Limit exceeded") {
					stopFlag.current = true;
					return {
						email,
						status: "Limit exceeded",
						mx: "N/A",
						loading: false,
						limitExceeded: true,
					};
				}

				const status = data.status || "Unknown";

				if (status !== "rejected") {
					return {
						email,
						status,
						mx: data.mx || "N/A",
						loading: false,
					};
				}

				attempts++;
				if (attempts >= maxRetries) {
					return {
						email,
						status,
						mx: data.mx || "N/A",
						loading: false,
					};
				}

				await delay(15000);
			} catch {
				return {
					email,
					status: "Unknown",
					mx: "N/A",
					loading: false,
				};
			}
		}

		return {
			email,
			status: "Unknown",
			mx: "N/A",
			loading: false,
		};
	};

	const validateApiKey = async () => {
		try {
			const res = await fetch("/api/entitykey", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ key: apiKey }),
			});
			const data = await res.json();
			return data;
		} catch (err) {
			console.error("API key validation failed", err);
			return { valid: false, message: "Server error" };
		}
	};

	const startValidation = async () => {
		if (!apiKey) {
			setShowApiKeyModal(true);
			setApiKeyError("API key is required");
			return;
		}

		const validationResponse = await validateApiKey();

		if (!validationResponse.valid) {
			setShowApiKeyModal(true);
			setApiKeyError(validationResponse.message || "Invalid API key");
			return;
		}

		if (emails.length === 0) {
			setShowDenied(true);
			setTimeout(() => setShowDenied(false), 1000);
			return;
		}

		setRunning(true);
		stopFlag.current = false;
		setResults((prev) => (paused ? prev : []));
		setProcessedCount((prev) => (paused ? prev : 0));

		let index = paused ? processedCount : 0;
		setPaused(false);

		while (index < emails.length && !stopFlag.current) {
			const batch = emails.slice(index, index + concurrency);

			await Promise.all(
				batch.map(async (email) => {
					if (stopFlag.current) return;
					const result = await validateEmail(email);

					if (result) {
						setResults((prev) =>
							prev.map((r) => (r.email === result.email ? result : r))
						);
						setProcessedCount((prev) => prev + 1);

						if (result.limitExceeded) {
							console.warn("API key limit reached. Stopping further checks.");
						}
					}
				})
			);

			if (stopFlag.current) break;

			index += concurrency;

			if (index < emails.length && !stopFlag.current) {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		setRunning(false);
		setStopping(false);
		new Audio("/success.mp3").play().catch(() => {});
	};

	const stopValidation = () => {
		if (!running) return;
		setStopping(true);
		stopFlag.current = true;
		setRunning(false);
		setPaused(true);
	};

	const summary = results.reduce(
		(acc, r) => {
			if (r.status === "Accepted") acc.accepted++;
			else if (r.status === "Rejected") acc.rejected++;
			else acc.unknown++;
			return acc;
		},
		{ accepted: 0, rejected: 0, unknown: 0 }
	);

	const downloadResults = async () => {
		const acceptedEmails = results
			.filter((r) => r.status === "Accepted")
			.map((r) => r.email)
			.join("\n");

		const rejectedEmails = results
			.filter((r) => r.status === "Rejected")
			.map((r) => r.email)
			.join("\n");

		const zip = new JSZip();
		zip.file("accepted.txt", acceptedEmails);
		zip.file("rejected.txt", rejectedEmails);

		const content = await zip.generateAsync({ type: "blob" });
		saveAs(content, "entity_bounce.zip");
	};

	const startNew = () => {
		window.location.href = "https://entitygate.net/entityprivate";
	};

	useEffect(() => {
		audioRef.current = new Audio("/pvz.mp3");
		audioRef.current.loop = true;
		audioRef.current.volume = 0.5;

		audioRef.current
			.play()
			.then(() => setMusicPlaying(true))
			.catch(() => {
				setMusicPlaying(false);
			});
	}, []);

	const toggleMusic = () => {
		if (!audioRef.current) return;

		if (musicPlaying) {
			audioRef.current.pause();
			setMusicPlaying(false);
		} else {
			audioRef.current
				.play()
				.then(() => setMusicPlaying(true))
				.catch(() => {});
		}
	};

	return (
		<>
			<ApiKeyModal
				show={showApiKeyModal}
				apiKey={apiKey}
				setApiKey={setApiKey}
				apiKeyError={apiKeyError}
				setApiKeyError={setApiKeyError}
				onCancel={() => {
					setShowApiKeyModal(false);
					setApiKeyError("");
				}}
				onConfirm={async () => {
					if (!apiKey) {
						setApiKeyError("API key is required");
						return;
					}

					const validationResponse = await validateApiKey();
					if (!validationResponse.valid) {
						setApiKeyError(validationResponse.message || "Invalid API key");
						return;
					}

					setShowApiKeyModal(false);
					setApiKeyError("");
					startValidation();
				}}
			/>
			<main className="min-h-screen flex flex-col items-center p-8 font-mono text-[#00ff6a] bg-black cursor-default">
				<motion.div
					animate={showDenied ? { x: [-5, 5, -5, 5, 0] } : {}}
					transition={{ duration: 0.3 }}
					className="relative w-full max-w-5xl border border-[#00ff6a] p-6 bg-black shadow-[0_0_25px_#00ff6a40] rounded"
				>
					<div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,255,100,0.15)_0px,rgba(0,255,80,0.05)_2px,transparent_3px)] opacity-30" />

					<motion.h1
						animate={{
							opacity: [1, 0.8, 1],
							filter: [
								"drop-shadow(0_0_8px_#00ff6a)",
								"drop-shadow(0_0_15px_#00ff6a)",
							],
						}}
						data-cursor-color="#1D4ED8"
						transition={{ duration: 1.5, repeat: Infinity }}
						className="text-4xl font-bold text-center mb-6 cursor-default"
					>
						<code data-cursor-color="#1D4ED8" className="animate-pulse">
							█▓▒░ ENTITY BOUNCE ░▒▓█
						</code>
					</motion.h1>

					<label className="block mb-4 hover:cursor-pointer w-full">
						<motion.div
							data-cursor-color="#1D4ED8"
							transition={{ duration: 0.15 }}
							className="p-3 w-full border border-[#00ff6a] hover:bg-[#00ff6a] hover:text-black transition text-center uppercase bg-black rounded"
						>
							{fileName ? (
								<motion.span
									key={fileName}
									initial={{ opacity: 0, x: -10 }}
									animate={{ opacity: 1, x: 0 }}
									className="truncate"
								>
									📄{" "}
									<code data-cursor-color="#1D4ED8">
										{fileName} — click to change
									</code>
								</motion.span>
							) : (
								<code data-cursor-color="#1D4ED8">Upload TXT File</code>
							)}
						</motion.div>
						<input
							type="file"
							accept=".txt"
							onChange={handleFileUpload}
							className="hidden"
						/>
					</label>

					{uploadProgress > 0 && (
						<div className="mb-4 w-full">
							<div className="w-full h-2 bg-black border border-[#00ff6a] rounded">
								<div
									style={{ width: `${uploadProgress}%` }}
									className="h-full bg-[#00ff6a] transition-all duration-300 rounded"
								/>
							</div>
							<code className="mt-1 block">{uploadProgress}% LOADED</code>
						</div>
					)}

					<ControlSection
						emails={emails}
						running={running}
						stopping={stopping}
						paused={paused}
						processedCount={processedCount}
						startValidation={startValidation}
						stopValidation={stopValidation}
						startNew={startNew}
						musicPlaying={musicPlaying}
						toggleMusic={toggleMusic}
					/>

					<InfoSection
						emails={emails}
						fileName={fileName}
						running={running}
						paused={paused}
						processedCount={processedCount}
						stopping={stopping}
						summary={summary}
						downloadResults={downloadResults}
					/>

					<div className="flex gap-2">
						<CheckingSection results={results} />
						<ResultsSection results={results} />
					</div>
				</motion.div>
			</main>
		</>
	);
}
