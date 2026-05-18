import type { Metadata } from "next";
import { Libre_Baskerville, Lora, IBM_Plex_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Resume Tailor — AI-Powered ATS Optimization",
  description:
    "Tailor your resume to any job description using Gemini AI. Upload your PDF, paste the JD, review AI suggestions with side-by-side diffs, and export an ATS-optimized resume.",
  keywords: [
    "resume",
    "ATS",
    "AI",
    "job application",
    "resume tailor",
    "Gemini",
  ],
  openGraph: {
    title: "Resume Tailor — AI-Powered ATS Optimization",
    description:
      "Tailor your resume to any job description using Gemini AI.",
    type: "website",
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
      className={`${libreBaskerville.variable} ${lora.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
