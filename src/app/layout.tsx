import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://predtibo.vercel.app"),
  title: {
    default: "PredTibo - Codex Reset Weather",
    template: "%s | PredTibo",
  },
  description:
    "A fan-made daily public-signal forecast for Codex reset and limit-change speculation. Not official OpenAI data.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "PredTibo - Codex Reset Weather",
    description: "Check today's Codex reset-weather score, receipts, and community calls.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PredTibo - Codex Reset Weather",
    description: "Daily fan forecast for Codex public reset and limit-change signals.",
  },
};

const themeScript = `
  (function () {
    try {
      var theme = window.localStorage.getItem("predtibo.theme") || "dark";
      document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
