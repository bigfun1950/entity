import { SessionOptions } from "iron-session";

export const sessionOptions = {
	password: process.env.ENTITY_SESSION_SECRET || "complex_fallback_secret",
	cookieName: "entity_session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
	},
} satisfies SessionOptions;
