import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FantasyMaster",
    template: "%s | FantasyMaster",
  },
  description:
    "A self-hosted control plane for managing multiple NFL fantasy football leagues.",
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
