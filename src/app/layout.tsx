import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "Golden Coast Stay | Premium Short-Term Rentals in Accra, Ghana",
    template: "%s | Golden Coast Stay",
  },
  description:
    "Book professionally managed luxury short-term rentals and serviced apartments in Accra, Ghana. Experience premium hospitality with Golden Coast Stay.",
  keywords: [
    "Accra rentals",
    "Ghana apartments",
    "short-term rental Accra",
    "luxury stay Ghana",
    "serviced apartments Ghana",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://goldencoaststays.com",
    siteName: "Golden Coast Stay",
    title: "Premium Short-Term Rentals in Accra, Ghana",
    description: "Book luxury serviced apartments and villas in Accra, Ghana.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider><I18nProvider>{children}</I18nProvider></SessionProvider>
      </body>
    </html>
  );
}
