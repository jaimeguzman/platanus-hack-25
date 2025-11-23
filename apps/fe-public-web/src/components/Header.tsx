'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { WaitlistModal } from './WaitlistModal';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navItems = [
    { label: 'Características', href: '#features' },
    { label: 'Cómo funciona', href: '#how-it-works' },
    { label: 'Chat', href: '#chat' },
    { label: 'Contacto', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#2A2A2A] bg-[#0F0F0F]/80 backdrop-blur-sm">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <span className="font-bold text-lg">Cognitive Context</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm text-[#999999] hover:text-[#E5E5E5] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* FOMO Registration */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-[#999999]">Acceso Exclusivo</div>
                <div className="text-sm font-medium text-blue-400">Próximamente</div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-[#2A2A2A] py-4 space-y-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="block px-2 py-2 text-[#999999] hover:text-[#E5E5E5] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {/* FOMO Registration Mobile */}
            <div className="mt-4 p-4 rounded-lg bg-[#1A1A1A]/50 border border-blue-500/20">
              <div className="text-center mb-3">
                <div className="text-xs text-[#999999] mb-1">Acceso Exclusivo</div>
                <div className="text-lg font-medium text-blue-400">Próximamente</div>
                <div className="text-xs text-[#666666] mt-1">Sé de los primeros en acceder</div>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(true);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 
                               rounded-lg text-sm font-medium hover:bg-blue-500/20 hover:border-blue-500/50 
                               transition-all duration-300 cursor-pointer">
                Unirse a Lista de Espera
              </button>
            </div>
          </div>
        )}
      </div>

      <WaitlistModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </header>
  );
}