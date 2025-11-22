import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SecondBrain - Tu Segundo Cerebro para Gestionar Conocimiento',
  description: 'Sistema de gestión de conocimiento personal que captura y organiza automáticamente tu contexto de trabajo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0F0F0F] text-[#E5E5E5]`}>
        {children}
      </body>
    </html>
  );
}
