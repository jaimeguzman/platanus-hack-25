'use client';

import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Gratuito',
    price: '$0',
    period: 'por siempre',
    description: 'Perfecto para empezar',
    features: [
      '100 notas al mes',
      '1GB de almacenamiento',
      'Búsqueda básica',
      'Organización por proyectos',
      'Acceso a API',
    ],
    cta: 'Comenzar Gratis',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'por mes',
    description: 'Para usuarios avanzados',
    features: [
      'Notas ilimitadas',
      '100GB de almacenamiento',
      'Búsqueda avanzada',
      'Grafo de conexiones',
      'Integraciones',
      'Exportar a Markdown',
      'Soporte prioritario',
    ],
    cta: 'Comenzar Pro',
    featured: true,
  },
  {
    name: 'Team',
    price: '$15',
    period: 'por usuario/mes',
    description: 'Para equipos',
    features: [
      'Todo en Pro',
      'Espacios compartidos',
      'Control de permisos',
      'Auditoría y logs',
      'SSO',
      'Soporte dedicado',
    ],
    cta: 'Contactar Ventas',
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 border-t border-[#2A2A2A]">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="heading-h2">Planes Simples y Transparentes</h2>
          <p className="text-lg text-[#999999] max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades. Siempre puedes cambiar después.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-xl border transition-all ${
                plan.featured
                  ? 'border-blue-600 bg-gradient-to-b from-blue-600/10 to-[#1A1A1A]/30 md:scale-105 md:z-10'
                  : 'border-[#2A2A2A] bg-[#1A1A1A]/30'
              } p-8 flex flex-col`}
            >
              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-[#999999] text-sm">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-[#999999] text-sm ml-2">{plan.period}</span>
              </div>

              {/* CTA Button */}
              <button
                className={`w-full py-3 rounded-lg font-medium mb-8 transition-colors ${
                  plan.featured
                    ? 'bg-blue-600 text-white hover:bg-blue-600'
                    : 'border border-[#2A2A2A] text-[#E5E5E5] hover:bg-[#1A1A1A]'
                }`}
              >
                {plan.cta}
              </button>

              {/* Features List */}
              <div className="space-y-3 flex-grow">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#E5E5E5]">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Hint */}
        <div className="text-center">
          <p className="text-[#999999]">
            ¿Preguntas sobre nuestros planes?{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
