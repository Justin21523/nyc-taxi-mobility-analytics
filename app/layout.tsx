import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { FloatingGuide } from "@/components/FloatingGuide";
import { GuideProvider } from "@/components/GuideProvider";
import { LocaleProvider } from "@/lib/client/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "NYC Taxi Mobility Analytics",
  description: "Next.js analytics platform for NYC TLC taxi trip records.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>
          <GuideProvider>
            <AppShell>{children}</AppShell>
            <FloatingGuide />
          </GuideProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
