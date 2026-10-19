import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "AndaOku — Daha bilinçli oku, daha iyi anla",
  description:
    "Araştırma temelli dijital öğrenme platformu. Okuma hızını ve akıcılığını geliştirirken okuduğunu anlama derinliğini korumayı hedefler.",
  keywords: [
    "hızlı okuma",
    "okuduğunu anlama",
    "okuma akıcılığı",
    "görsel dikkat",
    "eğitim teknolojisi",
    "AndaOku",
    "WPM ölçümü",
  ],
  authors: [{ name: "AndaOku Eğitim ve Bilişsel Ölçme Ekibi" }],
  openGraph: {
    title: "AndaOku — Daha bilinçli oku, daha iyi anla",
    description: "Okuma hızını geliştir, anlamı kaybetme. Bütünleşik dijital okuma laboratuvarı.",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport: Viewport = {
  themeColor: "#134E4A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen flex flex-col antialiased selection:bg-brand-100 selection:text-brand-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
