import { type LucideIcon, ArrowRight, BatteryCharging, Cable, Check, ChevronDown, CircleCheck, Clock3, Headphones, Heart, Laptop, MapPin, Menu, MessageCircle, Minus, PackageCheck, Plus, RotateCcw, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Smartphone, Sparkles, Star, Tablet, Trash2, Truck, Wrench, X, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import logoPath from '@assets/LOGO_1_1786564407567.png';

const queryClient = new QueryClient();

type Category = 'Todos' | 'Capinhas' | 'Cabos e carregadores' | 'Áudio' | 'Proteção' | 'Assistência';
type Product = {
  id: number;
  name: string;
  category: Exclude<Category, 'Todos'>;
  price: number;
  oldPrice?: number;
  installment: string;
  rating: number;
  reviews: number;
  tag?: string;
  description: string;
  visual: 'phone' | 'cable' | 'audio' | 'shield' | 'battery' | 'laptop' | 'tablet' | 'repair';
  tone: string;
};
type CartLine = { product: Product; quantity: number };

const categories: { name: Category; count?: string; icon: LucideIcon }[] = [
  { name: 'Todos', icon: Sparkles },
  { name: 'Capinhas', count: '24', icon: Smartphone },
  { name: 'Cabos e carregadores', count: '18', icon: Zap },
  { name: 'Áudio', count: '12', icon: Headphones },
  { name: 'Proteção', count: '09', icon: ShieldCheck },
  { name: 'Assistência', count: '06', icon: Wrench },
];

const products: Product[] = [
  { id: 1, name: 'Capa Armor MagSafe', category: 'Capinhas', price: 89.9, oldPrice: 109.9, installment: '3x de R$ 29,97', rating: 4.9, reviews: 38, tag: 'Mais pedido', description: 'Proteção firme, toque macio e alinhamento perfeito para carregamento sem fio.', visual: 'phone', tone: 'linear-gradient(135deg,#29251f,#bd7824)' },
  { id: 2, name: 'Cabo Nylon Turbo 2m', category: 'Cabos e carregadores', price: 54.9, installment: '2x de R$ 27,45', rating: 4.8, reviews: 27, tag: 'Novo', description: 'Resistente para a rotina, com carga rápida e acabamento trançado premium.', visual: 'cable', tone: 'linear-gradient(145deg,#e9d6a5,#fbf5df)' },
  { id: 3, name: 'Fone Pulse TWS', category: 'Áudio', price: 149.9, oldPrice: 179.9, installment: '4x de R$ 37,48', rating: 4.7, reviews: 51, tag: 'Oferta', description: 'Som encorpado, estojo compacto e bateria para acompanhar o seu dia.', visual: 'audio', tone: 'linear-gradient(140deg,#20201e,#5d5b55)' },
  { id: 4, name: 'Película 3D Privacidade', category: 'Proteção', price: 39.9, installment: 'à vista ou 2x', rating: 4.9, reviews: 64, tag: 'Instalação grátis', description: 'Privacidade de lado a lado e proteção contra riscos sem perder a nitidez.', visual: 'shield', tone: 'linear-gradient(135deg,#d4d9d7,#f7fbfa)' },
  { id: 5, name: 'Carregador GaN 33W', category: 'Cabos e carregadores', price: 119.9, installment: '3x de R$ 39,97', rating: 4.8, reviews: 19, tag: 'Mais pedido', description: 'Potência inteligente em um corpo pequeno para sua mochila e sua mesa.', visual: 'battery', tone: 'linear-gradient(135deg,#f2c85b,#f7eac0)' },
  { id: 6, name: 'Capa Soft Touch Urban', category: 'Capinhas', price: 69.9, installment: '2x de R$ 34,95', rating: 4.6, reviews: 22, description: 'Minimalista por fora, absorção de impacto por dentro. Feita para usar muito.', visual: 'tablet', tone: 'linear-gradient(135deg,#d96131,#edac54)' },
  { id: 7, name: 'Headphone Studio Lite', category: 'Áudio', price: 229.9, installment: '5x de R$ 45,98', rating: 4.8, reviews: 17, tag: 'Som imersivo', description: 'Conforto de longa duração e graves presentes para trabalho, estudo ou lazer.', visual: 'laptop', tone: 'linear-gradient(135deg,#d3c4ab,#f4eee1)' },
  { id: 8, name: 'Kit Reparo Express', category: 'Assistência', price: 79.9, installment: '2x de R$ 39,95', rating: 5, reviews: 12, tag: 'Lucca recomenda', description: 'Diagnóstico, limpeza de conectores e revisão essencial para o seu aparelho.', visual: 'repair', tone: 'linear-gradient(135deg,#22201d,#4e3e2b)' },
];

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function ProductVisual({ product }: { product: Product }) {
  const icons: Record<Product['visual'], LucideIcon> = {
    phone: Smartphone, cable: Cable, audio: Headphones, shield: ShieldCheck,
    battery: BatteryCharging, laptop: Laptop, tablet: Tablet, repair: Wrench,
  };
  const Icon = icons[product.visual];
  return (
    <div className="product-visual relative flex h-[206px] items-center justify-center overflow-hidden rounded-[14px] sm:h-[220px]" style={{ background: product.tone }}>
      <span className="shine" />
      <div className="absolute left-4 top-4 rounded-full bg-[#f8f1de]/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-[#3a2b1c]">
        {product.category}
      </div>
      <div className={`relative flex items-center justify-center ${product.visual === 'phone' ? 'h-[152px] w-[78px] rounded-[17px] border-[5px] border-[#b9b6af] bg-[#262523] shadow-[12px_14px_0_rgba(0,0,0,.16)]' : product.visual === 'cable' ? 'h-[132px] w-[132px] rounded-full border-[11px] border-[#3b3c39] border-t-transparent' : product.visual === 'shield' ? 'h-[144px] w-[116px] rounded-[20px] border border-white/60 bg-white/30 shadow-inner' : 'h-[116px] w-[142px] rounded-[34px] bg-black/75 shadow-[10px_14px_0_rgba(0,0,0,.15)]'}`}>
        <Icon size={product.visual === 'phone' ? 28 : 42} strokeWidth={1.5} className={product.visual === 'phone' || product.visual === 'laptop' || product.visual === 'audio' || product.visual === 'repair' ? 'text-[#f4b52e]' : 'text-[#5b4c34]'} />
        {product.visual === 'phone' && <span className="absolute bottom-2 h-1 w-5 rounded-full bg-[#aaa79e]" />}
      </div>
      <span className="absolute bottom-3 right-4 font-mono text-[10px] tracking-[.14em] text-black/45">LC / {String(product.id).padStart(2, '0')}</span>
    </div>
  );
}

function ProductCard({ product, favorite, onFavorite, onAdd }: { product: Product; favorite: boolean; onFavorite: () => void; onAdd: () => void }) {
  return (
    <article className="product-card animate-rise rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-2.5" data-testid={`card-product-${product.id}`}>
      <div className="relative">
        <ProductVisual product={product} />
        <button type="button" onClick={onFavorite} aria-label={favorite ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`} data-testid={`button-favorite-${product.id}`} className={`icon-button absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border ${favorite ? 'border-[#f4b52e] bg-[#f4b52e] text-[#271d15]' : 'border-white/50 bg-[#271d15]/65 text-[#fff8e9]'} backdrop-blur-sm`}>
          <Heart size={16} fill={favorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="px-2 pb-2 pt-4">
        <div className="mb-1 flex min-h-[18px] items-center gap-2">
          {product.tag && <span className="rounded-full bg-[#f5e1a9] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.1em] text-[#74501b]">{product.tag}</span>}
        </div>
        <h3 className="display text-[18px] font-semibold leading-tight text-[#241c16]" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 min-h-[36px] text-[11px] leading-relaxed text-[#776f64]">{product.description}</p>
        <div className="mt-3 flex items-center gap-1 text-[11px] text-[#956c27]"><Star size={12} fill="currentColor" /><strong>{product.rating.toFixed(1)}</strong><span className="text-[#9b9285]">({product.reviews})</span></div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            {product.oldPrice && <div className="text-[10px] text-[#9b9285] line-through">{formatPrice(product.oldPrice)}</div>}
            <strong className="display text-[20px] text-[#241c16]" data-testid={`text-price-${product.id}`}>{formatPrice(product.price)}</strong>
          </div>
          <button type="button" onClick={onAdd} data-testid={`button-add-cart-${product.id}`} className="group flex h-9 items-center gap-1.5 rounded-full bg-[#211b17] px-3.5 text-[11px] font-bold text-[#fff7e6] transition-colors hover:bg-[#d97621]">
            <Plus size={14} className="transition-transform group-hover:rotate-90" /> Adicionar
          </button>
        </div>
      </div>
    </article>
  );
}

function Header({ cartCount, favoriteCount, onCart }: { cartCount: number; favoriteCount: number; onCart: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const jump = (id: string) => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <header className="relative z-20 border-b border-[#2b241e] bg-[#171411] text-[#fff8e8]">
      <div className="gold-line h-1 w-full" />
      <div className="container-lucca flex h-[76px] items-center justify-between gap-5">
        <button type="button" onClick={() => jump('topo')} data-testid="button-logo-home" className="shrink-0">
          <img src={logoPath} alt="Lucca Cell — assistência técnica e acessórios" className="h-[62px] w-[112px] object-contain object-center" />
        </button>
        <nav className="hidden items-center gap-8 text-[11px] font-bold uppercase tracking-[.14em] text-[#c9bdad] md:flex">
          <button type="button" onClick={() => jump('catalogo')} data-testid="button-nav-catalogo" className="transition-colors hover:text-[#ffd35a]">Catálogo</button>
          <button type="button" onClick={() => jump('servicos')} data-testid="button-nav-servicos" className="transition-colors hover:text-[#ffd35a]">Serviços</button>
          <button type="button" onClick={() => jump('rodape')} data-testid="button-nav-contato" className="transition-colors hover:text-[#ffd35a]">A loja</button>
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => jump('catalogo')} data-testid="button-header-search" aria-label="Buscar produtos" className="icon-button hidden h-10 w-10 items-center justify-center rounded-full border border-[#45382c] text-[#dbcdb9] hover:bg-[#2b241e] sm:flex"><Search size={17} /></button>
          <button type="button" onClick={onCart} data-testid="button-open-cart-header" className="icon-button relative flex h-10 items-center gap-2 rounded-full border border-[#45382c] px-3 text-[11px] font-bold text-[#fff4dd] hover:bg-[#2b241e]">
            <ShoppingBag size={17} /><span className="hidden sm:inline">Sacola</span>{cartCount > 0 && <b className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f4b52e] px-1 text-[10px] text-[#211b17]">{cartCount}</b>}
          </button>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-mobile-menu" aria-label="Abrir menu" className="icon-button flex h-10 w-10 items-center justify-center rounded-full border border-[#45382c] text-[#dbcdb9] md:hidden">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      {menuOpen && <div className="animate-slide border-t border-[#33291f] bg-[#211b17] px-5 py-4 md:hidden"><div className="container-lucca flex flex-col gap-4 text-[11px] font-bold uppercase tracking-[.14em] text-[#e9d9be]"><button type="button" onClick={() => jump('catalogo')} data-testid="button-mobile-catalogo" className="text-left">Catálogo</button><button type="button" onClick={() => jump('servicos')} data-testid="button-mobile-servicos" className="text-left">Serviços</button><button type="button" onClick={() => jump('rodape')} data-testid="button-mobile-contato" className="text-left">A loja</button><span className="text-[#e2a733]">♡ {favoriteCount} favoritos salvos</span></div></div>}
    </header>
  );
}

function CartDrawer({ open, lines, onClose, onQuantity, onRemove }: { open: boolean; lines: CartLine[]; onClose: () => void; onQuantity: (id: number, delta: number) => void; onRemove: (id: number) => void }) {
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return (
    <>
      <div className={`cart-backdrop fixed inset-0 z-40 bg-[#171411]/55 backdrop-blur-[2px] ${open ? 'visible opacity-100' : 'pointer-events-none invisible opacity-0'}`} onClick={onClose} aria-hidden="true" />
      <aside aria-label="Sua sacola" className={`cart-drawer fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[420px] flex-col bg-[#fffaf0] shadow-[-18px_0_45px_rgba(38,24,9,.18)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="gold-line h-1.5 w-full" />
        <div className="flex items-center justify-between border-b border-[#e4d9c8] px-6 py-5"><div><span className="eyebrow text-[#9a6a25]">Seu pedido</span><h2 className="display mt-1 text-[27px] font-semibold text-[#241c16]">Sua sacola <span className="text-[#a28d73]">({lines.reduce((n, l) => n + l.quantity, 0)})</span></h2></div><button type="button" onClick={onClose} data-testid="button-close-cart" aria-label="Fechar sacola" className="icon-button flex h-9 w-9 items-center justify-center rounded-full border border-[#d9cdbb] text-[#5d5044] hover:bg-[#f0e6d3]"><X size={17} /></button></div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#f3e7c9] text-[#b37b23]"><ShoppingBag size={31} strokeWidth={1.4} /></div><h3 className="display text-[23px] text-[#32251b]">Sua sacola está leve</h3><p className="mt-2 max-w-[240px] text-xs leading-relaxed text-[#85786a]">Escolha algo para deixar seu aparelho mais protegido e preparado.</p><button type="button" onClick={onClose} data-testid="button-empty-cart-continue" className="mt-6 rounded-full bg-[#211b17] px-5 py-2.5 text-xs font-bold text-[#fff6e6] hover:bg-[#dc7622]">Ver produtos</button></div> : <div className="space-y-4">{lines.map((line) => <div key={line.product.id} className="animate-slide flex gap-3 border-b border-[#e6dccd] pb-4"><div className="h-[76px] w-[70px] shrink-0"><ProductVisual product={line.product} /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><h3 className="display text-[15px] font-semibold leading-tight text-[#34271d]">{line.product.name}</h3><button type="button" onClick={() => onRemove(line.product.id)} data-testid={`button-remove-cart-${line.product.id}`} aria-label={`Remover ${line.product.name}`} className="text-[#a99b89] hover:text-[#c6522b]"><Trash2 size={15} /></button></div><p className="mt-1 text-[11px] text-[#8d7e6d]">{formatPrice(line.product.price)}</p><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-3 rounded-full border border-[#daccb8] px-2 py-1"><button type="button" onClick={() => onQuantity(line.product.id, -1)} data-testid={`button-decrease-cart-${line.product.id}`} aria-label="Diminuir quantidade"><Minus size={12} /></button><span className="w-3 text-center text-xs font-bold">{line.quantity}</span><button type="button" onClick={() => onQuantity(line.product.id, 1)} data-testid={`button-increase-cart-${line.product.id}`} aria-label="Aumentar quantidade"><Plus size={12} /></button></div><strong className="text-sm text-[#3b2c20]">{formatPrice(line.product.price * line.quantity)}</strong></div></div></div>)}</div>}
        </div>
        {lines.length > 0 && <div className="border-t border-[#dfd3c0] bg-[#f7efdf] px-6 pb-7 pt-5"><div className="mb-2 flex justify-between text-xs text-[#766b5c]"><span>Subtotal</span><strong className="text-[#2e241c]">{formatPrice(subtotal)}</strong></div><div className="mb-5 flex justify-between text-xs text-[#766b5c]"><span>Entrega</span><span className="font-bold text-[#4c7a4b]">A calcular no balcão</span></div><button type="button" onClick={() => window.alert('Pedido demo pronto para retirada na loja.')} data-testid="button-finish-order" className="flex w-full items-center justify-center gap-2 rounded-full bg-[#dc7622] py-3.5 text-sm font-extrabold text-[#fff8e9] transition-colors hover:bg-[#b95720]">Continuar pedido <ArrowRight size={16} /></button><p className="mt-3 text-center text-[10px] text-[#958572]">Compra demonstrativa · retirada em loja ou combine pelo WhatsApp</p></div>}
      </aside>
    </>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Todos');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [sort, setSort] = useState('Destaques');
  const [mobileFilters, setMobileFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    const filtered = products.filter((product) => {
      const matchesCategory = category === 'Todos' || product.category === category;
      const matchesQuery = !normalized || `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase('pt-BR').includes(normalized);
      return matchesCategory && matchesQuery;
    });
    if (sort === 'Menor preço') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'Maior avaliação') return [...filtered].sort((a, b) => b.rating - a.rating);
    return filtered;
  }, [category, query, sort]);

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  const toggleFavorite = (id: number) => {
    const product = products.find((item) => item.id === id);
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    if (product) showToast(favorites.includes(id) ? 'Removido dos favoritos' : `${product.name} salvo nos favoritos`);
  };
  const addToCart = (product: Product) => {
    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id);
      return found ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { product, quantity: 1 }];
    });
    showToast(`${product.name} foi para a sacola`);
  };
  const changeQuantity = (id: number, delta: number) => setLines((current) => current.flatMap((line) => line.product.id === id ? (line.quantity + delta > 0 ? [{ ...line, quantity: line.quantity + delta }] : []) : [line]));
  const removeLine = (id: number) => setLines((current) => current.filter((line) => line.product.id !== id));
  const jumpToCatalog = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div id="topo" className="catalog-shell bg-[#f4efe5] text-[#241c16]">
      <Header cartCount={cartCount} favoriteCount={favorites.length} onCart={() => setCartOpen(true)} />
      <main>
        <section className="hero-grid texture relative overflow-hidden text-[#fff8e9]">
          <div className="hero-orb" />
          <div className="container-lucca relative grid min-h-[510px] items-center gap-10 py-14 md:grid-cols-[1.08fr_.92fr] md:py-20">
            <div className="max-w-[650px]">
              <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-[#67502d] bg-[#2b231c] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-[#f6c64c]"><span className="h-1.5 w-1.5 animate-[pulse-dot_2s_ease-in-out_infinite] rounded-full bg-[#e99c28]" /> Catálogo da loja · Campo Grande, MS</div>
              <h1 className="display animate-rise delay-1 mt-7 max-w-[700px] text-[clamp(3.45rem,7vw,6.7rem)] font-semibold leading-[.9]">Seu tech, <span className="gold-text">bem cuidado.</span></h1>
              <p className="animate-rise delay-2 mt-7 max-w-[500px] text-[15px] leading-relaxed text-[#cfc0aa]">Acessórios que acompanham seu ritmo e assistência técnica de verdade, feita perto de você. Escolha online, retire na Lucca Cell.</p>
              <div className="animate-rise delay-3 mt-8 flex flex-wrap items-center gap-3"><button type="button" onClick={jumpToCatalog} data-testid="button-hero-catalog" className="group flex items-center gap-3 rounded-full bg-[#f4b52e] px-5 py-3 text-xs font-extrabold text-[#2a1d13] transition-colors hover:bg-[#ffce57]">Explorar catálogo <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></button><button type="button" onClick={() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' })} data-testid="button-hero-services" className="rounded-full border border-[#69543c] px-5 py-3 text-xs font-bold text-[#e8d9bf] hover:border-[#eab23d] hover:text-[#ffd45e]">Conheça a assistência</button></div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-bold uppercase tracking-[.12em] text-[#a9977c]"><span className="flex items-center gap-2"><ShieldCheck size={14} className="text-[#eeb23c]" /> Garantia Lucca</span><span className="flex items-center gap-2"><Clock3 size={14} className="text-[#eeb23c]" /> Atendimento humano</span></div>
            </div>
            <div className="relative hidden min-h-[330px] items-center justify-center md:flex">
              <div className="absolute right-[7%] top-[12%] h-[255px] w-[255px] rounded-full bg-[#ed9827] opacity-20 blur-[55px]" />
              <div className="relative h-[280px] w-[280px] rotate-6 rounded-[38px] border border-[#6e5935] bg-[#29211a] p-5 shadow-[20px_25px_0_rgba(0,0,0,.22)]">
                <div className="flex h-full flex-col justify-between rounded-[25px] border border-[#735b34] bg-[#1d1916] p-5">
                  <div className="flex items-center justify-between"><span className="eyebrow text-[#d7ad55]">Lucca / 24</span><Sparkles size={19} className="text-[#f3bd38]" /></div>
                  <div className="flex items-center justify-center"><div className="flex h-[130px] w-[76px] rotate-[-10deg] items-center justify-center rounded-[17px] border-[4px] border-[#c8c5bc] bg-[#10100f] shadow-[9px_12px_0_rgba(237,153,32,.28)]"><Smartphone size={30} className="text-[#efb735]" /><span className="absolute bottom-2 h-1 w-4 rounded-full bg-[#a8a59c]" /></div></div>
                  <div><p className="display text-[23px] text-[#fff4dc]">Pronto para<br /><span className="gold-text">voltar a funcionar.</span></p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#dfd4c2] bg-[#eaddc0]">
          <div className="container-lucca grid gap-4 py-5 sm:grid-cols-3">
            <div className="flex items-center gap-3 border-[#cdbb9f] sm:border-r"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6edda] text-[#ba7521]"><PackageCheck size={17} /></div><div><strong className="block text-[12px]">Retire na loja</strong><span className="text-[10px] text-[#76634e]">Pedido separado com carinho</span></div></div>
            <div className="flex items-center gap-3 border-[#cdbb9f] sm:border-r sm:pl-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6edda] text-[#ba7521]"><Wrench size={17} /></div><div><strong className="block text-[12px]">Suporte de verdade</strong><span className="text-[10px] text-[#76634e]">A gente resolve junto</span></div></div>
            <div className="flex items-center gap-3 sm:pl-5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6edda] text-[#ba7521]"><RotateCcw size={17} /></div><div><strong className="block text-[12px]">Troca facilitada</strong><span className="text-[10px] text-[#76634e]">Sem complicação, sem letra miúda</span></div></div>
          </div>
        </section>

        <section className="container-lucca py-14 sm:py-20">
          <div className="mb-7 flex items-end justify-between gap-5"><div><span className="eyebrow text-[#9c6d28]">Escolha seu caminho</span><h2 className="display mt-2 text-[clamp(2rem,4vw,3.3rem)] font-semibold leading-none text-[#2a2018]">O que você precisa hoje?</h2></div><button type="button" onClick={jumpToCatalog} data-testid="button-see-all-categories" className="hidden items-center gap-2 text-xs font-bold text-[#b46222] hover:text-[#7e431d] sm:flex">Ver tudo <ArrowRight size={15} /></button></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{categories.map(({ name, count, icon: Icon }) => <button type="button" key={name} onClick={() => { setCategory(name); jumpToCatalog(); }} data-testid={`button-category-${name.toLowerCase().replaceAll(' ', '-')}`} className={`filter-chip group flex min-h-[120px] flex-col justify-between rounded-[16px] border p-4 text-left ${category === name ? 'border-[#d99527] bg-[#e8b448] text-[#2b2016]' : 'border-[#dfd4c2] bg-[#faf7f0] text-[#3c3025] hover:bg-[#f4e8ce]'}`}><span className={`flex h-8 w-8 items-center justify-center rounded-full ${category === name ? 'bg-[#f9e5a5]' : 'bg-[#eee4d2] text-[#a8702d]'}`}><Icon size={16} /></span><span><strong className="block text-[12px]">{name}</strong>{count && <small className={`text-[10px] ${category === name ? 'text-[#72521f]' : 'text-[#9d907e]'}`}>{count} itens</small>}</span></button>)}</div>
        </section>

        <section id="catalogo" className="border-t border-[#e1d6c5] bg-[#eee5d6] py-14 sm:py-20">
          <div className="container-lucca">
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><span className="eyebrow text-[#9c6d28]">Catálogo Lucca Cell</span><h2 className="display mt-2 text-[clamp(2.2rem,4vw,3.6rem)] font-semibold leading-none text-[#2a2018]">Peças que fazem <span className="gold-text">diferença.</span></h2><p className="mt-3 max-w-[530px] text-[13px] leading-relaxed text-[#776b5d]">Curadoria de acessórios bons de usar, com a confiança de quem também coloca a mão na massa.</p></div><div className="flex flex-col gap-3 sm:flex-row"><label className="relative flex min-w-[260px] items-center"><Search size={16} className="absolute left-3.5 text-[#9c8d7b]" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-search-products" placeholder="Buscar produto ou categoria" className="h-11 w-full rounded-full border border-[#d5c7b2] bg-[#faf7f0] pl-10 pr-4 text-xs outline-none transition-colors placeholder:text-[#a79b8b] focus:border-[#d69028] focus:ring-2 focus:ring-[#e3ae4d]/25" /></label><div className="relative"><select value={sort} onChange={(event) => setSort(event.target.value)} data-testid="select-sort-products" className="h-11 w-full appearance-none rounded-full border border-[#d5c7b2] bg-[#faf7f0] px-4 pr-10 text-xs font-bold text-[#4c3b2c] outline-none focus:border-[#d69028] sm:w-[170px]"><option>Destaques</option><option>Menor preço</option><option>Maior avaliação</option></select><ChevronDown size={15} className="pointer-events-none absolute right-4 top-3.5 text-[#856d52]" /></div></div></div>
            <div className="mb-7 flex items-center justify-between gap-3"><button type="button" onClick={() => setMobileFilters(!mobileFilters)} data-testid="button-mobile-filters" className="flex items-center gap-2 rounded-full border border-[#d5c7b2] bg-[#faf7f0] px-4 py-2.5 text-xs font-bold text-[#4c3b2c] lg:hidden"><Menu size={15} /> Filtros {category !== 'Todos' && <span className="h-1.5 w-1.5 rounded-full bg-[#df7623]" />}</button><p className="text-xs text-[#877a6b]"><strong className="text-[#433528]">{filteredProducts.length}</strong> produtos encontrados</p><span className="hidden items-center gap-1 text-[10px] uppercase tracking-[.1em] text-[#92795a] sm:flex"><ShieldCheck size={13} /> Seleção Lucca Cell</span></div>
            <div className={`${mobileFilters ? 'block' : 'hidden'} mb-5 rounded-2xl border border-[#d8c9b5] bg-[#f9f4ea] p-4 lg:hidden`}><p className="eyebrow mb-3 text-[#9b6b27]">Filtrar por categoria</p><div className="flex flex-wrap gap-2">{categories.map(({ name }) => <button type="button" key={name} onClick={() => { setCategory(name); setMobileFilters(false); }} data-testid={`button-mobile-filter-${name.toLowerCase().replaceAll(' ', '-')}`} className={`rounded-full border px-3 py-2 text-[11px] font-bold ${category === name ? 'border-[#d99527] bg-[#efbd50] text-[#332417]' : 'border-[#ded1bd] bg-[#fffaf2] text-[#716455]'}`}>{name}</button>)}</div></div>
            <div className="grid gap-7 lg:grid-cols-[190px_1fr]">
              <aside className="hidden lg:block"><div className="sticky top-5 rounded-2xl border border-[#dbcfbe] bg-[#f8f3e8] p-4"><div className="mb-4 flex items-center justify-between"><span className="eyebrow text-[#987040]">Categorias</span><SlidersHorizontal size={15} className="text-[#9b7750]" /></div><div className="space-y-1">{categories.map(({ name, count, icon: Icon }) => <button type="button" key={name} onClick={() => setCategory(name)} data-testid={`button-sidebar-${name.toLowerCase().replaceAll(' ', '-')}`} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-left text-[11px] transition-colors ${category === name ? 'bg-[#edc267] font-extrabold text-[#332417]' : 'text-[#76695a] hover:bg-[#efe2cc]'}`}><span className="flex items-center gap-2"><Icon size={14} />{name}</span>{count && <span className="font-mono text-[9px] opacity-70">{count}</span>}</button>)}</div><div className="mt-6 border-t border-[#dfd1bb] pt-5"><p className="eyebrow text-[#987040]">Na loja</p><p className="mt-2 text-[11px] leading-relaxed text-[#807262]">Precisa de ajuda para escolher? Fale com quem entende.</p><button type="button" onClick={() => window.alert('WhatsApp demo: atendimento Lucca Cell')} data-testid="button-sidebar-whatsapp" className="mt-3 flex items-center gap-2 text-[11px] font-extrabold text-[#bd5e22]"><MessageCircle size={14} /> Chamar no WhatsApp</button></div></div></aside>
              <div>{filteredProducts.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product, index) => <div key={product.id} style={{ animationDelay: `${index * 55}ms` }}><ProductCard product={product} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onAdd={() => addToCart(product)} /></div>)}</div> : <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[20px] border border-dashed border-[#cbbda9] bg-[#f8f3e8] px-6 text-center"><div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#ecdfc5] text-[#b47328]"><Search size={25} /></div><h3 className="display text-[25px] text-[#362a20]">Nada por aqui, ainda.</h3><p className="mt-2 max-w-[340px] text-xs leading-relaxed text-[#817567]">Tente outro termo ou limpe os filtros para encontrar o acessório certo.</p><button type="button" onClick={() => { setQuery(''); setCategory('Todos'); }} data-testid="button-clear-filters" className="mt-5 rounded-full bg-[#211b17] px-5 py-2.5 text-xs font-bold text-[#fff5e5]">Limpar filtros</button></div>}<div className="mt-8 flex items-center justify-between rounded-2xl bg-[#211b17] px-5 py-4 text-[#fff7e6] sm:px-7"><div className="flex items-center gap-3"><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#f3bb3b] text-[#2b2016] sm:flex"><Sparkles size={17} /></div><p className="text-[11px] leading-relaxed text-[#d8c8af]"><strong className="text-[#fff3d8]">Achou o que queria?</strong> <span className="hidden sm:inline">Separamos para você e avisamos quando estiver pronto.</span></p></div><button type="button" onClick={() => setCartOpen(true)} data-testid="button-open-cart-catalog" className="flex shrink-0 items-center gap-2 text-[11px] font-extrabold text-[#f3bd3c]">Ver sacola <ArrowRight size={14} /></button></div></div>
            </div>
          </div>
        </section>

        <section id="servicos" className="bg-[#211b17] py-16 text-[#fff7e6] sm:py-20">
          <div className="container-lucca grid gap-10 md:grid-cols-[.85fr_1.15fr] md:items-center"><div><span className="eyebrow text-[#e6aa32]">Além do balcão</span><h2 className="display mt-3 text-[clamp(2.2rem,4vw,4rem)] font-semibold leading-[.94]">Quando dá problema, <span className="gold-text">a gente resolve.</span></h2><p className="mt-5 max-w-[410px] text-sm leading-relaxed text-[#bdaE98]">Seu aparelho não precisa virar uma dor de cabeça. A equipe Lucca faz diagnóstico claro, serviço cuidadoso e explica tudo sem enrolação.</p><button type="button" onClick={() => window.alert('WhatsApp demo: agendamento de assistência')} data-testid="button-book-service" className="mt-7 flex items-center gap-2 rounded-full bg-[#f4b52e] px-5 py-3 text-xs font-extrabold text-[#261c14] hover:bg-[#ffd35d]">Agendar avaliação <ArrowRight size={15} /></button></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-[#4b3927] bg-[#2c241d] p-5"><Wrench className="mb-7 text-[#f4b52e]" size={23} /><h3 className="display text-[21px]">Diagnóstico sem surpresa</h3><p className="mt-2 text-xs leading-relaxed text-[#bcae98]">Você entende o que aconteceu e recebe o orçamento antes de qualquer reparo.</p></div><div className="rounded-2xl border border-[#4b3927] bg-[#2c241d] p-5 sm:translate-y-7"><CircleCheck className="mb-7 text-[#f4b52e]" size={23} /><h3 className="display text-[21px]">Cuidado em cada detalhe</h3><p className="mt-2 text-xs leading-relaxed text-[#bcae98]">Peças selecionadas, bancada organizada e a mesma atenção para um cabo ou uma tela.</p></div><div className="rounded-2xl border border-[#4b3927] bg-[#2c241d] p-5"><Truck className="mb-7 text-[#f4b52e]" size={23} /><h3 className="display text-[21px]">Retire do seu jeito</h3><p className="mt-2 text-xs leading-relaxed text-[#bcae98]">Compra online, retirada rápida no endereço da loja em Campo Grande.</p></div><div className="rounded-2xl border border-[#4b3927] bg-[#2c241d] p-5 sm:translate-y-7"><Heart className="mb-7 text-[#f4b52e]" size={23} /><h3 className="display text-[21px]">Pós-venda próximo</h3><p className="mt-2 text-xs leading-relaxed text-[#bcae98]">A conversa continua depois da compra. Se precisar, chama a gente.</p></div></div></div>
        </section>

        <section id="rodape" className="bg-[#f4efe5] py-14 sm:py-20"><div className="container-lucca grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-end"><div><span className="eyebrow text-[#a3712c]">Por perto é melhor</span><h2 className="display mt-3 max-w-[600px] text-[clamp(2.3rem,5vw,4.7rem)] font-semibold leading-[.9] text-[#2c2118]">Tecnologia boa tem <span className="gold-text">endereço.</span></h2><p className="mt-5 max-w-[440px] text-sm leading-relaxed text-[#776b5c]">Uma loja local para resolver o que é urgente, encontrar o que faltava e sair com a sensação de que foi bem atendido.</p></div><div className="rounded-2xl border border-[#dfd1bc] bg-[#fbf8f0] p-5"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f1d58e] text-[#89591e]"><MapPin size={17} /></div><div><strong className="block text-sm">Lucca Cell · Campo Grande</strong><p className="mt-1 text-xs leading-relaxed text-[#817464]">Rua das Acácias, 238 · Jardim dos Estados<br />Seg a Sex, 8h às 18h · Sáb, 8h às 13h</p></div></div><button type="button" onClick={() => window.alert('WhatsApp demo: como chegar na Lucca Cell')} data-testid="button-store-directions" className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#211b17] py-3 text-xs font-extrabold text-[#fff5e6] hover:bg-[#d87522]">Falar com a loja <MessageCircle size={15} /></button></div></div><div className="container-lucca mt-14 border-t border-[#ded2c1] pt-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><img src={logoPath} alt="Lucca Cell" className="h-[72px] w-[130px] object-contain object-left" /><div className="text-[10px] text-[#9b8b79]">© 2024 Lucca Cell · Assistência técnica & acessórios</div><div className="flex gap-4 text-[#776b5c]"><button type="button" onClick={() => window.alert('Instagram demo')} data-testid="button-footer-instagram" aria-label="Instagram"><span className="text-xs font-bold">IG</span></button><button type="button" onClick={() => window.alert('WhatsApp demo')} data-testid="button-footer-whatsapp" aria-label="WhatsApp"><MessageCircle size={16} /></button></div></div></div></section>
      </main>
      {toast && <div role="status" data-testid="status-toast" className="toast-pop fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#211b17] px-4 py-3 text-xs font-bold text-[#fff7e6] shadow-[0_10px_25px_rgba(41,25,8,.24)]"><Check size={15} className="text-[#f3bd3c]" /> {toast}</div>}
      <CartDrawer open={cartOpen} lines={lines} onClose={() => setCartOpen(false)} onQuantity={changeQuantity} onRemove={removeLine} />
    </div>
  );
}

function Root() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><ErrorBoundary><App /></ErrorBoundary><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default Root;