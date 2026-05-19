import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Laboremus - Premium Collaborative Editorial Platform",
  description: "A secure, robust collaborative editorial workspace with multi-role workflows, automated formatting reviews, AI recommendations, and pub/sub notifications.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Laboremus",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <meta name="theme-color" content="#09090b" />
        <link rel="apple-touch-icon" href="/window.svg" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
