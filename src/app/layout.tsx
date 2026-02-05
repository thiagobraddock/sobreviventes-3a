import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sobreviventes 3A",
  description: "Ranking de frequência do grupo Sobreviventes 3A",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
