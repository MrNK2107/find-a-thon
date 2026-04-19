import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Find-a-thon Workspace",
  description: "Discover, save, track, and build hackathon journeys",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const key = 'findathon-theme'; const stored = localStorage.getItem(key); const theme = stored === 'light' || stored === 'dark' ? stored : 'dark'; const root = document.documentElement; root.classList.toggle('dark', theme === 'dark'); root.style.colorScheme = theme; } catch (e) {} })();`,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}