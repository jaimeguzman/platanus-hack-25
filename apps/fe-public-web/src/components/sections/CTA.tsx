'use client';

import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 border-t border-[#2A2A2A]">
      <div className="container-custom">
        <div className="rounded-xl border border-accent/30 bg-gradient-to-r from-blue-600/10 via-accent/5 to-transparent p-12 text-center">
          <h2 className="heading-h2 mb-4">
            Libera el Poder de tu Conocimiento
          </h2>
          <p className="text-lg text-[#999999] max-w-2xl mx-auto mb-8">
            Sé de los primeros en experimentar el futuro de la gestión del conocimiento.
            Acceso anticipado disponible muy pronto.
          </p>
          <button className="btn-primary inline-flex items-center gap-2 group relative">
            <span>Unirse a Lista de Espera</span>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            <div className="absolute -top-2 -right-2 px-2 py-1 text-xs bg-orange-500 text-white rounded-full font-medium animate-pulse">
              Beta
            </div>
          </button>
          
          <div className="mt-4 text-sm text-[#666666]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Acceso anticipado limitado
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
