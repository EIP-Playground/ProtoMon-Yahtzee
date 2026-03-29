import type { Metadata } from "next";
import { Orbitron, Press_Start_2P } from "next/font/google";
import localFont from "next/font/local";
import "@rainbow-me/rainbowkit/styles.css";
import "nes.css/css/nes.min.css";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { SmartAccountProvider } from "@/components/providers/SmartAccountProvider";
import { AssetPreloader } from "@/components/loading/AssetPreloader";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-orbitron",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start-2p",
});

const zpix = localFont({
  src: "./fonts/zpix.ttf",
  display: "swap",
  variable: "--font-zpix",
});

export const metadata: Metadata = {
  title: "ProtoMon",
  description:
    "ProtoMon is a reactive onchain roguelite dice battler with instant-feeling turns and automatic cross-chain rewards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-locale="zh-CN">
      <body className={`${orbitron.variable} ${pressStart.variable} ${zpix.variable}`}>
        <AssetPreloader />
        <PostHogProvider>
          <LocaleProvider>
            <SmartAccountProvider>{children}</SmartAccountProvider>
          </LocaleProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
