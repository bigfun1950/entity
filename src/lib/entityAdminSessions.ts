import { SessionOptions } from "iron-session";

export const adminSessionOptions = {
	password: process.env.ENTITY_SESSION_SECRET || "complex_fallback_secret",
	cookieName: "entity_admin_session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
	},
} satisfies SessionOptions;
