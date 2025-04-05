import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { inter, air, satoshi } from './fonts';

export const metadata: Metadata = {
  title: 'HectoClash',
  description: 'Test your math skills in a fun and engaging way!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.variable} ${air.variable} ${satoshi.variable} antialiased`}>
        <Toaster />
        {children}
      </body>
    </html>
  );
}
