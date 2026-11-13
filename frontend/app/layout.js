import "./globals.css";
import AppShell from "../components/AppShell";

export const metadata = {
  title: "Pantau Lot — Market Watch BEI",
  description: "Dashboard pasar saham BEI untuk investor ritel pemula, data Yahoo Finance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap" rel="stylesheet" />
      </head>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
