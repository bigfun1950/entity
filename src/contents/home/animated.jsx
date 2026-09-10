"use client";

import { Player } from "@lottiefiles/react-lottie-player";

function EntityAnimation({ src, className }) {
	return (
		<div
			className={`absolute inset-0 w-full h-full pointer-events-none -z-10 mt-45 sm:mt-0 ${className}`}
		>
			<Player
				autoplay
				loop
				src={src}
				className="sm:w-160 sm:h-160 object-cover"
			/>
		</div>
	);
}

function LoadingAnimation({ src }) {
	return (
		<Player
			autoplay
			loop
			src={src}
			className="w-62 h-62 object-cover mx-auto"
		/>
	);
}

export { EntityAnimation, LoadingAnimation };
