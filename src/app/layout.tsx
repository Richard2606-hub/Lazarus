import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Lazarus | Research intelligence",
    template: "%s | Lazarus",
  },
  description:
    "A bounded prototype for discovering scientific failures, cross-domain methods, and confidence-routed review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
