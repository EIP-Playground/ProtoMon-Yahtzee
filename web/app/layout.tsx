import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
