import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ConditionalFooter from "@/components/layout/ConditionalFooter";

export const metadata: Metadata = {
  title: "MyDouble - Crée ton Double IA",
  description: "Crée ton double IA en 3 étapes simples : analyse ton style, définis ta personnalité, clone ta voix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased flex flex-col min-h-screen">
        <Navbar />
        <main className="pt-16 pb-20 flex-1">
          {children}
        </main>
        <ConditionalFooter />
      </body>
    </html>
  );
}
