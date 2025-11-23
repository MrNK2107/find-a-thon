import "./globals.css";

export const metadata = {
  title: "FINDATHON",
  description: "Discover upcoming hackathons",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}