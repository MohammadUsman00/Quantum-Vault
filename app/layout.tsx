import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quantum Vault — Post-Quantum Solana Protection",
  description:
    "Protect your Solana wallet from quantum computer attacks using NIST-approved CRYSTALS-Dilithium (ML-DSA-65) post-quantum cryptography. Hackathon demo on devnet.",
  keywords: [
    "Solana",
    "post-quantum",
    "wallet protection",
    "CRYSTALS-Dilithium",
    "ML-DSA",
    "quantum vault",
    "blockchain security",
  ],
  openGraph: {
    title: "Quantum Vault — Post-Quantum Solana Protection",
    description:
      "Protect your Solana wallet from quantum computer attacks using NIST-approved CRYSTALS-Dilithium post-quantum cryptography.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#020817] text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
