import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Movie Tracker",
  description: "Search movies, TV, and anime. Save watchlists and track your own ratings."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link href="/" className="brand">
              MovieTracker
            </Link>
            <nav className="site-nav">
              <Link href="/">Search</Link>
              <Link href="/my-list">My List</Link>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}