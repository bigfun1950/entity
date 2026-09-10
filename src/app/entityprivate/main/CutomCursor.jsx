"use client";

import { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
	const ringRef = useRef(null);
	const dotRef = useRef(null);

	const pos = useRef({ x: 0, y: 0 });
	const target = useRef({ x: 0, y: 0 });

	const [isPointer, setIsPointer] = useState(false);
	const [rippleKey, setRippleKey] = useState(0);

	useEffect(() => {
		const move = (e) => {
			target.current.x = e.clientX;
			target.current.y = e.clientY;

			const el = document.elementFromPoint(e.clientX, e.clientY);

			const style = el ? getComputedStyle(el).cursor : "default";
			setIsPointer(style === "pointer");

			if (el?.dataset?.cursorColor) {
				ringRef.current.style.borderColor = el.dataset.cursorColor;
				dotRef.current.style.backgroundColor = el.dataset.cursorColor;
			} else {
				ringRef.current.style.borderColor = "#00ff88";
				dotRef.current.style.backgroundColor = "#00ff88";
			}

			if (el?.dataset?.magnet) {
				const rect = el.getBoundingClientRect();
				target.current.x = rect.left + rect.width / 2;
				target.current.y = rect.top + rect.height / 2;
			}
		};

		window.addEventListener("mousemove", move);
		return () => window.removeEventListener("mousemove", move);
	}, []);

	useEffect(() => {
		const clickEffect = () => {
			setRippleKey((k) => k + 1);
			ringRef.current.classList.add("cursor-click");
			setTimeout(() => {
				ringRef.current.classList.remove("cursor-click");
			}, 400);
		};

		window.addEventListener("click", clickEffect);
		return () => window.removeEventListener("click", clickEffect);
	}, []);

	useEffect(() => {
		const follow = () => {
			pos.current.x += (target.current.x - pos.current.x) * 0.18;
			pos.current.y += (target.current.y - pos.current.y) * 0.18;
			ringRef.current.style.left = pos.current.x + "px";
			ringRef.current.style.top = pos.current.y + "px";
			dotRef.current.style.left = target.current.x + "px";
			dotRef.current.style.top = target.current.y + "px";

			requestAnimationFrame(follow);
		};
		follow();
	}, []);

	return (
		<>
			<div
				ref={ringRef}
				key={rippleKey}
				className={`cursor-ring ${isPointer ? "cursor-pointer" : ""}`}
			/>
			<div ref={dotRef} className="cursor-dot" />
		</>
	);
}
