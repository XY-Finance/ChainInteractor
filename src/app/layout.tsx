import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { Providers } from '../lib/providers';
import Navigation from '../components/layout/Navigation';
import { ClientWrapper } from '../components/layout/ClientWrapper';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EIP-7702 Demo Project",
  description: "ZeroDev and MetaMask EIP-7702 Smart Account Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ClientWrapper>
            <Navigation />
            {children}
          </ClientWrapper>
        </Providers>
      </body>
    </html>
  );
}
