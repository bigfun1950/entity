import React, { useState } from "react";
import { Input } from "@/components/ui/input";

export function FloatingInput({
	id,
	label,
	value,
	onChange,
	type = "text",
	required = false,
	...props
}) {
	const [internalValue, setInternalValue] = useState("");

	const inputValue = value !== undefined ? value : internalValue;

	const handleChange = (e) => {
		setInternalValue(e.target.value);
		onChange?.(e);
	};

	const autoComplete =
		type === "password" ? "new-password" : props.autoComplete ?? "off";

	return (
		<div className="relative">
			<Input
				id={id}
				type={type}
				value={inputValue}
				onChange={handleChange}
				required={required}
				autoComplete={autoComplete}
				placeholder=" "
				className="peer border bg-white border-neutral-500 rounded px-3 pt-5 pb-2 h-12 placeholder-transparent focus:outline-none focus:border-blue-600 text-green-700 font-semibold caret-black dark:caret-white truncate focus-visible:border-0 focus-visible:ring-neutral-500"
				{...props}
			/>
			<label
				htmlFor={id}
				className={
					"absolute text-sm left-2 top-1/2 -translate-y-1/2 dark:text-white/50 text-black/70 px-1 transition-all duration-200 pointer-events-none " +
					"peer-focus:top-3 peer-focus:text-xs peer-focus:font-normal p-2 mb-2 " +
					(inputValue ? "top-3 text-xs font-normal" : "font-semibold")
				}
			>
				{label}
			</label>
		</div>
	);
}
