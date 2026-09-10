import { Assistant } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner"
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next"

const assistant = Assistant({
    variable: "--font-assistant-sans",
    subsets: ["latin"],
});

export const metadata = {
    title: "Entity | Bot Protection and Traffic Security",
    description:
        "Entity provides reliable bot protection and fraud prevention. It validates headers, IPs, ASN, geo, and devices to block scrapers, fake clicks, and unwanted traffic in real time.",
    keywords: [
        "Entity",
        "Bot Protection",
        "Fraud Prevention",
        "Traffic Security",
        "Header Validation",
        "IP Blocking",
        "ASN Filtering",
        "CIDR Protection",
        "Geo Restriction",
        "Device Check",
    ],
    verification: {
        google: "bXhma-WIKiwPSnS74kUrcX9NkrtHa4pWi25Jn6OWHzI",
    },
    authors: [{ name: "Entity Security Team", url: "https://entitygate.com" }],
    creator: "Entity Security",
    publisher: "Entity",
    metadataBase: new URL("https://entitygate.com"),
    openGraph: {
        title: "Entity | Professional Bot Protection",
        description:
            "Secure your applications and links with Entity. Professional-grade protection against bots, scrapers, fake clicks, and invalid traffic.",
        url: "https://entitygate.com",
        siteName: "Entity",
        images: [
            {
                url: "https://entitygate.com/entity.png",
                width: 1200,
                height: 630,
                alt: "Entity Security",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Entity | Secure Bot and Fraud Defense",
        description:
            "Entity delivers security-grade bot blocking and traffic validation. Protect against bots, scrapers, and fraudulent requests in real time.",
        images: ["https://entitygate.com/entity.png"],
        creator: "@entitysecurity",
    },
    icons: {
        icon: [
            { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon.svg", type: "image/svg+xml" },
            { rel: "apple-touch-icon", url: "/apple-touch-icon.png", sizes: "180x180" },
        ],
    },
    manifest: "/site.webmanifest",
    category: "security",
};

export default function RootLayout({ children }) {
    return (
        <html data-scroll-behavior="smooth" className={assistant.variable} lang="en">
            <body
                className={`antialiased`}
            >
                {children}
                <Script
                    src="https://app.midtrans.com/snap/snap.js"
                    data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                    strategy="afterInteractive"
                />
                <SpeedInsights />
                <Toaster richColors position="top-right" />
            </body>
        </html>
    );
}
