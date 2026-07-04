import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { Providers } from "@/components/providers";
import { CustomCursor } from "@/components/ui/CustomCursor";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kamlesh Paints & Hardware — Authorised Birla Opus Dealer, Pune",
  description:
    "Premium Birla Opus paints, waterproofing solutions, and painting tools — stocked and delivered across all of Pune. Free site surveys, colour consultation, and online ordering.",
  keywords: [
    "Birla Opus dealer Pune",
    "paint shop Shivajinagar",
    "Kamlesh Paints",
    "waterproofing Pune",
    "Birla Opus paints",
  ],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${dmSans.variable} font-sans`}>
        <Providers>
          <Navbar />
          {children}
          <Footer />
          <WhatsAppButton />
          <CustomCursor />
        </Providers>
      </body>
    </html>
  );
}
