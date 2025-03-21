import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './provider';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Weather Dashboard",
  description: "A comprehensive weather dashboard showing weather information for various cities",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <nav className="bg-white shadow-md">
            <div className="container text-center mb-2">
              <div className="items-center align-center p-6 align-middle  h-16">
                <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-800">
                  Weather Dashboard
                </Link>
              </div>
            </div>
          </nav>
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
