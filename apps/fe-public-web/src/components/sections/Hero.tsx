'use client';

import { ArrowRight, Zap, Brain, Sparkles } from 'lucide-react';
import { NeuralNetworkBackground } from '../NeuralNetworkBackground';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-12 overflow-hidden">
      {/* Neural Network Background */}
      <NeuralNetworkBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F0F0F]/50 to-[#0F0F0F]/80 z-10" />
      <div className="container-custom w-full">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A2A] bg-[#1A1A1A]/50 backdrop-blur-sm z-20">
            <Brain size={16} className="text-blue-600 animate-pulse" />
            <span className="text-sm font-medium bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Tu segundo cerebro digital
            </span>
          </div>

          {/* Main Heading */}
          <div className="space-y-6 z-20 relative">
            <h1 className="heading-h1 text-[#E5E5E5] leading-tight">
              <span className="block">Gestiona tu</span>
              <span className="block">
                <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
                  Conocimiento Neural
                </span>
              </span>
              <span className="block text-[#999999]">Sin Esfuerzo</span>
            </h1>
            
            <p className="text-xl text-[#999999] max-w-2xl mx-auto leading-relaxed">
              <span className="inline-flex items-center gap-2">
                <Sparkles size={20} className="text-blue-500 animate-pulse" />
                SecondBrain captura, organiza y conecta automáticamente toda tu información.
              </span>
              <br />
              <span className="text-[#B3B3B3]">
                Libera tu mente para lo que realmente importa: crear e innovar.
              </span>
            </p>
          </div>

          {/* CTA Buttons - FOMO Version */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 z-20 relative">
            <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25">
              <span className="flex items-center gap-2">
                Obtén Acceso Temprano
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute -top-2 -right-2 px-2 py-1 text-xs bg-orange-500 text-white rounded-full font-medium animate-pulse">
                Beta
              </div>
            </button>
            
            <button className="group relative px-8 py-4 border-2 border-[#2A2A2A] text-[#E5E5E5] rounded-xl font-semibold hover:bg-[#1A1A1A] hover:border-blue-500/50 transition-all duration-300 backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <Zap size={20} className="text-blue-500" />
                Ver Demo
              </span>
            </button>
          </div>

          {/* Social Proof */}
          <div className="pt-12 flex flex-col items-center gap-4">
            <p className="text-sm text-[#999999]">Confiado por profesionales de</p>
            <div className="flex items-center gap-8 opacity-60">
              <div className="w-20 h-6 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="w-20 h-6 bg-[#2A2A2A] rounded animate-pulse" />
              <div className="w-20 h-6 bg-[#2A2A2A] rounded animate-pulse" />
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-6 mt-6 text-xs text-[#666666]">
              <div className="text-center">
                <div className="font-semibold text-[#999999]">10k+</div>
                <div>Usuarios Activos</div>
              </div>
              <div className="w-px h-4 bg-[#2A2A2A]" />
              <div className="text-center">
                <div className="font-semibold text-[#999999]">4.8/5</div>
                <div>Calificación</div>
              </div>
              <div className="w-px h-4 bg-[#2A2A2A]" />
              <div className="text-center">
                <div className="font-semibold text-[#999999]">IA</div>
                <div>Powered</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
