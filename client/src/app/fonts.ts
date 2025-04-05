import { Inter } from 'next/font/google';
import localFont from 'next/font/local';

export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const satoshi = localFont({
  src: '../assets/Satoshi-Variable.ttf',
  variable: '--font-satoshi',
});

export const air = localFont({ src: '../assets/AirbnbCereal_W_Blk.otf', variable: '--font-air' });
