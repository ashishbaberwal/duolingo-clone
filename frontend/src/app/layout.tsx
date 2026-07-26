import "@fontsource-variable/nunito";
import type { Metadata } from "next";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";

const themeInitializationScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("lingotrail-theme");
    const theme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
