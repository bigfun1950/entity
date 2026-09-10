import dynamic from "next/dynamic";

export const EntityAnimation = dynamic(
	() => import("./animated").then((mod) => mod.EntityAnimation),
	{ ssr: false }
);

export const LoadingAnimation = dynamic(
	() => import("./animated").then((mod) => mod.LoadingAnimation),
	{ ssr: false }
);
