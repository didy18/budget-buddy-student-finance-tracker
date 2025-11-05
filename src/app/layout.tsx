import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { FinanceProvider } from "@/context/FinanceContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { AppWrapper } from "@/components/AppWrapper";

export const metadata: Metadata = {
  title: "Budget Buddy - Student Finance Tracker",
  description: "Personal finance tracker for university students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ErrorReporter />
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        <ThemeProvider>
          <FinanceProvider>
            <AppWrapper>
              {children}
            </AppWrapper>
          </FinanceProvider>
        </ThemeProvider>
        <Toaster richColors position="top-center" />
        <VisualEditsMessenger />
      </body>
    </html>
  );
}