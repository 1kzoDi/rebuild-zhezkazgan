import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/ToastContainer";

export const metadata: Metadata = {
  title: "ReBuild — Стройматериалам вторую жизнь | Жезказган",
  description:
    "Казахстанский стартап повторного использования строительных материалов: каталог остатков, цифровой двойник склада 2D и городская карта Жезказгана.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="/leaflet.css" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F8F7] text-[#181A1F] font-sans">
        <StoreProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
          <ToastContainer />
        </StoreProvider>
      </body>
    </html>
  );
}
