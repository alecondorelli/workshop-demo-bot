import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Workshop Demo Bot', description: 'Explore how an AI application works, one message at a time.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
