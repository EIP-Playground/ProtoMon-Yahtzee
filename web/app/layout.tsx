import type { Metadata } from "next";
import { Orbitron, Press_Start_2P } from "next/font/google";
import localFont from "next/font/local";
import "@rainbow-me/rainbowkit/styles.css";
import "nes.css/css/nes.min.css";
import { LocaleProvider } from "@/components/providers/LocaleProvider";
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
  title: "ProtoMon MVP",
  description: "ProtoMon MVP web shell for the hackathon implementation flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-locale="zh-CN">
      <body className={`${orbitron.variable} ${pressStart.variable} ${zpix.variable}`}>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
