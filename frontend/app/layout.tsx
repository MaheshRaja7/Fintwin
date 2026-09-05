import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "FinTwin AI | AI-Powered Financial Intelligence & Predictive Forecasting Platform",
  description: "Track. Predict. Prevent. Save. Next-generation personal financial digital twin with real-time XGBoost forecasting, overspending prediction, and Gemini AI advisor.",
  keywords: ["FinTwin AI", "personal finance", "predictive analytics", "XGBoost forecasting", "Gemini AI assistant", "budget optimization"],
  authors: [{ name: "FinTwin AI Labs" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-[#030712] text-gray-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
