import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diseñador de Riego por Goteo — Proyecto de Física',
  description: 'Herramienta académica para diseñar y simular un sistema de riego por goteo por gravedad.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
