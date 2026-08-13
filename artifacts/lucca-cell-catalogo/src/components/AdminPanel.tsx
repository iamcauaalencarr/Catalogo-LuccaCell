import React, { useState } from 'react';
import { 
  Plus, Edit, Trash2, ShieldCheck, Package, DollarSign, Tag, Star, 
  ArrowLeft, Search, Check, X, Sparkles, AlertTriangle, Eye, Layers, Wrench, Camera
} from 'lucide-react';
import { AIVisionModal } from '@/components/AIVisionModal';
import { ScannedProductData } from '@/services/openrouter';

export type Category = 'Todos' | 'Capinhas' | 'Cabos e carregadores' | 'Áudio' | 'Proteção' | 'Assistência';

export type Product = {
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
  image?: string;
};

interface AdminPanelProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onCloseAdmin: () => void;
}

export function AdminPanel({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onCloseAdmin
}: AdminPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  
  // Modal de IA e Formulário
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    category: Exclude<Category, 'Todos'>;
    price: string;
    oldPrice: string;
    installment: string;
    tag: string;
    description: string;
    visual: Product['visual'];
    tone: string;
    image: string;
  }>({
    name: '',
    category: 'Capinhas',
    price: '',
    oldPrice: '',
    installment: '',
    tag: '',
    description: '',
    visual: 'phone',
    tone: 'linear-gradient(135deg,#29251f,#bd7824)',
    image: ''
  });

  const openNewProductForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Capinhas',
      price: '',
      oldPrice: '',
      installment: '3x sem juros',
      tag: 'Novo',
      description: '',
      visual: 'phone',
      tone: 'linear-gradient(135deg,#29251f,#bd7824)',
      image: ''
    });
    setIsFormOpen(true);
  };

  const handleApplyAIData = (aiData: ScannedProductData) => {
    setEditingProduct(null);
    const priceVal = aiData.price ?? 0;
    setFormData({
      name: aiData.name ?? '',
      category: aiData.category ?? 'Capinhas',
      price: priceVal > 0 ? String(priceVal) : '',
      oldPrice: aiData.oldPrice ? String(aiData.oldPrice) : '',
      installment: aiData.installment ?? (priceVal > 0 ? `3x de R$ ${(priceVal / 3).toFixed(2)}` : ''),
      tag: aiData.tag ?? '',
      description: aiData.description ?? '',
      visual: aiData.visual ?? 'phone',
      tone: aiData.tone ?? 'linear-gradient(135deg,#29251f,#bd7824)',
      image: aiData.image ?? ''
    });
    setIsFormOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      installment: product.installment || '',
      tag: product.tag || '',
      description: product.description || '',
      visual: product.visual,
      tone: product.tone || 'linear-gradient(135deg,#29251f,#bd7824)',
      image: product.image || ''
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price.replace(',', '.'));
    const oldPriceNum = formData.oldPrice ? parseFloat(formData.oldPrice.replace(',', '.')) : undefined;

    if (!formData.name || isNaN(priceNum)) {
      alert('Por favor, preencha o nome e um preço válido.');
      return;
    }

    if (editingProduct) {
      onEditProduct({
        ...editingProduct,
        name: formData.name,
        category: formData.category,
        price: priceNum,
        oldPrice: oldPriceNum,
        installment: formData.installment || `3x de R$ ${(priceNum / 3).toFixed(2)}`,
        tag: formData.tag || undefined,
        description: formData.description,
        visual: formData.visual,
        tone: formData.tone,
        image: formData.image || undefined
      });
    } else {
      onAddProduct({
        name: formData.name,
        category: formData.category,
        price: priceNum,
        oldPrice: oldPriceNum,
        installment: formData.installment || `3x de R$ ${(priceNum / 3).toFixed(2)}`,
        tag: formData.tag || undefined,
        description: formData.description,
        visual: formData.visual,
        tone: formData.tone,
        image: formData.image || undefined
      });
    }

    setIsFormOpen(false);
  };

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const totalValue = products.reduce((acc, p) => acc + p.price, 0);
  const featuredCount = products.filter(p => Boolean(p.tag)).length;

  return (
    <div className="min-h-screen bg-[#f4efe5] text-[#241c16] pb-20">
      
      {/* Top Admin Header Bar */}
      <div className="border-b border-[#2b241e] bg-[#171411] text-[#fff8e8]">
        <div className="gold-line h-1 w-full" />
        <div className="container-lucca flex h-[76px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4b52e]/20 text-[#f4b52e] border border-[#f4b52e]/40">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#fff8e8] font-['Outfit']">
                  PAINEL ADMINISTRATIVO
                </span>
                <span className="bg-[#f4b52e] text-[#211b17] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Modo Admin
                </span>
              </div>
              <p className="text-[11px] text-[#bcae98]">Gestão de Produtos, Estoque e Preços</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAIModalOpen(true)}
              className="flex items-center gap-2 rounded-full border border-[#f4b52e]/80 bg-[#2b231c] px-4 py-2 text-xs font-extrabold text-[#f4b52e] hover:bg-[#f4b52e] hover:text-[#211b17] transition-all shadow-sm"
              title="Cadastrar produto automaticamente enviando uma foto"
            >
              <Sparkles size={16} />
              <span>Cadastrar com IA</span>
            </button>

            <button
              onClick={openNewProductForm}
              className="flex items-center gap-2 rounded-full bg-[#f4b52e] px-4 py-2 text-xs font-extrabold text-[#261c14] hover:bg-[#ffce57] transition-all shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Produto</span>
            </button>

            <button
              onClick={onCloseAdmin}
              className="flex items-center gap-1.5 rounded-full border border-[#69543c] px-4 py-2 text-xs font-bold text-[#e8d9bf] hover:bg-[#2b241e] hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Site</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container-lucca pt-8 space-y-8">
        
        {/* KPI Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#887864] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total de Produtos</span>
              <Package size={20} className="text-[#d97621]" />
            </div>
            <div className="text-2xl font-extrabold text-[#241c16] font-['Outfit']">
              {products.length} <span className="text-xs font-normal text-[#887864]">itens cadastrados</span>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#887864] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Valor do Catálogo</span>
              <DollarSign size={20} className="text-[#2e7d32]" />
            </div>
            <div className="text-2xl font-extrabold text-[#241c16] font-['Outfit']">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#887864] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Itens com Tag</span>
              <Tag size={20} className="text-[#d97621]" />
            </div>
            <div className="text-2xl font-extrabold text-[#241c16] font-['Outfit']">
              {featuredCount} <span className="text-xs font-normal text-[#887864]">com destaque/oferta</span>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-5 shadow-xs">
            <div className="flex items-center justify-between text-[#887864] mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avaliação Média</span>
              <Star size={20} className="text-[#f4b52e]" />
            </div>
            <div className="text-2xl font-extrabold text-[#241c16] font-['Outfit']">
              4.9 <span className="text-xs font-normal text-[#887864]">⭐ de satisfação</span>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#fbf8f0] p-4 rounded-[18px] border border-[#dfd5c5]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#887864]" size={16} />
            <input
              type="text"
              placeholder="Buscar por nome do produto ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-full border border-[#d5c7b2] bg-[#f4efe5] pl-10 pr-4 text-xs outline-none focus:border-[#d69028]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(['Todos', 'Capinhas', 'Cabos e carregadores', 'Áudio', 'Proteção', 'Assistência'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#211b17] text-[#fff7e6]'
                    : 'bg-[#eee5d6] text-[#6e6153] hover:bg-[#dfd5c5]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table Grid */}
        <div className="rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-[#dfd5c5] flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#241c16] font-['Outfit']">
              Lista de Produtos ({filtered.length})
            </h3>
            <button
              onClick={openNewProductForm}
              className="flex items-center gap-1.5 text-xs font-extrabold text-[#d97621] hover:text-[#211b17]"
            >
              <Plus size={14} /> Adicionar Novo
            </button>
          </div>

          {filtered.length > 0 ? (
            <div className="divide-y divide-[#e6dccd]">
              {filtered.map((p) => (
                <div key={p.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f4efe5]/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 rounded-xl border border-[#d5c7b2] overflow-hidden shrink-0 flex items-center justify-center p-0.5 bg-[#171411]" style={{ background: p.image ? '#171411' : p.tone }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs font-bold text-white text-center line-clamp-1 p-1">{p.visual}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#eee5d6] text-[#74501b]">
                          {p.category}
                        </span>
                        {p.tag && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5e1a9] text-[#74501b]">
                            {p.tag}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-[#241c16] truncate font-['Outfit']">{p.name}</h4>
                      <p className="text-xs text-[#776f64] line-clamp-1">{p.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#e6dccd]">
                    <div className="text-right">
                      {p.oldPrice && (
                        <span className="text-[11px] text-[#9b9285] line-through block">
                          R$ {p.oldPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="font-extrabold text-base text-[#241c16] font-['Outfit']">
                        R$ {p.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditProductForm(p)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d5c7b2] text-[#6e6153] hover:bg-[#211b17] hover:text-[#f4b52e] hover:border-[#211b17] transition-all"
                        title="Editar Produto"
                      >
                        <Edit size={15} />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir "${p.name}"?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                        title="Excluir Produto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-[#887864]">
              <Package size={40} className="mx-auto mb-3 opacity-50" />
              <p className="font-bold text-sm text-[#241c16]">Nenhum produto encontrado</p>
              <p className="text-xs text-[#887864] mt-1">Tente ajustar a busca ou adicionar novos itens.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Formulário (Criar / Editar Produto) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-[#171411]/75 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />

          <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-[#4b3927] bg-[#211b17] text-[#fff7e6] shadow-[0_25px_60px_rgba(0,0,0,0.5)] z-10 animate-rise max-h-[90vh] flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#d97621] via-[#f4b52e] to-[#e99c28]" />

            <div className="flex items-center justify-between border-b border-[#3e3226] px-6 py-4">
              <h3 className="font-extrabold text-lg text-[#fff4dc] font-['Outfit']">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#45382c] text-[#bcae98] hover:bg-[#2b241e]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Foto de Capa do Produto */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  Foto de Capa do Produto
                </label>
                {formData.image ? (
                  <div className="relative h-36 w-full rounded-xl overflow-hidden border border-[#45382c] bg-[#171411]">
                    <img src={formData.image} alt="Preview Capa" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-red-600 transition-colors"
                      title="Remover foto"
                    >
                      <X size={14} />
                    </button>
                    <span className="absolute bottom-2 left-2 rounded-full bg-[#f4b52e] px-2 py-0.5 text-[9px] font-extrabold text-[#211b17]">
                      Foto da IA / Câmera
                    </span>
                  </div>
                ) : (
                  <label className="flex h-20 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#45382c] bg-[#171411] text-xs text-[#8d7e6d] hover:border-[#f4b52e] hover:text-[#fff4dc] transition-all">
                    <Camera size={18} />
                    <span>Upload de Foto de Capa (Opcional)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setFormData({ ...formData, image: reader.result as string });
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Capa MagSafe Armor iPhone 15"
                  className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] placeholder:text-[#6e6153] outline-none focus:border-[#f4b52e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as Exclude<Category, 'Todos'> })}
                    className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  >
                    <option value="Capinhas">Capinhas</option>
                    <option value="Cabos e carregadores">Cabos e carregadores</option>
                    <option value="Áudio">Áudio</option>
                    <option value="Proteção">Proteção</option>
                    <option value="Assistência">Assistência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Visual do Ícone
                  </label>
                  <select
                    value={formData.visual}
                    onChange={e => setFormData({ ...formData, visual: e.target.value as Product['visual'] })}
                    className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  >
                    <option value="phone">Smartphone</option>
                    <option value="cable">Cabo Turbo</option>
                    <option value="audio">Áudio / Fone</option>
                    <option value="shield">Proteção / Película</option>
                    <option value="battery">Carregador / Bateria</option>
                    <option value="tablet">Tablet / Capa</option>
                    <option value="laptop">Notebook / Studio</option>
                    <option value="repair">Assistência / Reparo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Preço (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="89.90"
                    className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Preço Antigo (R$) (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.oldPrice}
                    onChange={e => setFormData({ ...formData, oldPrice: e.target.value })}
                    placeholder="109.90"
                    className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Tag Promocional
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={e => setFormData({ ...formData, tag: e.target.value })}
                    placeholder="Ex: Mais pedido, Oferta, Novo"
                    className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Condição de Parcela
                  </label>
                  <input
                    type="text"
                    value={formData.installment}
                    onChange={e => setFormData({ ...formData, installment: e.target.value })}
                    placeholder="Ex: 3x de R$ 29,97"
                    className="h-10 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  Descrição do Produto *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva as principais qualidades e especificações do produto..."
                  className="w-full rounded-xl border border-[#45382c] bg-[#171411] p-3 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#3e3226]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full border border-[#69543c] px-5 py-2.5 text-xs font-bold text-[#e8d9bf] hover:border-[#eab23d]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#f4b52e] px-6 py-2.5 text-xs font-extrabold text-[#261c14] hover:bg-[#ffce57]"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cadastro por Foto com IA */}
      <AIVisionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApplyAIData={handleApplyAIData}
      />
    </div>
  );
}

