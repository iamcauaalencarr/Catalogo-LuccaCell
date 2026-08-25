import { type LucideIcon, ArrowRight, BatteryCharging, Cable, Check, ChevronDown, CircleCheck, Clock3, Headphones, Heart, Laptop, MapPin, Menu, MessageCircle, Minus, PackageCheck, Plus, RotateCcw, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Smartphone, Sparkles, Star, Tablet, Trash2, Truck, Wrench, X, Zap, Lock, Watch, Tag, Printer } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import logoPath from '@assets/LOGO_1_1786564407567.png';
import { AdminAuthModal } from '@/components/AdminAuthModal';
import { AdminSetPasswordModal } from '@/components/AdminSetPasswordModal';
import { ProductColorModal } from '@/components/ProductColorModal';
import { AdminPanel, type Product, type Category } from '@/components/AdminPanel';
import { ProductRequestModal } from '@/components/ProductRequestModal';
import { ThermalReceiptModal, type ReceiptData } from '@/components/ThermalReceiptModal';
import { signOutAdminFromSupabase, getSupabaseUser, AdminProfile, logSecurityAction, supabase } from '@/lib/supabase';
import { CATEGORIAS_VALIDAS } from '@/services/openrouter';
import { AdminStore } from '@/services/adminStore';
import { NotFoundPage } from '@/components/NotFoundPage';

const queryClient = new QueryClient();

type CartLine = { product: Product; quantity: number; selectedColor?: string };

function getCategoryIcon(categoryName: string): LucideIcon {
  const lower = categoryName.toLowerCase();
  if (lower === 'todos') return Sparkles;
  if (lower.includes('memória') || lower.includes('memoria') || lower.includes('sd') || lower.includes('sandisk') || lower.includes('pendrive') || lower.includes('armazenamento')) return Laptop;
  if (lower.includes('pulseira') || lower.includes('smartwatch') || lower.includes('relógio') || lower.includes('relogio') || lower.includes('watch')) return Watch;
  if (lower.includes('iluminação') || lower.includes('iluminacao') || lower.includes('led') || lower.includes('vídeo') || lower.includes('video')) return Sparkles;
  if (lower.includes('cabo') || lower.includes('carregador') || lower.includes('fonte') || lower.includes('energia')) return Zap;
  if (lower.includes('áudio') || lower.includes('audio') || lower.includes('fone') || lower.includes('som') || lower.includes('headset') || lower.includes('caixa de som')) return Headphones;
  if (lower.includes('película') || lower.includes('pelicula') || lower.includes('proteção') || lower.includes('protecao')) return ShieldCheck;
  if (lower.includes('assistência') || lower.includes('assistencia') || lower.includes('conserto') || lower.includes('reparo')) return Wrench;
  if (lower.includes('suporte') || lower.includes('veicular') || lower.includes('tripé')) return Smartphone;
  if (lower.includes('capa') || lower.includes('case') || lower.includes('capinha')) return Smartphone;
  if (lower.includes('bateria') || lower.includes('power')) return BatteryCharging;
  if (lower.includes('tablet') || lower.includes('ipad')) return Tablet;
  if (lower.includes('laptop') || lower.includes('computador') || lower.includes('notebook')) return Laptop;
  return Tag;
}



const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

import { LazyImage } from '@/components/ui/lazy-image';
import { Skeleton, ProductCardSkeleton } from '@/components/ui/skeleton';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FadeIn, ScaleIn, StaggerContainer, StaggerItem } from '@/components/ui/motion-wrapper';

function ProductVisual({ product }: { product: Product }) {
  if (product.image) {
    return (
      <div className="product-visual relative flex h-[206px] items-center justify-center overflow-hidden rounded-[14px] sm:h-[220px] bg-[#FFFFFF] border border-[#EAE2D5] p-2">
        <LazyImage 
          src={product.image} 
          alt={product.name} 
          containerClassName="h-full w-full flex items-center justify-center"
          className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105" 
        />
        <span className="shine" />
        <div className="absolute left-3 top-3 rounded-full bg-[#FFFFFF]/90 border border-[#E5DDD0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#B05330] z-10 backdrop-blur-md shadow-xs">
          {product.category}
        </div>
        <span className="absolute bottom-3 right-3 font-mono text-[10px] tracking-[.14em] text-[#5C554B] bg-[#FFFFFF]/90 border border-[#E5DDD0] px-2 py-0.5 rounded-full z-10 backdrop-blur-xs shadow-2xs">
          LC / {String(product.id).padStart(2, '0')}
        </span>
      </div>
    );
  }

  const icons: Record<Product['visual'], LucideIcon> = {
    phone: Smartphone, cable: Cable, audio: Headphones, shield: ShieldCheck,
    battery: BatteryCharging, laptop: Laptop, tablet: Tablet, repair: Wrench,
  };
  const Icon = icons[product.visual] || Smartphone;
  return (
    <div className="product-visual relative flex h-[206px] items-center justify-center overflow-hidden rounded-[14px] sm:h-[220px] border border-[#EAE2D5] bg-[#FAF7F2]">
      <span className="shine" />
      <div className="absolute left-3 top-3 rounded-full bg-[#FFFFFF]/90 border border-[#E5DDD0] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#B05330] z-10">
        {product.category}
      </div>
      <div className={`relative flex items-center justify-center ${product.visual === 'phone' ? 'h-[152px] w-[78px] rounded-[17px] border-[4px] border-[#DDD5C7] bg-[#FFFFFF] shadow-[10px_12px_0_rgba(217,119,87,.12)]' : product.visual === 'cable' ? 'h-[132px] w-[132px] rounded-full border-[10px] border-[#DDD5C7] border-t-transparent' : product.visual === 'shield' ? 'h-[144px] w-[116px] rounded-[20px] border border-[#DDD5C7] bg-[#FFFFFF]/80 shadow-inner' : 'h-[116px] w-[142px] rounded-[34px] bg-[#FFFFFF] border border-[#DDD5C7] shadow-[10px_12px_0_rgba(217,119,87,.12)]'}`}>
        <Icon size={product.visual === 'phone' ? 28 : 42} strokeWidth={1.5} className="text-[#D97757]" />
        {product.visual === 'phone' && <span className="absolute bottom-2 h-1 w-5 rounded-full bg-[#C8C0B2]" />}
      </div>
      <span className="absolute bottom-3 right-3 font-mono text-[10px] tracking-[.14em] text-[#787063]">LC / {String(product.id).padStart(2, '0')}</span>
    </div>
  );
}

function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onFavorite,
  isFavorite
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  onFavorite: (id: number) => void;
  isFavorite: boolean;
}) {
  if (!product) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-[#1E1D1B]/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div 
          className="relative w-full max-w-2xl overflow-hidden rounded-[24px] border border-[#E7E0D6] bg-[#FFFFFF] text-[#1E1D1B] shadow-[0_25px_60px_rgba(0,0,0,0.18)] animate-rise max-h-[90vh] flex flex-col my-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-[#D97757] via-[#E09A38] to-[#D97757]" />
          
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="absolute right-4 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D8CC] bg-[#FFFFFF]/90 text-[#6E675D] hover:bg-[#F7F3EC] hover:text-[#1E1D1B] transition-colors shadow-xs"
          >
            <X size={18} />
          </button>

          <div className="overflow-y-auto p-5 sm:p-7">
            <div className="grid gap-6 sm:grid-cols-2 items-center">
              {/* Product Visual Expanded */}
              <div className="relative flex min-h-[280px] max-h-[340px] items-center justify-center rounded-2xl border border-[#EAE2D5] bg-[#FAF7F2] p-4">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="max-h-[260px] max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                  />
                ) : (
                  <ProductVisual product={product} />
                )}
                
                <button
                  type="button"
                  onClick={() => onFavorite(product.id)}
                  aria-label="Favoritar"
                  className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border ${isFavorite ? 'border-[#D97757] bg-[#D97757] text-[#FFFFFF]' : 'border-[#E2DAD0] bg-[#FFFFFF]/90 text-[#5C554B] hover:text-[#1E1D1B]'} backdrop-blur-sm shadow-xs`}
                >
                  <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-full bg-[#FAF2EB] border border-[#F0D5C7] px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#B05330]">
                      {product.category}
                    </span>
                    {product.tag && (
                      <span className="rounded-full bg-[#FBF0EA] border border-[#F3D7C9] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#B8522E]">
                        {product.tag}
                      </span>
                    )}
                  </div>

                  <h2 className="display text-[22px] sm:text-[26px] font-bold leading-tight text-[#1E1D1B]">
                    {product.name}
                  </h2>

                  <div className="mt-2.5 flex items-center gap-2 text-xs text-[#D48825]">
                    <div className="flex items-center gap-1">
                      <Star size={14} fill="currentColor" />
                      <strong className="text-[#1E1D1B] font-extrabold">{product.rating.toFixed(1)}</strong>
                    </div>
                    <span className="text-[#8E8578]">({product.reviews} avaliações)</span>
                    <span className="text-[#D9D0C3]">·</span>
                    <span className="font-mono text-[10px] text-[#8E8578]">LC / {String(product.id).padStart(2, '0')}</span>
                  </div>

                  <p className="mt-4 text-xs sm:text-[13px] leading-relaxed text-[#5C554B]">
                    {product.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-[#F0EAE0] pt-4">
                  <div className="mb-4">
                    {product.oldPrice && (
                      <span className="text-xs text-[#948A7D] line-through block">
                        De: {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="display text-[28px] font-bold text-[#1E1D1B]">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-[11px] font-semibold text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                        Em até 12x no cartão
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(product);
                        onClose();
                      }}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#D97757] px-6 text-xs font-extrabold text-[#FFFFFF] hover:bg-[#C85A32] active:scale-95 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar à Sacola
                    </button>
                    
                    <a
                      href={`https://wa.me/5597991554563?text=${encodeURIComponent(`Olá! Gostaria de tirar dúvidas sobre o produto: ${product.name} (R$ ${product.price.toFixed(2)})`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#DED6CA] bg-[#FFFFFF] px-5 text-xs font-bold text-[#4A443B] hover:border-[#D97757] hover:text-[#1E1D1B] transition-colors"
                    >
                      <MessageCircle size={15} className="text-[#25D366]" /> Tirar Dúvidas no WhatsApp
                    </a>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-[10px] text-[#736B60]">
                    <ShieldCheck size={14} className="text-[#D97757] shrink-0" />
                    <span>Retirada imediata em loja: Rua Presidente Vargas, 021 - Guajará, AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProductCard({ 
  product, 
  favorite, 
  onFavorite, 
  onAdd,
  onOpenDetails
}: { 
  product: Product; 
  favorite: boolean; 
  onFavorite: () => void; 
  onAdd: () => void;
  onOpenDetails: () => void;
}) {
  return (
    <article className="product-card animate-rise rounded-[18px] border border-[#E7E0D6] bg-[#FFFFFF] p-2.5 flex flex-col justify-between shadow-xs transition-all hover:border-[#D97757]/40 hover:shadow-md" data-testid={`card-product-${product.id}`}>
      <div className="relative cursor-pointer group" onClick={onOpenDetails}>
        <ProductVisual product={product} />
        <button 
          type="button" 
          onClick={(e) => {
            e.stopPropagation();
            onFavorite();
          }} 
          aria-label={favorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`} 
          data-testid={`button-favorite-${product.id}`} 
          className={`icon-button absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border ${favorite ? 'border-[#D97757] bg-[#D97757] text-[#FFFFFF]' : 'border-[#E2DAD0] bg-[#FFFFFF]/85 text-[#5C554B] hover:text-[#1E1D1B]'} backdrop-blur-sm shadow-xs z-20`}
        >
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="px-2 pb-2 pt-4 flex flex-col flex-1 justify-between">
        <div className="cursor-pointer" onClick={onOpenDetails}>
          <div className="mb-1.5 flex min-h-[18px] items-center gap-2">
            {product.tag && (
              <span className="rounded-full bg-[#FBF0EA] border border-[#F3D7C9] px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#B8522E]">
                {product.tag}
              </span>
            )}
          </div>
          <h3 className="display text-[17px] font-semibold leading-snug text-[#1E1D1B] hover:text-[#D97757] transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
          <p className="mt-1.5 line-clamp-2 min-h-[34px] text-[11px] leading-relaxed text-[#6E675D]">
            {product.description}
          </p>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#D48825]">
              <Star size={13} fill="currentColor" />
              <strong className="text-[#1E1D1B]">{product.rating.toFixed(1)}</strong>
              <span className="text-[#8E8578]">({product.reviews})</span>
            </div>
            <button 
              type="button" 
              onClick={onOpenDetails} 
              className="text-[10px] font-bold text-[#B05330] hover:text-[#D97757] transition-colors"
            >
              + Detalhes
            </button>
          </div>
          <div className="mt-3 flex items-end justify-between gap-2 border-t border-[#F0EAE0] pt-3">
            <div className="cursor-pointer" onClick={onOpenDetails}>
              {product.oldPrice && <div className="text-[10px] text-[#948A7D] line-through">{formatPrice(product.oldPrice)}</div>}
              <strong className="display text-[19px] text-[#1E1D1B]" data-testid={`text-price-${product.id}`}>{formatPrice(product.price)}</strong>
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }} 
              data-testid={`button-add-cart-${product.id}`} 
              className="group flex h-9 items-center gap-1.5 rounded-full bg-[#D97757] px-3.5 text-[11px] font-bold text-[#FFFFFF] transition-all hover:bg-[#C85A32] active:scale-95 shadow-xs"
            >
              <Plus size={14} className="transition-transform group-hover:rotate-90" /> Adicionar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Header({ 
  cartCount, 
  favoriteCount, 
  onCart
}: { 
  cartCount: number; 
  favoriteCount: number; 
  onCart: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const jump = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E0D6] bg-[#FFFFFF]/90 backdrop-blur-md text-[#1E1D1B] shadow-2xs">
      <div className="gold-line h-0.5 w-full" />
      <div className="container-lucca flex h-[72px] items-center justify-between gap-5">
        <button type="button" onClick={() => jump('topo')} data-testid="button-logo-home" className="shrink-0 transition-opacity hover:opacity-90">
          <img src={logoPath} alt="Lucca Cell — assistência técnica e acessórios" className="h-[56px] w-[105px] object-contain object-left" />
        </button>
        <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[.14em] text-[#6E675D] md:flex">
          <button type="button" onClick={() => jump('catalogo')} data-testid="button-nav-catalogo" className="transition-colors hover:text-[#D97757]">Catálogo</button>
          <button type="button" onClick={() => jump('servicos')} data-testid="button-nav-servicos" className="transition-colors hover:text-[#D97757]">Serviços</button>
          <button type="button" onClick={() => jump('rodape')} data-testid="button-nav-contato" className="transition-colors hover:text-[#D97757]">A loja</button>
        </nav>
        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => jump('catalogo')} data-testid="button-header-search" aria-label="Buscar produtos" className="icon-button hidden h-9 w-9 items-center justify-center rounded-full border border-[#E0D8CC] text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#F7F3EC] sm:flex"><Search size={16} /></button>
          <button type="button" onClick={onCart} data-testid="button-open-cart-header" className="icon-button relative flex h-9 items-center gap-2 rounded-full border border-[#E0D8CC] px-3.5 text-[11px] font-bold text-[#1E1D1B] hover:bg-[#F7F3EC] hover:border-[#D97757]">
            <ShoppingBag size={15} /><span className="hidden sm:inline">Sacola</span>{cartCount > 0 && <b className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D97757] px-1 text-[9px] text-[#FFFFFF] font-black">{cartCount}</b>}
          </button>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" aria-label="Abrir menu" className="icon-button flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D8CC] text-[#6E675D] md:hidden">{menuOpen ? <X size={17} /> : <Menu size={17} />}</button>
        </div>
      </div>
      {menuOpen && <div className="animate-slide border-t border-[#E7E0D6] bg-[#FFFFFF] px-5 py-4 md:hidden shadow-md"><div className="container-lucca flex flex-col gap-4 text-[11px] font-bold uppercase tracking-[.14em] text-[#4F4941]"><button type="button" onClick={() => jump('catalogo')} data-testid="button-mobile-catalogo" className="text-left py-1 hover:text-[#D97757]">Catálogo</button><button type="button" onClick={() => jump('servicos')} data-testid="button-mobile-servicos" className="text-left py-1 hover:text-[#D97757]">Serviços</button><button type="button" onClick={() => jump('rodape')} data-testid="button-mobile-contato" className="text-left py-1 hover:text-[#D97757]">A loja</button><span className="text-[#D97757] pt-1">♡ {favoriteCount} favoritos salvos</span></div></div>}
    </header>
  );
}

function CartDrawer({ 
  open, 
  lines, 
  onClose, 
  onQuantity, 
  onRemove,
  onOpenReceipt 
}: { 
  open: boolean; 
  lines: CartLine[]; 
  onClose: () => void; 
  onQuantity: (index: number, delta: number) => void; 
  onRemove: (index: number) => void;
  onOpenReceipt: (data: ReceiptData) => void;
}) {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  
  const createReceiptPayload = (): ReceiptData => ({
    orderNumber: `LC-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    customerName: 'Cliente Balcão / WhatsApp',
    items: lines.map(l => ({
      name: l.product.name,
      quantity: l.quantity,
      price: l.product.price,
      color: l.selectedColor
    })),
    subtotal,
    deliveryFee: 0,
    discount: 0,
    total: subtotal,
    paymentMethod: 'A Combinar / Pix',
    isPickup: true
  });

  const handleFinishWhatsAppOrder = () => {
    const phone = '5597991554563';
    let text = `Olá, Lucca Cell! Gostaria de fazer o pedido pelo catálogo:\n\n`;
    lines.forEach(l => {
      const colorText = l.selectedColor ? ` (Cor: *${l.selectedColor}*)` : '';
      text += `• ${l.quantity}x ${l.product.name}${colorText} - ${formatPrice(l.product.price * l.quantity)}\n`;
    });
    text += `\n*Total: ${formatPrice(subtotal)}*\nRetirada na loja em Guajará - AM.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    
    // Abre a notinha térmica
    onOpenReceipt(createReceiptPayload());
  };

  const handleOpenDirectReceipt = () => {
    onOpenReceipt(createReceiptPayload());
  };

  return (
    <>
      <div className={`cart-backdrop fixed inset-0 z-50 bg-[#1E1D1B]/40 backdrop-blur-[2px] ${open ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'}`} onClick={onClose} aria-hidden="true" />
      <aside aria-label="Sua sacola" className={`cart-drawer fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[420px] flex-col bg-[#FFFFFF] text-[#1E1D1B] border-l border-[#E7E0D6] shadow-[0_0_40px_rgba(0,0,0,0.12)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="gold-line h-1 w-full" />
        <div className="flex items-center justify-between border-b border-[#EAE3D8] px-6 py-5">
          <div>
            <span className="eyebrow text-[#B05330]">Seu pedido</span>
            <h2 className="display mt-1 text-[25px] font-semibold text-[#1E1D1B]">Sua sacola <span className="text-[#8E8578]">({lines.reduce((n, l) => n + l.quantity, 0)})</span></h2>
          </div>
          <button type="button" onClick={onClose} data-testid="button-close-cart" aria-label="Fechar sacola" className="icon-button flex h-9 w-9 items-center justify-center rounded-full border border-[#E0D8CC] text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#F7F3EC]"><X size={17} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#FAF5EF] border border-[#F0E5D8] text-[#D97757]">
                <ShoppingBag size={28} strokeWidth={1.4} />
              </div>
              <h3 className="display text-[22px] text-[#1E1D1B]">Sua sacola está vazia</h3>
              <p className="mt-2 max-w-[240px] text-xs leading-relaxed text-[#787063]">Escolha algo para deixar seu aparelho mais protegido e preparado.</p>
              <button type="button" onClick={onClose} data-testid="button-empty-cart-continue" className="mt-6 rounded-full bg-[#D97757] px-5 py-2.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#C85A32] transition-colors shadow-xs">Ver produtos</button>
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={`${line.product.id}-${line.selectedColor || 'default'}-${idx}`} className="animate-slide flex gap-3 border border-[#EAE3D8] bg-[#FAF8F5] rounded-xl p-3">
                  <div className="h-[74px] w-[68px] shrink-0 overflow-hidden rounded-lg">
                    <ProductVisual product={line.product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-2">
                      <h3 className="display text-[14px] font-semibold leading-tight text-[#1E1D1B] truncate">{line.product.name}</h3>
                      <button type="button" onClick={() => onRemove(idx)} data-testid={`button-remove-cart-${line.product.id}`} aria-label={`Remover ${line.product.name}`} className="text-[#8E8578] hover:text-[#D93838]"><Trash2 size={15} /></button>
                    </div>
                    {line.selectedColor && (
                      <div className="mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#FAF2EB] px-2 py-0.5 text-[10px] font-extrabold text-[#D97757] border border-[#F0D5C7]">
                          🎨 Cor: {line.selectedColor}
                        </span>
                      </div>
                    )}
                    <p className="mt-1 text-[11px] text-[#6E675D]">{formatPrice(line.product.price)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-[#E0D8CC] bg-[#FFFFFF] px-2 py-0.5">
                        <button type="button" onClick={() => onQuantity(idx, -1)} data-testid={`button-decrease-cart-${line.product.id}`} aria-label="Diminuir quantidade" className="text-[#6E675D] hover:text-[#1E1D1B]"><Minus size={11} /></button>
                        <span className="w-3 text-center text-xs font-bold text-[#1E1D1B]">{line.quantity}</span>
                        <button type="button" onClick={() => onQuantity(idx, 1)} data-testid={`button-increase-cart-${line.product.id}`} aria-label="Aumentar quantidade" className="text-[#6E675D] hover:text-[#1E1D1B]"><Plus size={11} /></button>
                      </div>
                      <strong className="text-xs text-[#1E1D1B]">{formatPrice(line.product.price * line.quantity)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {lines.length > 0 && (
          <div className="border-t border-[#EAE3D8] bg-[#FAF8F5] px-6 pb-7 pt-5">
            <div className="mb-2 flex justify-between text-xs text-[#6E675D]">
              <span>Subtotal</span>
              <strong className="text-[#1E1D1B] text-sm">{formatPrice(subtotal)}</strong>
            </div>
            <div className="mb-5 flex justify-between text-xs text-[#6E675D]">
              <span>Retirada</span>
              <span className="font-bold text-[#2E7D32]">Loja Guajará · AM</span>
            </div>
            
            <div className="space-y-2.5">
              <button 
                type="button" 
                onClick={handleFinishWhatsAppOrder} 
                data-testid="button-finish-order" 
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D97757] py-3.5 text-xs font-extrabold text-[#FFFFFF] transition-colors hover:bg-[#C85A32] active:scale-95 shadow-sm"
              >
                Pedir pelo WhatsApp <ArrowRight size={15} />
              </button>

              <button 
                type="button" 
                onClick={handleOpenDirectReceipt} 
                data-testid="button-print-receipt" 
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FAF7F2] border border-[#E0D8CC] py-2.5 text-xs font-bold text-[#1E1D1B] transition-colors hover:bg-[#F0EAE1] active:scale-95 shadow-2xs"
              >
                <Printer size={15} className="text-[#D97757]" /> Imprimir Notinha (Epson TM-T20X)
              </button>
            </div>
            
            <p className="mt-3 text-center text-[10px] text-[#8E8578]">Envio direto para (97) 99155-4563 · retirada em loja</p>
          </div>
        )}
      </aside>
    </>
  );
}

import { 
  fetchProductsFromSupabase, 
  syncProductsToSupabase, 
  deleteProductFromSupabase 
} from '@/lib/supabase';

// Funções para a Busca Inteligente
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

const SMART_SYNONYMS: Record<string, string[]> = {
  capa: ['capinha', 'capinhas', 'case', 'cover', 'silicone', 'magsafe', 'couro'],
  capas: ['capinha', 'capinhas', 'case', 'cover', 'silicone'],
  capinha: ['capa', 'capinhas', 'case', 'cover', 'silicone', 'magsafe'],
  capinhas: ['capa', 'capinha', 'case', 'cover', 'silicone', 'magsafe'],
  case: ['capa', 'capinha', 'capinhas', 'cover'],
  cabo: ['cabos', 'carregador', 'carregadores', 'usb', 'usbc', 'lightning', 'fonte', 'tomada', 'turbo', 'tipo-c'],
  cabos: ['cabo', 'carregador', 'carregadores', 'usb', 'lightning', 'fonte', 'tomada'],
  carregador: ['cabo', 'cabos', 'fonte', 'tomada', 'turbo', 'inducao', 'magsafe', 'powerbank', 'bateria'],
  carregadores: ['cabo', 'cabos', 'fonte', 'tomada', 'turbo', 'inducao', 'powerbank'],
  fonte: ['carregador', 'carregadores', 'tomada', 'turbo', 'cabo'],
  fone: ['fones', 'audio', 'headphone', 'headset', 'earphone', 'airpod', 'airpods', 'bluetooth', 'som', 'sem fio'],
  fones: ['fone', 'audio', 'headphone', 'headset', 'airpods', 'bluetooth', 'som'],
  som: ['audio', 'fone', 'fones', 'caixa'],
  audio: ['fone', 'fones', 'headphone', 'headset', 'som'],
  pelicula: ['peliculas', 'protecao', 'vidro', '3d', 'privacidade', 'ceramica', 'camera', 'lente'],
  peliculas: ['pelicula', 'protecao', 'vidro', '3d', 'privacidade', 'ceramica'],
  protecao: ['pelicula', 'peliculas', 'vidro', 'blindagem', 'lente', 'camera'],
  tela: ['assistencia', 'display', 'touch', 'troca', 'conserto', 'reparo', 'vidro'],
  bateria: ['assistencia', 'troca', 'conserto', 'reparo', 'saude', 'carregamento'],
  conserto: ['assistencia', 'reparo', 'manutencao', 'tecnica', 'troca', 'orcamento'],
  reparo: ['assistencia', 'conserto', 'manutencao', 'tecnica', 'troca'],
  assistencia: ['conserto', 'reparo', 'manutencao', 'troca', 'tela', 'bateria', 'servico'],
  iphone: ['apple', 'ios', '11', '12', '13', '14', '15', '16', '17', 'pro', 'max', 'plus'],
  samsung: ['galaxy', 'android', 'a14', 'a15', 'a54', 'a55', 's23', 's24', 'ultra'],
  xiaomi: ['redmi', 'poco', 'note', 'pro']
};

function matchesSmartQuery(product: Product, searchTokens: string[]): boolean {
  if (searchTokens.length === 0) return true;

  const productSearchCorpus = normalizeText(
    `${product.name} ${product.category} ${product.description} ${product.tag || ''} ${product.visual}`
  );

  return searchTokens.every(token => {
    // 1. Verificação direta do termo ou prefixo
    if (productSearchCorpus.includes(token)) return true;

    // 2. Verificação por sinônimos inteligentes
    const synonyms = SMART_SYNONYMS[token] || [];
    for (const syn of synonyms) {
      if (productSearchCorpus.includes(syn)) return true;
    }

    // 3. Verificação aproximada (tolerância de digitação para termos com mais de 3 letras)
    if (token.length >= 4) {
      const wordsInProduct = productSearchCorpus.split(/\s+/);
      const isFuzzyMatch = wordsInProduct.some(w => {
        if (Math.abs(w.length - token.length) > 2) return false;
        return w.startsWith(token.slice(0, -1)) || token.startsWith(w.slice(0, -1));
      });
      if (isFuzzyMatch) return true;
    }

    return false;
  });
}

export function App() {
  const [productList, setProductList] = useState<Product[]>(() => AdminStore.getProducts());
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    const baseNames = ['Todos', ...CATEGORIAS_VALIDAS];
    const dynamicSet = new Set<string>(baseNames);
    productList.forEach(p => {
      if (p.category && typeof p.category === 'string' && p.category.trim() && p.category !== 'Todos') {
        dynamicSet.add(p.category.trim());
      }
    });

    return Array.from(dynamicSet).map(catName => {
      const icon = getCategoryIcon(catName);
      if (catName === 'Todos') {
        return {
          name: catName,
          icon,
          count: productList.length > 0 ? String(productList.length).padStart(2, '0') : undefined
        };
      }
      const count = productList.filter(p => p.category?.toLowerCase() === catName.toLowerCase()).length;
      return {
        name: catName,
        icon,
        count: count > 0 ? String(count).padStart(2, '0') : undefined
      };
    });
  }, [productList]);

  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const [dbProducts] = await Promise.all([
          fetchProductsFromSupabase(),
          AdminStore.loadSettingsFromCloud().catch(() => null)
        ]);
        if (Array.isArray(dbProducts) && dbProducts.length > 0) {
          setProductList(dbProducts);
          AdminStore.saveProducts(dbProducts);
        }
      } catch (err) {
        console.warn('[App] Erro ao sincronizar dados iniciais:', err);
      }
    }
    loadSupabaseData();
  }, []);

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [currentAdminUser, setCurrentAdminUser] = useState<AdminProfile | null>(null);

  useEffect(() => {
    // 1. Carregar usuário inicial
    getSupabaseUser().then(profile => {
      if (profile && profile.is_active) {
        setCurrentAdminUser(profile);
        setIsAdminLoggedIn(true);
      } else {
        setCurrentAdminUser(null);
        setIsAdminLoggedIn(false);
        setShowAdminPanel(false);
      }
    });

    // 2. Detectar se o usuário chegou por link de convite ou recuperação de senha
    const hash = window.location.hash;
    if (hash && (hash.includes('type=invite') || hash.includes('type=recovery') || hash.includes('access_token'))) {
      setIsSetPasswordModalOpen(true);
    }

    // 3. Listener de mudanças de estado de autenticação em tempo real
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsSetPasswordModalOpen(true);
      } else if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getSupabaseUser();
        if (profile && profile.is_active) {
          setCurrentAdminUser(profile);
          setIsAdminLoggedIn(true);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentAdminUser(null);
        setIsAdminLoggedIn(false);
        setShowAdminPanel(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Todos');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState('');
  const [sort, setSort] = useState('Destaques');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [activeReceiptData, setActiveReceiptData] = useState<ReceiptData | null>(null);

  // Solicitação de produtos para clientes
  const [isProductRequestModalOpen, setIsProductRequestModalOpen] = useState(false);
  const [productRequestInitialQuery, setProductRequestInitialQuery] = useState('');

  const handleOpenProductRequest = (initialText: string = '') => {
    setProductRequestInitialQuery(initialText || query);
    setIsProductRequestModalOpen(true);
  };

  // Modal de Escolha de Cor (Capinhas & Variantes)
  const [colorModalProduct, setColorModalProduct] = useState<Product | null>(null);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const rawTokens = normalizeText(query).split(/\s+/).filter(Boolean);
    const filtered = productList.filter((product) => {
      const matchesCategory = category === 'Todos' || product.category?.toLowerCase() === category.toLowerCase();
      const matchesQuery = matchesSmartQuery(product, rawTokens);
      return matchesCategory && matchesQuery;
    });
    if (sort === 'Menor preço') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'Maior avaliação') return [...filtered].sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [category, query, sort, productList]);

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  
  const toggleFavorite = (id: number) => {
    const product = productList.find((item) => item.id === id);
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    if (product) showToast(favorites.includes(id) ? 'Removido dos favoritos' : `${product.name} salvo nos favoritos`);
  };

  const addToCart = (product: Product) => {
    const isCaseOrHasColors = 
      product.category?.toLowerCase().includes('capa') || 
      (product.colors && product.colors.length > 0);

    if (isCaseOrHasColors) {
      setColorModalProduct(product);
      setIsColorModalOpen(true);
      return;
    }

    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id && !line.selectedColor);
      return found 
        ? current.map((line) => line.product.id === product.id && !line.selectedColor ? { ...line, quantity: line.quantity + 1 } : line) 
        : [...current, { product, quantity: 1 }];
    });
    showToast(`${product.name} foi para a sacola`);
  };

  const handleAddToCartWithColor = (product: Product, color: string, quantity: number) => {
    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id && line.selectedColor === color);
      return found
        ? current.map((line) => line.product.id === product.id && line.selectedColor === color ? { ...line, quantity: line.quantity + quantity } : line)
        : [...current, { product, quantity, selectedColor: color }];
    });
    showToast(`${product.name} (${color}) adicionado à sacola! ✨`);
  };

  const changeQuantity = (lineIndex: number, delta: number) => {
    setLines((current) => current.flatMap((line, idx) => {
      if (idx === lineIndex) {
        return line.quantity + delta > 0 ? [{ ...line, quantity: line.quantity + delta }] : [];
      }
      return [line];
    }));
  };

  const removeLine = (lineIndex: number) => {
    setLines((current) => current.filter((_, idx) => idx !== lineIndex));
  };
  const jumpToCatalog = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });

  // CRUD handlers para o AdminPanel com sincronização Supabase
  const handleAddProduct = async (newProd: Omit<Product, 'id' | 'rating' | 'reviews'>) => {
    const nextId = productList.length > 0 ? Math.max(...productList.map(p => p.id)) + 1 : 1;
    const fullProduct: Product = {
      ...newProd,
      id: nextId,
      rating: 5.0,
      reviews: 1
    };
    const updated = [fullProduct, ...productList];
    setProductList(updated);
    AdminStore.saveProducts(updated);
    const synced = await syncProductsToSupabase([fullProduct]);
    
    // Registrar log humanizado
    await logSecurityAction('PRODUCT_CREATED', 'products', {
      product_name: fullProduct.name,
      price: fullProduct.price,
      category: fullProduct.category
    }, currentAdminUser ? { name: currentAdminUser.name, role: currentAdminUser.role, email: currentAdminUser.email } : undefined);

    if (synced) {
      showToast(`Produto "${fullProduct.name}" cadastrado e salvo no banco! ✨`);
    } else {
      showToast(`Produto "${fullProduct.name}" cadastrado!`);
    }
  };

  const handleEditProduct = async (updatedProd: Product) => {
    const updated = productList.map(p => p.id === updatedProd.id ? updatedProd : p);
    setProductList(updated);
    AdminStore.saveProducts(updated);
    const synced = await syncProductsToSupabase([updatedProd]);

    // Registrar log humanizado
    await logSecurityAction('PRODUCT_UPDATED', 'products', {
      product_name: updatedProd.name,
      price: updatedProd.price,
      category: updatedProd.category
    }, currentAdminUser ? { name: currentAdminUser.name, role: currentAdminUser.role, email: currentAdminUser.email } : undefined);

    if (synced) {
      showToast(`Produto "${updatedProd.name}" atualizado no banco! ✨`);
    } else {
      showToast(`Produto "${updatedProd.name}" atualizado!`);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const deletedProduct = productList.find(p => p.id === id);
    const previous = [...productList];
    const updated = productList.filter(p => p.id !== id);
    setProductList(updated);
    AdminStore.saveProducts(updated);
    const deleted = await deleteProductFromSupabase(id);

    // Registrar log humanizado
    await logSecurityAction('PRODUCT_DELETED', 'products', {
      product_id: id,
      product_name: deletedProduct?.name || `Produto #${id}`
    }, currentAdminUser ? { name: currentAdminUser.name, role: currentAdminUser.role, email: currentAdminUser.email } : undefined);

    if (deleted) {
      showToast('Produto excluído com sucesso do banco de dados!');
    } else {
      setProductList(previous);
      AdminStore.saveProducts(previous);
      showToast('Falha ao excluir produto no banco.');
    }
  };

  const handleOpenAdmin = () => {
    if (isAdminLoggedIn && currentAdminUser && currentAdminUser.is_active) {
      setShowAdminPanel(true);
      setIsAdminLoginModalOpen(false);
    } else {
      setShowAdminPanel(false);
      setIsAdminLoginModalOpen(true);
    }
  };

  const [isNotFound, setIsNotFound] = useState(false);

  // Gerenciamento de rotas (Catálogo, Admin /natal e Erro 404)
  useEffect(() => {
    const handleRouteCheck = () => {
      const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
      const hash = window.location.hash.toLowerCase();
      const fullUrl = (pathname + hash + window.location.search).toLowerCase();

      // 1. Rota de administração /natal ou #natal
      if (fullUrl.includes('natal')) {
        setIsNotFound(false);
        handleOpenAdmin();
        return;
      }

      // 2. Rota principal válida
      if (pathname === '/' || pathname === '') {
        setIsNotFound(false);
      } else {
        // 3. Qualquer outra rota não reconhecida
        setIsNotFound(true);
      }
    };

    handleRouteCheck();
    window.addEventListener('hashchange', handleRouteCheck);
    window.addEventListener('popstate', handleRouteCheck);
    return () => {
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('popstate', handleRouteCheck);
    };
  }, [isAdminLoggedIn, currentAdminUser]);

  if (isNotFound) {
    return (
      <NotFoundPage
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          setIsNotFound(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div id="topo" className="catalog-shell bg-[#FAF7F2] text-[#1E1D1B]">
      <Header 
        cartCount={cartCount} 
        favoriteCount={favorites.length} 
        onCart={() => setCartOpen(true)}
      />

      {/* Render Admin Panel ONLY when authenticated and active */}
      {showAdminPanel && isAdminLoggedIn && currentAdminUser && currentAdminUser.is_active ? (
        <AdminPanel
          products={productList}
          currentUser={currentAdminUser}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onCloseAdmin={() => setShowAdminPanel(false)}
          onLogout={async () => {
            await signOutAdminFromSupabase();
            setIsAdminLoggedIn(false);
            setCurrentAdminUser(null);
            setShowAdminPanel(false);
            setIsAdminLoginModalOpen(false);
            showToast('Sessão encerrada com sucesso');
          }}
        />
      ) : (
        <main>
          {/* HERO SECTION */}
          <section className="hero-grid texture relative overflow-hidden text-[#1E1D1B]">
            <div className="hero-orb" />
            <div className="container-lucca relative grid min-h-[500px] items-center gap-10 py-14 md:grid-cols-[1.08fr_.92fr] md:py-20">
              <div className="max-w-[650px]">
                <h1 className="display animate-rise mt-2 max-w-[700px] text-[clamp(3.3rem,7vw,6.2rem)] font-semibold leading-[.92] text-[#1E1D1B]">
                  Tudo pro seu celular.<br /><span className="gold-text">E sem complicação.</span>
                </h1>
                <p className="animate-rise delay-1 mt-6 max-w-[520px] text-[15px] leading-relaxed text-[#6E675D]">
                  Tem acessório, tem proteção e, quando precisar, tem assistência também. Você compra online e pode retirar aqui na Lucca Cell.
                </p>
                <div className="animate-rise delay-2 mt-8 flex flex-wrap items-center gap-3">
                  <button 
                    type="button" 
                    onClick={jumpToCatalog} 
                    data-testid="button-hero-catalog" 
                    className="group flex items-center gap-2.5 rounded-full bg-[#D97757] px-6 py-3.5 text-xs font-extrabold text-[#FFFFFF] transition-all hover:bg-[#C85A32] active:scale-95 shadow-sm"
                  >
                    Ver produtos <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </button>
                  <a 
                    href="https://wa.me/5597991554563?text=Olá!%20Gostaria%20de%20falar%20com%20a%20assistência%20técnica."
                    target="_blank"
                    rel="noreferrer"
                    data-testid="button-hero-services" 
                    className="rounded-full border border-[#D9D0C3] bg-[#FFFFFF] px-5 py-3.5 text-xs font-bold text-[#4A443B] hover:border-[#D97757] hover:text-[#1E1D1B] transition-colors shadow-2xs"
                  >
                    Falar com a assistência
                  </a>
                </div>
                <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#7A7266]">
                  <span className="flex items-center gap-2 text-[#3D3830]"><ShieldCheck size={14} className="text-[#D97757]" /> GARANTIA LUCCA</span>
                  <span className="flex items-center gap-2 text-[#3D3830]"><Clock3 size={14} className="text-[#D97757]" /> ATENDIMENTO HUMANO</span>
                </div>
              </div>
              <div className="relative hidden min-h-[360px] items-center justify-center md:flex">
                <div className="absolute right-[5%] top-[10%] h-[280px] w-[280px] rounded-full bg-[#D97757] opacity-15 blur-[60px]" />
                <img 
                  src="https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-pro-17-pro-max-hero.png" 
                  alt="Aparelhos Lucca Cell" 
                  className="animate-rise delay-1 relative z-10 max-h-[340px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(217,119,87,0.22)] transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </section>

          {/* HIGHLIGHTS BAR */}
          <section className="border-y border-[#E7E0D6] bg-[#FFFFFF]">
            <div className="container-lucca grid gap-4 py-5 sm:grid-cols-3">
              <div className="flex items-center gap-3 border-[#EFE8DF] sm:border-r">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF4ED] border border-[#F0E4D5] text-[#D97757]">
                  <PackageCheck size={16} />
                </div>
                <div>
                  <strong className="block text-[12px] text-[#1E1D1B]">Retire na loja</strong>
                  <span className="text-[10px] text-[#736B60]">Rua Presidente Vargas, 021 - Centro</span>
                </div>
              </div>
              <div className="flex items-center gap-3 border-[#EFE8DF] sm:border-r sm:pl-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF4ED] border border-[#F0E4D5] text-[#D97757]">
                  <Wrench size={16} />
                </div>
                <div>
                  <strong className="block text-[12px] text-[#1E1D1B]">Suporte de verdade</strong>
                  <span className="text-[10px] text-[#736B60]">Diagnóstico claro e sem rodeios</span>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:pl-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF4ED] border border-[#F0E4D5] text-[#D97757]">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <strong className="block text-[12px] text-[#1E1D1B]">Garantia descomplicada</strong>
                  <span className="text-[10px] text-[#736B60]">Sem burocracia, direto no balcão</span>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIAS */}
          <section className="container-lucca py-14 sm:py-20">
            <div className="mb-7 flex items-end justify-between gap-5">
              <div>
                <span className="eyebrow text-[#B05330]">Navegação Rápida</span>
                <h2 className="display mt-2 text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-none text-[#1E1D1B]">
                  O que você precisa hoje?
                </h2>
              </div>
              <button 
                type="button" 
                onClick={jumpToCatalog} 
                data-testid="button-see-all-categories" 
                className="hidden items-center gap-2 text-xs font-bold text-[#B05330] hover:text-[#D97757] transition-colors sm:flex"
              >
                Ver tudo <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categories.map(({ name, count, icon: Icon }) => (
                <button 
                  type="button" 
                  key={name} 
                  onClick={() => { setCategory(name); jumpToCatalog(); }} 
                  data-testid={`button-category-${name.toLowerCase().replaceAll(' ', '-')}`} 
                  className={`filter-chip group flex min-h-[115px] flex-col justify-between rounded-[16px] border p-4 text-left ${
                    category === name 
                      ? 'border-[#D97757] bg-[#FDF7F3] text-[#933D20] shadow-xs' 
                      : 'border-[#E7E0D6] bg-[#FFFFFF] text-[#4F483F] hover:bg-[#FBF8F3] hover:text-[#1E1D1B]'
                  }`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${category === name ? 'bg-[#D97757] text-[#FFFFFF]' : 'bg-[#FAF4EC] text-[#B05330]'}`}>
                    <Icon size={15} />
                  </span>
                  <span>
                    <strong className="block text-[12px]">{name}</strong>
                    {count && <small className={`text-[10px] ${category === name ? 'text-[#B05330]' : 'text-[#8E8578]'}`}>{count} itens</small>}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* CATÁLOGO */}
          <section id="catalogo" className="border-t border-[#E7E0D6] bg-[#F7F3EC] py-14 sm:py-20">
            <div className="container-lucca">
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <span className="eyebrow text-[#B05330]">Catálogo Lucca Cell</span>
                  <h2 className="display mt-2 text-[clamp(2.1rem,4vw,3.4rem)] font-semibold leading-none text-[#1E1D1B]">
                    Peças que fazem <span className="gold-text">diferença.</span>
                  </h2>
                  <p className="mt-3 max-w-[530px] text-[13px] leading-relaxed text-[#6E675D]">
                    Curadoria de acessórios de alta qualidade para celulares e computadores em Guajará - AM.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label className="relative flex min-w-[260px] items-center">
                    <Search size={15} className="absolute left-3.5 text-[#8E8578]" />
                    <input 
                      type="search" 
                      value={query} 
                      onChange={(event) => setQuery(event.target.value)} 
                      data-testid="input-search-products" 
                      placeholder="Buscar capinha, cabo, película, tela..." 
                      className="h-11 w-full rounded-full border border-[#DED6CA] bg-[#FFFFFF] pl-10 pr-9 text-xs text-[#1E1D1B] outline-none transition-colors placeholder:text-[#8E8578] focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757] shadow-2xs" 
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        aria-label="Limpar busca"
                        className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF0E8] text-[#D97757] hover:bg-[#D97757] hover:text-white transition-colors"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <select 
                      value={sort} 
                      onChange={(event) => setSort(event.target.value)} 
                      data-testid="select-sort-products" 
                      className="h-11 w-full appearance-none rounded-full border border-[#DED6CA] bg-[#FFFFFF] px-4 pr-10 text-xs font-bold text-[#4A443B] outline-none focus:border-[#D97757] sm:w-[170px] shadow-2xs"
                    >
                      <option className="bg-[#FFFFFF] text-[#1E1D1B]">Destaques</option>
                      <option className="bg-[#FFFFFF] text-[#1E1D1B]">Menor preço</option>
                      <option className="bg-[#FFFFFF] text-[#1E1D1B]">Maior avaliação</option>
                    </select>
                    <ChevronDown size={14} className="pointer-events-none absolute right-4 top-3.5 text-[#8E8578]" />
                  </div>
                </div>
              </div>

              <div className="mb-7 flex items-center justify-between gap-3 flex-wrap">
                <button 
                  type="button" 
                  onClick={() => setMobileFilters(!mobileFilters)} 
                  data-testid="button-mobile-filters" 
                  className="flex items-center gap-2 rounded-full border border-[#DED6CA] bg-[#FFFFFF] px-4 py-2.5 text-xs font-bold text-[#4A443B] lg:hidden shadow-2xs"
                >
                  <Menu size={14} /> Filtros {category !== 'Todos' && <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />}
                </button>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-[#736B60]">
                    <strong className="text-[#1E1D1B]">{filteredProducts.length}</strong> produtos encontrados
                  </p>
                  <button 
                    type="button" 
                    onClick={() => handleOpenProductRequest()} 
                    className="flex items-center gap-1.5 text-xs font-bold text-[#D97757] hover:text-[#B05330] transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} />
                    <span>Não achou seu produto? Peça aqui</span>
                  </button>
                </div>
                <span className="hidden items-center gap-1.5 text-[10px] uppercase tracking-[.1em] text-[#7A7266] sm:flex">
                  <ShieldCheck size={13} className="text-[#D97757]" /> Seleção Lucca Cell
                </span>
              </div>

              {/* Mobile Filter Sheet */}
              <div className={`${mobileFilters ? 'block' : 'hidden'} mb-5 rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-4 lg:hidden shadow-xs`}>
                <p className="eyebrow mb-3 text-[#B05330]">Filtrar por categoria</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(({ name }) => (
                    <button 
                      type="button" 
                      key={name} 
                      onClick={() => { setCategory(name); setMobileFilters(false); }} 
                      data-testid={`button-mobile-filter-${name.toLowerCase().replaceAll(' ', '-')}`} 
                      className={`rounded-full border px-3 py-2 text-[11px] font-bold transition-colors ${
                        category === name 
                          ? 'border-[#D97757] bg-[#D97757] text-[#FFFFFF]' 
                          : 'border-[#E2DAD0] bg-[#FAF8F5] text-[#5C554B]'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-7 lg:grid-cols-[200px_1fr]">
                <aside className="hidden lg:block">
                  <div className="sticky top-24 rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-4 shadow-xs">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="eyebrow text-[#B05330]">Categorias</span>
                      <SlidersHorizontal size={14} className="text-[#8E8578]" />
                    </div>
                    <div className="space-y-1">
                      {categories.map(({ name, count, icon: Icon }) => (
                        <button 
                          type="button" 
                          key={name} 
                          onClick={() => setCategory(name)} 
                          data-testid={`button-sidebar-${name.toLowerCase().replaceAll(' ', '-')}`} 
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[11px] font-medium transition-colors ${
                            category === name 
                              ? 'bg-[#FDF7F3] border border-[#F3D7C9] font-bold text-[#B05330]' 
                              : 'text-[#5C554B] hover:bg-[#FAF6F0] hover:text-[#1E1D1B]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5"><Icon size={14} />{name}</span>
                          {count && <span className="font-mono text-[9px] text-[#8E8578]">{count}</span>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-6 border-t border-[#F0EAE0] pt-5">
                      <p className="eyebrow text-[#B05330]">Atendimento</p>
                      <p className="mt-2 text-[11px] leading-relaxed text-[#736B60]">Precisa de suporte ou orçamento? Fale direto no balcão.</p>
                      <a 
                        href="https://wa.me/5597991554563"
                        target="_blank"
                        rel="noreferrer"
                        data-testid="button-sidebar-whatsapp" 
                        className="mt-3 flex items-center gap-2 text-[11px] font-bold text-[#B05330] hover:text-[#D97757] transition-colors"
                      >
                        <MessageCircle size={14} /> Chamar (97) 99155-4563
                      </a>
                    </div>
                  </div>
                </aside>

                <div>
                  {filteredProducts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredProducts.map((product, index) => (
                        <div key={product.id} style={{ animationDelay: `${index * 45}ms` }}>
                          <ProductCard 
                            product={product} 
                            favorite={favorites.includes(product.id)} 
                            onFavorite={() => toggleFavorite(product.id)} 
                            onAdd={() => addToCart(product)} 
                            onOpenDetails={() => setSelectedProduct(product)}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DED6CA] bg-[#FFFFFF] p-8 text-center shadow-xs animate-fadeIn">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#FAF4ED] border border-[#F0E5D8] text-[#D97757]">
                        <Search size={24} />
                      </div>
                      <h3 className="display text-[22px] font-bold text-[#1E1D1B]">Nenhum produto encontrado</h3>
                      <p className="mt-2 max-w-[380px] text-xs leading-relaxed text-[#736B60]">
                        {query ? (
                          <>
                            Não encontrou <strong className="text-[#1E1D1B] font-bold">&ldquo;{query}&rdquo;</strong> no estoque atual? Nossa equipe busca com os fornecedores para você!
                          </>
                        ) : (
                          'Tente buscar com outros termos ou limpe os filtros selecionados.'
                        )}
                      </p>
                      
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <button 
                          type="button" 
                          onClick={() => handleOpenProductRequest(query)} 
                          data-testid="button-request-product-empty" 
                          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D97757] to-[#C85A32] px-6 py-3 text-xs font-extrabold text-[#FFFFFF] hover:opacity-95 shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                        >
                          <Sparkles size={15} />
                          Pedir o produto que você quer
                        </button>

                        <button 
                          type="button" 
                          onClick={() => { setQuery(''); setCategory('Todos'); }} 
                          data-testid="button-clear-filters" 
                          className="rounded-full border border-[#DED6CA] bg-[#FAF8F5] px-5 py-3 text-xs font-bold text-[#6E675D] hover:bg-[#F2ECE4] hover:text-[#1E1D1B] transition-colors cursor-pointer"
                        >
                          Limpar filtros
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex items-center justify-between rounded-2xl bg-[#FFFFFF] border border-[#E7E0D6] px-5 py-4 text-[#1E1D1B] sm:px-7 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#FAF4ED] border border-[#F0E4D5] text-[#D97757] sm:flex">
                        <Sparkles size={16} />
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#6E675D]">
                        <strong className="text-[#1E1D1B]">Separamos seu pedido na loja.</strong> <span className="hidden sm:inline">Reserve online e retire sem filas em Guajará - AM.</span>
                      </p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setCartOpen(true)} 
                      data-testid="button-open-cart-catalog" 
                      className="flex shrink-0 items-center gap-2 text-[11px] font-extrabold text-[#D97757] hover:text-[#C85A32]"
                    >
                      Ver sacola <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SERVIÇOS */}
          <section id="servicos" className="bg-[#FAF4EC] border-t border-[#E7E0D6] py-16 text-[#1E1D1B] sm:py-20">
            <div className="container-lucca grid gap-10 md:grid-cols-[.85fr_1.15fr] md:items-center">
              <div>
                <span className="eyebrow text-[#B05330]">Além do balcão</span>
                <h2 className="display mt-3 text-[clamp(2.1rem,4vw,3.8rem)] font-semibold leading-[.94]">
                  Quando dá problema, <span className="gold-text">a gente resolve.</span>
                </h2>
                <p className="mt-5 max-w-[410px] text-sm leading-relaxed text-[#6E675D]">
                  Seu celular ou computador com suporte técnico qualificado em Guajará. Diagnóstico claro, peças testadas e atendimento transparente.
                </p>
                <a 
                  href="https://wa.me/5597991554563?text=Olá!%20Gostaria%20de%20agendar%20uma%20avaliação%20técnica."
                  target="_blank"
                  rel="noreferrer"
                  data-testid="button-book-service" 
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#D97757] px-6 py-3.5 text-xs font-extrabold text-[#FFFFFF] hover:bg-[#C85A32] transition-colors shadow-sm"
                >
                  Agendar avaliação <ArrowRight size={15} />
                </a>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-5 shadow-xs">
                  <Wrench className="mb-6 text-[#D97757]" size={22} />
                  <h3 className="display text-[20px] text-[#1E1D1B]">Diagnóstico transparente</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#736B60]">Você entende exatamente o que aconteceu e aprova o orçamento antes de qualquer intervenção.</p>
                </div>
                <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:translate-y-6 shadow-xs">
                  <CircleCheck className="mb-6 text-[#D97757]" size={22} />
                  <h3 className="display text-[20px] text-[#1E1D1B]">Cuidado em cada detalhe</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#736B60]">Componentes selecionados, ferramentas adequadas e a mesma dedicação para qualquer conserto.</p>
                </div>
                <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-5 shadow-xs">
                  <Truck className="mb-6 text-[#D97757]" size={22} />
                  <h3 className="display text-[20px] text-[#1E1D1B]">Retirada facilitada</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#736B60]">Escolha seus acessórios pelo catálogo e retire no balcão da loja em Guajará - AM.</p>
                </div>
                <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:translate-y-6 shadow-xs">
                  <Heart className="mb-6 text-[#D97757]" size={22} />
                  <h3 className="display text-[20px] text-[#1E1D1B]">Pós-atendimento próximo</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#736B60]">Nossa parceria continua após o serviço. Conte conosco sempre que precisar.</p>
                </div>
              </div>
            </div>
          </section>

          {/* RODAPÉ / LOCALIZAÇÃO */}
          <section id="rodape" className="bg-[#FFFFFF] border-t border-[#E7E0D6] py-14 sm:py-20">
            <div className="container-lucca grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-end">
              <div>
                <span className="eyebrow text-[#B05330]">Por perto é melhor</span>
                <h2 className="display mt-3 max-w-[600px] text-[clamp(2.2rem,5vw,4.4rem)] font-semibold leading-[.9] text-[#1E1D1B]">
                  Tecnologia boa tem <span className="gold-text">endereço.</span>
                </h2>
                <p className="mt-5 max-w-[440px] text-sm leading-relaxed text-[#6E675D]">
                  Uma loja física para resolver urgências, garantir os melhores acessórios e ter um atendimento acolhedor de verdade.
                </p>
              </div>
              <div className="rounded-2xl border border-[#E7E0D6] bg-[#FAF8F5] p-6 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAF4ED] border border-[#F0E4D5] text-[#D97757]">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <strong className="block text-sm text-[#1E1D1B]">Loucas Por Esmaltes & Lucca Cell</strong>
                    <p className="mt-1 text-xs leading-relaxed text-[#6E675D]">
                      Rua Presidente Vargas, 021 - Centro, Guajará - AM, 69895-000<br />
                      Telefone / WhatsApp: (97) 99155-4563<br />
                      Seg a Sex, 8h às 18h · Sáb, 8h às 13h
                    </p>
                  </div>
                </div>
                <a 
                  href="https://wa.me/5597991554563"
                  target="_blank"
                  rel="noreferrer"
                  data-testid="button-store-directions" 
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#D97757] py-3 text-xs font-extrabold text-[#FFFFFF] hover:bg-[#C85A32] transition-colors shadow-xs"
                >
                  Falar no WhatsApp (97) 99155-4563 <MessageCircle size={15} />
                </a>
              </div>
            </div>
            <div className="container-lucca mt-14 border-t border-[#EAE3D8] pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <img src={logoPath} alt="Lucca Cell" className="h-[52px] w-[100px] object-contain object-left" />
                <div className="text-[10px] text-[#8E8578]">© 2026 Loucas Por Esmaltes & Lucca Cell · Assistência técnica & acessórios · Guajará - AM</div>
                <div className="flex gap-4 text-[#6E675D]">
                  <a href="https://wa.me/5597991554563" target="_blank" rel="noreferrer" data-testid="button-footer-whatsapp" aria-label="WhatsApp" className="hover:text-[#D97757] transition-colors"><MessageCircle size={16} /></a>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {toast && <div role="status" data-testid="status-toast" className="toast-pop fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1E1D1B] border border-[#3E3932] px-4 py-3 text-xs font-bold text-[#FFFFFF] shadow-[0_10px_25px_rgba(0,0,0,.18)]"><Check size={15} className="text-[#D97757]" /> {toast}</div>}
      
      {/* Modal de Detalhes do Produto / Ver Imagem Completa */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        onFavorite={toggleFavorite}
        isFavorite={selectedProduct ? favorites.includes(selectedProduct.id) : false}
      />

      <CartDrawer 
        open={cartOpen} 
        lines={lines} 
        onClose={() => setCartOpen(false)} 
        onQuantity={changeQuantity} 
        onRemove={removeLine}
        onOpenReceipt={setActiveReceiptData}
      />

      {/* Modal de Notinha Térmica Epson TM-T20X */}
      <ThermalReceiptModal
        isOpen={Boolean(activeReceiptData)}
        onClose={() => setActiveReceiptData(null)}
        receiptData={activeReceiptData}
      />

      {/* Admin Auth Modal (Login + Criar Conta) */}
      <AdminAuthModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => {
          setIsAdminLoginModalOpen(false);
          if (!isAdminLoggedIn || !currentAdminUser) {
            setShowAdminPanel(false);
          }
        }}
        onLoginSuccess={(profile) => {
          setCurrentAdminUser(profile);
          setIsAdminLoggedIn(true);
          setIsAdminLoginModalOpen(false);
          setShowAdminPanel(true);
          showToast(`Bem-vindo, ${profile.name.split(' ')[0]} (${profile.role.toUpperCase()})!`);
        }}
      />

      {/* Modal de Criação / Definição de Senha para Convidado */}
      <AdminSetPasswordModal
        isOpen={isSetPasswordModalOpen}
        onClose={() => setIsSetPasswordModalOpen(false)}
        onPasswordSetSuccess={(profile) => {
          setCurrentAdminUser(profile);
          setIsAdminLoggedIn(true);
          setIsSetPasswordModalOpen(false);
          setShowAdminPanel(true);
          showToast(`Senha criada com sucesso! Bem-vindo à equipe, ${profile.name}! ✨`);
        }}
      />

      {/* Modal de Escolha de Cor para Capinhas e Variantes */}
      <ProductColorModal
        isOpen={isColorModalOpen}
        product={colorModalProduct}
        onClose={() => {
          setIsColorModalOpen(false);
          setColorModalProduct(null);
        }}
        onAddToCartWithColor={handleAddToCartWithColor}
      />

      {/* Modal de Solicitação de Produtos para Clientes */}
      <ProductRequestModal
        isOpen={isProductRequestModalOpen}
        onClose={() => setIsProductRequestModalOpen(false)}
        initialProductName={productRequestInitialQuery}
        onRequestSubmitted={() => {
          showToast('Solicitação enviada com sucesso! Entraremos em contato.');
        }}
      />
    </div>
  );
}

function Root() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><ErrorBoundary><App /></ErrorBoundary><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default Root;