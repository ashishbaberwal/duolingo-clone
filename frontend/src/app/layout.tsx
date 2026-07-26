import "@fontsource-variable/nunito";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "LingoTrail — Make progress feel like play",
  description:
    "A playful, path-based language-learning experience built for daily momentum.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
