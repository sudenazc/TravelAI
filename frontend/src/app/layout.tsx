import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/auth-context";
import "@/styles/globals.css";

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const fontBody = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Travel AI — Plan Your Perfect Trip",
    template: "%s | Travel AI",
  },
  description:
    "AI-powered travel planning. Discover destinations, build itineraries and book flights — all in one place.",
  keywords: ["travel", "AI", "trip planner", "itinerary", "flights", "hotels"],
  authors: [{ name: "Travel AI" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Travel AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#bfdbfe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}
    >
      <body className="font-body antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
