import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title: 'Ledger — Your business, in order', description: 'A simple workspace for sales, customers, stock, and business reports.', icons: {icon: '/favicon.svg'}};
export default function RootLayout({children}:Readonly<{children: React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
