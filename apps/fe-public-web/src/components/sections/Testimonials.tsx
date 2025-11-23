'use client';

import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'María García',
    role: 'Desarrolladora Senior',
    content:
      'Cognitive Context cambió cómo trabajo. Ya no pierdo tiempo buscando información que capturé hace meses. Mis ideas están siempre a mano.',
    rating: 5,
  },
  {
    name: 'Juan López',
    role: 'Product Manager',
    content:
      'Antes pasaba horas organizando notas en diferentes plataformas. Ahora todo está centralizado y conectado. La productividad subió 40%.',
    rating: 5,
  },
  {
    name: 'Sofia Chen',
    role: 'Investigadora',
    content:
      'Para mi investigación, poder capturar fuentes y hacer conexiones automáticas es invaluable. Es como tener un asistente de investigación.',
    rating: 5,
  },
  {
    name: 'Carlos Ruiz',
    role: 'Emprendedor',
    content:
        'Como fundador, necesito recordar cientos de decisiones y contextos. Cognitive Context me ayuda a mantener todo coherente y accesible.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-20 border-t border-[#2A2A2A]">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="heading-h2">Lo que dicen nuestros usuarios</h2>
          <p className="text-lg text-[#999999] max-w-2xl mx-auto">
            Descubre cómo Cognitive Context ha transformado la forma de trabajar de miles de personas
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]/30 hover:bg-[#1A1A1A]/60 transition-all"
            >
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-accent text-blue-600"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#E5E5E5] mb-6 italic">"{testimonial.content}"</p>

              {/* Author */}
              <div className="border-t border-[#2A2A2A] pt-4">
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-[#999999]">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
