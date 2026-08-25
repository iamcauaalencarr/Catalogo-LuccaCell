import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, MessageCircle, Smartphone, Sparkles, Search, Compass } from 'lucide-react';
import logoPath from '@assets/LOGO_1_1786564407567.png';

interface NotFoundPageProps {
  onGoHome?: () => void;
}

export function NotFoundPage({ onGoHome }: NotFoundPageProps) {
  const handleHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#FAF7F2] text-[#1E1D1B] selection:bg-[#D97757]/20 selection:text-[#B05330]">
      {/* Luzes / Orbs decorativos animados ao fundo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            x: [0, 40, 0],
            y: [0, -30, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-[15%] -left-[10%] h-[500px] w-[500px] rounded-full bg-radial from-[#D97757]/25 via-[#E89E78]/10 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, 40, 0],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute -bottom-[15%] -right-[10%] h-[600px] w-[600px] rounded-full bg-radial from-[#B05330]/20 via-[#F3D7C9]/30 to-transparent blur-3xl"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#D97757_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.12]" />
      </div>

      {/* Header Minimalista */}
      <header className="relative z-10 border-b border-[#EAE2D5] bg-[#FFFFFF]/70 backdrop-blur-md">
        <div className="gold-line h-0.5 w-full" />
        <div className="container-lucca flex h-[68px] items-center justify-between">
          <button
            type="button"
            onClick={handleHome}
            className="flex items-center gap-2 transition-opacity hover:opacity-85"
            aria-label="Ir para a página inicial"
          >
            <img
              src={logoPath}
              alt="Lucca Cell"
              className="h-[50px] w-[95px] object-contain object-left"
            />
          </button>

          <button
            type="button"
            onClick={handleHome}
            className="inline-flex items-center gap-2 rounded-full border border-[#DFD7CB] bg-[#FFFFFF] px-4 py-2 text-xs font-bold text-[#5C554B] transition-all hover:border-[#D97757] hover:text-[#1E1D1B] hover:shadow-xs active:scale-95"
          >
            <ArrowLeft size={14} /> Voltar ao Início
          </button>
        </div>
      </header>

      {/* Conteúdo Central 404 */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="mx-auto flex max-w-[620px] flex-col items-center text-center">
          {/* Badge de Alerta Estilizado */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-[#F0D5C7] bg-[#FAF2EB] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#B05330] shadow-xs"
          >
            <Compass size={14} className="animate-spin text-[#D97757]" style={{ animationDuration: '8s' }} />
            <span>Erro 404 · Sinal Desconectado</span>
          </motion.div>

          {/* Ilustração Animada: Número 404 com Smartphone Central */}
          <div className="relative my-6 flex items-center justify-center select-none">
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-[110px] sm:text-[150px] font-black leading-none tracking-tighter text-[#E4DBD0] drop-shadow-sm"
            >
              4
            </motion.span>

            {/* Smartphone Central com animação de flutuação */}
            <motion.div
              animate={{
                y: [-6, 6, -6],
                rotate: [-2, 2, -2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative mx-1 sm:mx-3 flex h-[130px] w-[75px] sm:h-[160px] sm:w-[92px] flex-col items-center justify-between rounded-[22px] border-[3px] border-[#D97757] bg-[#FFFFFF] p-2 shadow-[0_16px_35px_rgba(217,119,87,0.22)]"
            >
              {/* Notch */}
              <div className="h-1 w-6 rounded-full bg-[#E5DDD0]" />

              {/* Tela com ícone quebrado/animado */}
              <div className="relative flex flex-1 w-full flex-col items-center justify-center overflow-hidden rounded-[14px] bg-[#FAF7F2] border border-[#EFE8DC] p-1 my-1">
                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#FAF2EB] border border-[#F3D7C9] text-[#D97757]"
                >
                  <Smartphone size={22} className="sm:hidden" />
                  <Smartphone size={26} className="hidden sm:block" />
                </motion.div>
                
                {/* Faísca de conserto / assistência */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute -top-1 -right-1 text-[#D48825]"
                >
                  <Sparkles size={14} />
                </motion.div>
              </div>

              {/* Botão Home / Barra inferior */}
              <div className="h-1 w-8 rounded-full bg-[#C8C0B2]" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-serif text-[110px] sm:text-[150px] font-black leading-none tracking-tighter text-[#E4DBD0] drop-shadow-sm"
            >
              4
            </motion.span>
          </div>

          {/* Textos Principais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="display text-[26px] sm:text-[34px] font-extrabold leading-tight text-[#1E1D1B]">
              Ops! Essa página <span className="gold-text">não existe</span> por aqui.
            </h1>
            <p className="mt-3 max-w-[460px] text-xs sm:text-sm leading-relaxed text-[#6E675D]">
              O link que você seguiu pode ter sido alterado, removido ou digitado incorretamente. Mas não se preocupe, nosso catálogo está repleto de novidades esperando por você!
            </p>
          </motion.div>

          {/* Botões de Ação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-[420px]"
          >
            <button
              type="button"
              onClick={handleHome}
              className="flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-full bg-[#D97757] px-6 text-xs font-extrabold text-[#FFFFFF] shadow-sm transition-all hover:bg-[#C85A32] hover:shadow-md active:scale-95"
            >
              <Home size={16} /> Explorar Catálogo
            </button>

            <a
              href="https://wa.me/5597991554563?text=Ol%C3%A1%2C%20Lucca%20Cell!%20Estava%20no%20site%20e%20n%C3%A3o%20encontrei%20o%20que%20procurava."
              target="_blank"
              rel="noreferrer"
              className="flex h-12 w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-full border border-[#DED6CA] bg-[#FFFFFF] px-6 text-xs font-bold text-[#4A443B] shadow-2xs transition-all hover:border-[#D97757] hover:text-[#1E1D1B] hover:bg-[#FAF7F2] active:scale-95"
            >
              <MessageCircle size={16} className="text-[#25D366]" /> Chamar no WhatsApp
            </a>
          </motion.div>

          {/* Card de Dica Rápida */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 rounded-2xl border border-[#EAE2D5] bg-[#FFFFFF]/80 backdrop-blur-xs p-4 text-left shadow-2xs w-full max-w-[440px]"
          >
            <div className="flex items-center gap-2.5 text-xs font-bold text-[#1E1D1B]">
              <Search size={15} className="text-[#D97757]" />
              <span>Procurando algo específico?</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-[#787063]">
              Temos películas, capinhas, cabos turbo, fones sem fio e assistência técnica especializada em Guajará - AM.
            </p>
          </motion.div>
        </div>
      </main>

      {/* Rodapé Simples */}
      <footer className="relative z-10 border-t border-[#EAE2D5] bg-[#FFFFFF]/60 py-4 text-center text-[10px] text-[#8E8578]">
        © 2026 Loucas Por Esmaltes & Lucca Cell · Rua Presidente Vargas, 021 - Guajará, AM
      </footer>
    </div>
  );
}
