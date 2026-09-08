import type { Metadata } from "next";
import "./globals.css";
import "./v3.css";

export const metadata: Metadata = {
  title: "Toveli | Find your people",
  description: "Shared interests. Small circles. Real-world plans. A private Toveli alpha.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
