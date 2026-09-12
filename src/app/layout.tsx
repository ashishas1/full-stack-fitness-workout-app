import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
});

export const metadata: Metadata = {
  title: "SIXFORGE — Forge Your Six-Pack",
  description:
    "The six-pack operating system: pro exercise guides, structured ab programs, a live workout timer, smart suggestions and real progress tracking.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${anton.variable} ${inter.variable} ${jbMono.variable} noise bg-ink font-body text-paper antialiased`}
      >
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#16181b",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f4f6f0",
            },
          }}
        />
      </body>
    </html>
  );
}
