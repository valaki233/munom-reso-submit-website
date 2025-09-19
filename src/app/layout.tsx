import "@/styles/globals.css";
import type { Metadata } from "next";
import BrandPanel from "@/components/BrandPanel";

export const metadata: Metadata = {
  title: "MunoM Submissions",
  description: "Submit Resolutions and Amendments for MunoM",
  icons: {
    icon: "/favicon.png",
    apple: "/icon.png",
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="brand-badge" aria-hidden>
          <BrandPanel/>
        </div>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
