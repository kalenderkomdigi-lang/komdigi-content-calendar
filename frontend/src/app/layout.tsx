import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B2545",
};

export const metadata: Metadata = {
  title: "KOMDIGI - Content Calendar AI Pegawai",
  description: "Aplikasi Resmi Perencanaan Kalender Konten, Naskah Podcast, dan Publikasi Digital BLSDM Kementerian Komunikasi dan Digital RI.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Komdigi AI",
  },
  icons: {
    icon: '/komdigi-icon.png',
    shortcut: '/komdigi-icon.png',
    apple: '/komdigi-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-full bg-[#F8F9FD] text-[#1E293B] antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
