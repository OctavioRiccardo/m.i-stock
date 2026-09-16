import React from 'react';
import { Footer } from '@/views/comunes/Footer';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1C2424] flex flex-col">
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
