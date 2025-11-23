'use client';

import { Github, Twitter, Linkedin, ExternalLink } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'API', href: '#api' },
    { name: 'Changelog', href: '#changelog' }
  ],
  company: [
    { name: 'About', href: '#about' },
    { name: 'Blog', href: '#blog' },
    { name: 'Careers', href: '#careers' },
    { name: 'Contact', href: '#contact' }
  ],
  resources: [
    { name: 'Documentation', href: '#docs' },
    { name: 'Help Center', href: '#help' },
    { name: 'Community', href: '#community' },
    { name: 'Privacy', href: '#privacy' }
  ]
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#1A1A1A]">
      <div className="container-custom py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-4">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#E5E5E5] mb-2">
                Cognitive Context
              </h3>
              <p className="text-[#999999] text-sm leading-relaxed">
                Tu memoria, turbo-cargada. Gestiona tu conocimiento con inteligencia artificial.
              </p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a 
                href="#" 
                className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors group"
                aria-label="GitHub"
              >
                <Github size={16} className="text-[#999999] group-hover:text-white transition-colors" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors group"
                aria-label="Twitter"
              >
                <Twitter size={16} className="text-[#999999] group-hover:text-white transition-colors" />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#2A2A2A] transition-colors group"
                aria-label="LinkedIn"
              >
                <Linkedin size={16} className="text-[#999999] group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 grid grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-[#E5E5E5] mb-4 uppercase tracking-wider">
                Producto
              </h4>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-sm text-[#999999] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-[#E5E5E5] mb-4 uppercase tracking-wider">
                Empresa
              </h4>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-sm text-[#999999] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-[#E5E5E5] mb-4 uppercase tracking-wider">
                Recursos
              </h4>
              <ul className="space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href}
                      className="text-sm text-[#999999] hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="mb-12 p-6 rounded-2xl bg-[#1A1A1A]/30 border border-[#2A2A2A]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h4 className="text-lg font-semibold text-[#E5E5E5] mb-2">
                Mantente Actualizado
              </h4>
              <p className="text-sm text-[#999999]">
                Recibe las últimas novedades sobre IA y gestión del conocimiento
              </p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 md:w-64 px-4 py-2 bg-[#1A1A1A] border border-[#2A2A2A] 
                         rounded-lg text-white placeholder-[#666666] focus:outline-none 
                         focus:border-blue-500 transition-colors"
              />
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                               rounded-lg font-medium transition-colors cursor-pointer">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1A1A1A]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Legal Links */}
            <div className="flex items-center gap-6 text-sm text-[#999999]">
              <a href="#privacy" className="hover:text-white transition-colors">
                Privacidad
              </a>
              <a href="#terms" className="hover:text-white transition-colors">
                Términos
              </a>
              <a href="#cookies" className="hover:text-white transition-colors">
                Cookies
              </a>
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-[#666666]">
              © {currentYear} Cognitive Context. Todos los derechos reservados.
            </div>
          </div>
          
          {/* YC Style Badge */}
          <div className="mt-6 pt-6 border-t border-[#1A1A1A] flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1A1A1A] 
                          text-xs text-[#999999]">
              <span>Hecho con</span>
              <ExternalLink size={12} className="text-blue-500" />
              <span>por</span>
              <span className="text-white font-medium">Platanus</span>
              <span>•</span>
              <span>Demo Day 2025</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}