import type { Metadata } from "next";
import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import Footer from "@/components/layout/Footer";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import ConditionalMain from "@/components/layout/ConditionalMain";

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
        <ConditionalNavbar />
        <ConditionalMain>
          {children}
        </ConditionalMain>
        <ConditionalFooter />
      </body>
    </html>
  );
}
