import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FireGuard IoT",
    template: "%s · FireGuard IoT",
  },
  description:
    "Premium fire alarm monitoring and control platform for industrial IoT systems.",
  applicationName: "FireGuard IoT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrains.variable} font-sans`}>
        <AppProviders>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "rounded-2xl border border-border/80 shadow-elevated",
            }}
          />
        </AppProviders>
      </body>
    </html>
  );
}
