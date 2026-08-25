import React, { useState } from 'react';
import { X, Check, ShoppingBag, MessageCircle, Sparkles, Plus, Minus } from 'lucide-react';
import { Product } from '@/components/AdminPanel';

interface ProductColorModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCartWithColor: (product: Product, color: string, quantity: number) => void;
  onDirectWhatsAppOrder?: (product: Product, color: string, quantity: number) => void;
}

// Mapa de cores comuns com seus códigos hexadecimais para renderização visual
const COLOR_HEX_MAP: Record<string, { bg: string; border?: string; isLight?: boolean }> = {
  'preto': { bg: '#171717' },
  'preto espacial': { bg: '#1C1D1F' },
  'black': { bg: '#171717' },
  'grafite': { bg: '#3C3D42' },
  'cinza': { bg: '#6E6E73' },
  'prata': { bg: '#E2E4E6', border: '#C5C8CC', isLight: true },
  'branco': { bg: '#FFFFFF', border: '#D1D5DB', isLight: true },
  'transparente': { bg: 'linear-gradient(135deg, #F3F4F6 25%, #E5E7EB 25%, #E5E7EB 50%, #F3F4F6 50%, #F3F4F6 75%, #E5E7EB 75%, #E5E7EB 100%)', border: '#9CA3AF', isLight: true },
  'azul': { bg: '#2563EB' },
  'azul marinho': { bg: '#1E3A8A' },
  'azul sierra': { bg: '#6B9AC4' },
  'azul titânio': { bg: '#394A59' },
  'verde': { bg: '#16A34A' },
  'verde escuro': { bg: '#14532D' },
  'verde menta': { bg: '#A7F3D0', border: '#6EE7B7', isLight: true },
  'verde titânio': { bg: '#47584E' },
  'rosa': { bg: '#EC4899' },
  'rosa claro': { bg: '#FBCFE8', border: '#F472B6', isLight: true },
  'roxo': { bg: '#9333EA' },
  'roxo profundo': { bg: '#3B1E54' },
  'lilas': { bg: '#C084FC', border: '#A855F7' },
  'lilás': { bg: '#C084FC', border: '#A855F7' },
  'vermelho': { bg: '#DC2626' },
  'vinho': { bg: '#7F1D1D' },
  'laranja': { bg: '#EA580C' },
  'amarelo': { bg: '#FACC15', border: '#EAB308', isLight: true },
  'dourado': { bg: '#EAB308', border: '#CA8A04' },
  'titânio natural': { bg: '#9E978E' },
  'titânio deserto': { bg: '#BFA89B' },
};

const DEFAULT_CASE_COLORS = [
  'Preto',
  'Transparente',
  'Azul Marinho',
  'Rosa Claro',
  'Roxo Profundo',
  'Verde Escuro',
  'Titânio Natural'
];

export function ProductColorModal({
  isOpen,
  product,
  onClose,
  onAddToCartWithColor,
  onDirectWhatsAppOrder
}: ProductColorModalProps) {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Lista de cores disponíveis para este produto
  const availableColors = React.useMemo(() => {
    if (!product) return DEFAULT_CASE_COLORS;
    if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
      return product.colors;
    }
    return DEFAULT_CASE_COLORS;
  }, [product]);

  // Definir cor inicial
  React.useEffect(() => {
    if (isOpen && availableColors.length > 0) {
      setSelectedColor(availableColors[0]);
      setQuantity(1);
    }
  }, [isOpen, availableColors]);

  if (!isOpen || !product) return null;

  const getColorStyle = (colorName: string) => {
    const clean = colorName.trim().toLowerCase();
    if (COLOR_HEX_MAP[clean]) {
      return COLOR_HEX_MAP[clean];
    }
    // Tenta encontrar por palavra-chave
    for (const [key, value] of Object.entries(COLOR_HEX_MAP)) {
      if (clean.includes(key)) {
        return value;
      }
    }
    return { bg: '#5C554B' };
  };

  const handleConfirmAdd = () => {
    onAddToCartWithColor(product, selectedColor, quantity);
    onClose();
  };

  const handleWhatsApp = () => {
    if (onDirectWhatsAppOrder) {
      onDirectWhatsAppOrder(product, selectedColor, quantity);
    } else {
      const cleanPhone = '5597984180479'; // WhatsApp Lucca Cell
      const text = `Olá Lucca Cell! Gostaria de pedir:\n\n📱 *${product.name}*\n🎨 *Cor:* ${selectedColor}\n🔢 *Quantidade:* ${quantity}x\n💰 *Valor:* ${(product.price * quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\nAinda está disponível para entrega ou retirada?`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    }
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-[#141210]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="relative w-full max-w-md overflow-hidden rounded-t-[28px] sm:rounded-[28px] border border-[#E7E0D6] bg-[#FFFFFF] text-[#1E1D1B] shadow-[0_25px_60px_rgba(0,0,0,0.18)] animate-rise max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gold Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D97757] via-[#E09A38] to-[#D97757]" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF6F0] text-[#6E675D] hover:bg-[#EBE4DA] hover:text-[#1E1D1B] transition-colors"
          >
            <X size={17} />
          </button>

          <div className="p-6 sm:p-7 overflow-y-auto">
            {/* Header: Produto */}
            <div className="flex items-center gap-4 mb-5 pr-8">
              {product.image ? (
                <div className="h-16 w-16 shrink-0 rounded-2xl border border-[#EBE4DA] bg-[#FAF8F5] p-1.5 flex items-center justify-center overflow-hidden">
                  <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-2xl border border-[#F0D5C7] bg-[#FAF2EB] flex items-center justify-center text-[#D97757] font-black text-xs">
                  LUCCA
                </div>
              )}
              <div>
                <span className="inline-block rounded-full bg-[#FAF2EB] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#D97757] mb-1">
                  {product.category}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1E1D1B] leading-snug line-clamp-2">
                  {product.name}
                </h3>
                <div className="text-sm font-black text-[#D97757] mt-0.5">
                  {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
            </div>

            {/* Seção de Escolha de Cor */}
            <div className="mb-6 rounded-2xl border border-[#EDE6DC] bg-[#FAF8F5] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6E675D]">
                  Escolha a Cor:
                </span>
                <span className="text-xs font-black text-[#D97757] bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border border-[#E8DFC8]">
                  {selectedColor}
                </span>
              </div>

              {/* Grid de Cores */}
              <div className="grid grid-cols-2 gap-2.5">
                {availableColors.map((colorName) => {
                  const styleInfo = getColorStyle(colorName);
                  const isSelected = selectedColor === colorName;

                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => setSelectedColor(colorName)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#D97757] bg-[#FFFFFF] shadow-sm ring-2 ring-[#D97757]/20'
                          : 'border-[#E5DDD0] bg-[#FFFFFF]/70 hover:bg-[#FFFFFF] hover:border-[#D5CABE]'
                      }`}
                    >
                      {/* Círculo da Cor */}
                      <div
                        className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center shadow-xs transition-transform"
                        style={{
                          background: styleInfo.bg,
                          border: styleInfo.border ? `1px solid ${styleInfo.border}` : '1px solid rgba(0,0,0,0.1)'
                        }}
                      >
                        {isSelected && (
                          <Check 
                            size={12} 
                            className={styleInfo.isLight ? 'text-black' : 'text-white'} 
                            strokeWidth={3} 
                          />
                        )}
                      </div>

                      <span className={`text-xs font-bold truncate ${isSelected ? 'text-[#1E1D1B]' : 'text-[#5C554B]'}`}>
                        {colorName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantidade */}
            <div className="flex items-center justify-between mb-6 px-1">
              <span className="text-xs font-bold text-[#6E675D]">Quantidade:</span>
              <div className="flex items-center gap-3 rounded-full border border-[#DED6CA] bg-[#FAF8F5] px-3 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-[#6E675D] hover:text-[#1E1D1B] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="text-xs font-black text-[#1E1D1B] min-w-[20px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-[#6E675D] hover:text-[#1E1D1B] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#D97757] to-[#C85A32] py-3.5 text-xs font-extrabold text-white shadow-md hover:from-[#C85A32] hover:to-[#B05330] transition-all cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span>Adicionar à Sacola · {selectedColor}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#25D366] bg-[#25D366]/10 py-3 text-xs font-extrabold text-[#1B793B] hover:bg-[#25D366]/20 transition-all cursor-pointer"
              >
                <MessageCircle size={16} className="text-[#25D366]" />
                <span>Pedir no WhatsApp Agora</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
