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
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased flex h-screen overflow-hidden">
        <Providers>
          {/* We will add Sidebar here later */}
          <main className="flex-1 h-full overflow-y-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}