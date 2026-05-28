import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "GymOS — Gym Management Platform", template: "%s | GymOS" },
  description: "The smartest gym management and CRM platform for Indian gyms.",
  keywords: ["gym management", "CRM", "membership", "attendance", "India"],
  openGraph: {
    title: "GymOS",
    description: "Modern gym management platform",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
            toastOptions={{
              style: { fontFamily: "Outfit, sans-serif" },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
