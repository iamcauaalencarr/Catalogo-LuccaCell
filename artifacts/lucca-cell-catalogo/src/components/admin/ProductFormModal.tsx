import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  DollarSign, 
  Package, 
  Layers, 
  Tag, 
  Sparkles, 
  Search, 
  Check, 
  Camera, 
  HelpCircle,
  FolderTree,
  Eye,
  Sliders
} from 'lucide-react';
import { Product, DynamicCategory, ProductVariant, ProductStatus, ProductVisual } from '@/types/admin';
import { compressImageForAI, getModelDisplayName, getSelectedOpenRouterModel } from '@/services/openrouter';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: DynamicCategory[];
  onSave: (productData: any) => Promise<void> | void;
  onOpenAIModal?: () => void;
}

export function ProductFormModal({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  onOpenAIModal
}: ProductFormModalProps) {
  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────
  // ESTADOS DO FORMULÁRIO
  // ─────────────────────────────────────────────────────────────
  const [activeFormTab, setActiveFormTab] = useState<'geral' | 'precos_estoque' | 'variantes' | 'seo'>('geral');

  // Campos Gerais
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || (categories[0]?.name || 'Outros'));
  const [description, setDescription] = useState(product?.description || '');
  const [tag, setTag] = useState(product?.tag || '');
  const [status, setStatus] = useState<ProductStatus>(product?.status || 'active');
  const [visual, setVisual] = useState<ProductVisual>(product?.visual || 'phone');
  const [tone, setTone] = useState(product?.tone || 'gold');

  // Imagens & Galeria
  const [mainImage, setMainImage] = useState(product?.image || '');
  const [gallery, setGallery] = useState<string[]>(product?.gallery || []);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Preço & Estoque
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [oldPrice, setOldPrice] = useState(product?.oldPrice ? String(product.oldPrice) : '');
  const [costPrice, setCostPrice] = useState(product?.costPrice ? String(product.costPrice) : '');
  const [stock, setStock] = useState(product?.stock !== undefined ? String(product.stock) : '10');
  const [minStockAlert, setMinStockAlert] = useState(product?.minStockAlert !== undefined ? String(product.minStockAlert) : '3');
  const [sku, setSku] = useState(product?.sku || '');

  // Cores & Variantes
  const [colors, setColors] = useState<string[]>(product?.colors || []);
  const [colorInput, setColorInput] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantStock, setNewVariantStock] = useState('5');
  const [newVariantPrice, setNewVariantPrice] = useState('');

  // SEO
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription || '');
  const [seoSlug, setSeoSlug] = useState(product?.seoSlug || '');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincroniza campos do formulário sempre que o modal abrir ou novos dados da IA forem aplicados
  useEffect(() => {
    if (isOpen) {
      setName(product?.name || '');
      setCategory(product?.category || (categories[0]?.name || 'Outros'));
      setDescription(product?.description || '');
      setTag(product?.tag || '');
      setStatus(product?.status || 'active');
      setVisual(product?.visual || 'phone');
      setTone(product?.tone || 'gold');
      setMainImage(product?.image || '');
      setGallery(product?.gallery || []);
      setPrice(product?.price !== undefined ? String(product.price) : '');
      setOldPrice(product?.oldPrice !== undefined ? String(product.oldPrice) : '');
      setCostPrice(product?.costPrice !== undefined ? String(product.costPrice) : '');
      setStock(product?.stock !== undefined ? String(product.stock) : '10');
      setMinStockAlert(product?.minStockAlert !== undefined ? String(product.minStockAlert) : '3');
      setSku(product?.sku || '');
      setColors(product?.colors || []);
      setVariants(product?.variants || []);
      setSeoTitle(product?.seoTitle || '');
      setSeoDescription(product?.seoDescription || '');
      setSeoSlug(product?.seoSlug || '');
      setErrorMsg('');
      setActiveFormTab('geral');
    }
  }, [product, isOpen, categories]);

  // Auto-gerar SEO Slug a partir do nome
  useEffect(() => {
    if (!product && name && !seoSlug) {
      const generatedSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSeoSlug(generatedSlug);
    }
  }, [name, product, seoSlug]);

  // Upload e Compressão de Imagens
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          const compressed = await compressImageForAI(base64, 1200);
          if (!mainImage) {
            setMainImage(compressed);
          } else {
            setGallery(prev => [...prev, compressed]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = () => {
    if (colorInput.trim() && !colors.includes(colorInput.trim())) {
      setColors(prev => [...prev, colorInput.trim()]);
      setColorInput('');
    }
  };

  const handleRemoveColor = (col: string) => {
    setColors(prev => prev.filter(c => c !== col));
  };

  const handleAddVariant = () => {
    if (!newVariantName.trim()) return;
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      name: newVariantName.trim(),
      stock: parseInt(newVariantStock, 10) || 0,
      price: newVariantPrice ? parseFloat(newVariantPrice) : undefined
    };
    setVariants(prev => [...prev, newVar]);
    setNewVariantName('');
    setNewVariantStock('5');
    setNewVariantPrice('');
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('O nome do produto é obrigatório.');
      setActiveFormTab('geral');
      return;
    }

    const parsedPrice = parseFloat(price.replace(',', '.'));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Informe um preço de venda válido.');
      setActiveFormTab('precos_estoque');
      return;
    }

    setSaving(true);

    try {
      const parsedStock = parseInt(stock, 10);
      const parsedMinStock = parseInt(minStockAlert, 10);
      const parsedOldPrice = oldPrice ? parseFloat(oldPrice.replace(',', '.')) : undefined;
      const parsedCostPrice = costPrice ? parseFloat(costPrice.replace(',', '.')) : undefined;

      // Cálculo de parcelamento padrão (ex: 3x de R$ XX sem juros)
      const installmentValue = parsedPrice / 3;
      const installmentText = `ou 3x de ${installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} s/ juros`;

      const payload = {
        ...(product || {}),
        name: name.trim(),
        category,
        price: parsedPrice,
        oldPrice: parsedOldPrice,
        costPrice: parsedCostPrice,
        installment: installmentText,
        description: description.trim() || 'Acessório de alta performance com garantia e suporte Lucca Cell.',
        tag: tag.trim() || undefined,
        visual,
        tone,
        image: mainImage || undefined,
        gallery: gallery.length > 0 ? gallery : undefined,
        colors: colors.length > 0 ? colors : undefined,
        stock: isNaN(parsedStock) ? 10 : parsedStock,
        minStockAlert: isNaN(parsedMinStock) ? 3 : parsedMinStock,
        status,
        variants: variants.length > 0 ? variants : undefined,
        sku: sku.trim() || undefined,
        seoTitle: seoTitle.trim() || name.trim(),
        seoDescription: seoDescription.trim() || description.trim(),
        seoSlug: seoSlug.trim() || undefined,
        updatedAt: new Date().toISOString()
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-3xl max-h-[92vh] bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-2xl flex flex-col overflow-hidden animate-rise my-auto"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-[#EFE9E0] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-[#D97757] text-white flex items-center justify-center shadow-xs">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E1D1B]">
                {product ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h2>
              <p className="text-xs text-[#7A7368]">
                {product ? `ID: #${product.id} • ${product.name}` : 'Preencha as informações do item para o catálogo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!product && onOpenAIModal && (
              <button
                type="button"
                onClick={() => { onClose(); onOpenAIModal(); }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF0E8] border border-[#EBD5C8] text-xs font-bold text-[#B05330] hover:bg-[#F5E2D4]"
              >
                <Sparkles size={14} />
                <span>Escanear c/ IA ({getModelDisplayName(getSelectedOpenRouterModel()).split(' ')[0]})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#7A7368] hover:bg-[#F2ECE2] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Abas do Formulário (Mobile First Scroll Horizontal) */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#EFE9E0] bg-[#FFFFFF] overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFormTab('geral')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-colors border-b-2 touch-manipulation min-h-[44px] ${
              activeFormTab === 'geral'
                ? 'border-[#D97757] text-[#D97757] bg-[#FAF0E8]/40'
                : 'border-transparent text-[#7A7368] hover:text-[#1E1D1B]'
            }`}
          >
            1. Informações Gerais
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('precos_estoque')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-colors border-b-2 touch-manipulation min-h-[44px] ${
              activeFormTab === 'precos_estoque'
                ? 'border-[#D97757] text-[#D97757] bg-[#FAF0E8]/40'
                : 'border-transparent text-[#7A7368] hover:text-[#1E1D1B]'
            }`}
          >
            2. Preços & Estoque
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('variantes')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-colors border-b-2 touch-manipulation min-h-[44px] ${
              activeFormTab === 'variantes'
                ? 'border-[#D97757] text-[#D97757] bg-[#FAF0E8]/40'
                : 'border-transparent text-[#7A7368] hover:text-[#1E1D1B]'
            }`}
          >
            3. Cores & Variantes ({colors.length + variants.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFormTab('seo')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold whitespace-nowrap transition-colors border-b-2 touch-manipulation min-h-[44px] ${
              activeFormTab === 'seo'
                ? 'border-[#D97757] text-[#D97757] bg-[#FAF0E8]/40'
                : 'border-transparent text-[#7A7368] hover:text-[#1E1D1B]'
            }`}
          >
            4. SEO & Publicação
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Corpo do Formulário com Scroll */}
        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* ─────────────────────────────────────────────────────────────
              ABA 1: GERAL & IMAGENS
          ───────────────────────────────────────────────────────────── */}
          {activeFormTab === 'geral' && (
            <div className="space-y-5">
              
              {/* Nome do Produto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Cabo Turbo USB-C para iPhone 15 1.5m"
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                  required
                />
              </div>

              {/* Categoria & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Tag Promocional (Opcional)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={e => setTag(e.target.value)}
                    placeholder="Ex: MAIS VENDIDO, 20W TURBO, NOVIDADE"
                    className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Descrição Detalhada
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Informe os detalhes técnicos, compatibilidade com modelos de celulares, garantia, etc."
                  className="w-full p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                />
              </div>

              {/* Upload de Imagens */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Fotos do Produto (Principal & Galeria)
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {/* Foto Principal */}
                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-[#D97757]/40 bg-[#FAF7F2] flex flex-col items-center justify-center p-2 overflow-hidden group">
                    {mainImage ? (
                      <>
                        <img src={mainImage} alt="Principal" className="h-full w-full object-contain" />
                        <span className="absolute top-2 left-2 bg-[#D97757] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          Capa
                        </span>
                        <button
                          type="button"
                          onClick={() => setMainImage('')}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center text-center p-2">
                        <Upload size={20} className="text-[#D97757] mb-1" />
                        <span className="text-[10px] font-bold text-[#B05330]">Upload Capa</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Fotos da Galeria */}
                  {gallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl border border-[#E0D8CC] bg-[#FAF7F2] p-2 overflow-hidden group">
                      <img src={img} alt={`Galeria ${idx}`} className="h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {/* Adicionar mais fotos */}
                  <label className="cursor-pointer aspect-square rounded-2xl border-2 border-dashed border-[#E0D8CC] hover:border-[#D97757] bg-[#FAF7F2] flex flex-col items-center justify-center text-center p-2 transition-colors">
                    <Plus size={20} className="text-[#7A7368] mb-1" />
                    <span className="text-[10px] font-semibold text-[#7A7368]">+ Galeria</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ABA 2: PREÇOS & ESTOQUE
          ───────────────────────────────────────────────────────────── */}
          {activeFormTab === 'precos_estoque' && (
            <div className="space-y-5">
              
              {/* Preços */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Preço de Venda (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7368]">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="89,90"
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm font-bold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Preço Anterior / De (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7368]">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={oldPrice}
                      onChange={e => setOldPrice(e.target.value)}
                      placeholder="119,90"
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Preço de Custo (Interno)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7368]">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={costPrice}
                      onChange={e => setCostPrice(e.target.value)}
                      placeholder="40,00"
                      className="w-full h-12 pl-10 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                    />
                  </div>
                </div>
              </div>

              {/* Estoque */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Estoque Atual (Unidades)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={stock}
                    onChange={e => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm font-bold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Alerta de Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(e.target.value)}
                    placeholder="3"
                    className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                    Código SKU / Referência
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="LC-CAB-001"
                    className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                  />
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ABA 3: CORES & VARIANTES
          ───────────────────────────────────────────────────────────── */}
          {activeFormTab === 'variantes' && (
            <div className="space-y-6">
              
              {/* Cores Disponíveis */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Cores Disponíveis
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); }}}
                    placeholder="Ex: Preto espacial, Dourado, Azul Sierra"
                    className="flex-1 h-11 px-4 rounded-xl bg-white border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-4 py-2 rounded-xl bg-[#D97757] text-white text-xs font-bold"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {colors.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E0D8CC] text-xs font-semibold text-[#1E1D1B]">
                      {c}
                      <button type="button" onClick={() => handleRemoveColor(c)} className="text-red-500 hover:text-red-700">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {colors.length === 0 && (
                    <span className="text-xs text-[#7A7368]">Nenhuma cor cadastrada.</span>
                  )}
                </div>
              </div>

              {/* Variantes (Capacidade / Voltagem) */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-2">
                  Grade de Variantes (Ex: 128GB, 256GB, 110V)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-3">
                  <input
                    type="text"
                    value={newVariantName}
                    onChange={e => setNewVariantName(e.target.value)}
                    placeholder="Nome da variante"
                    className="sm:col-span-2 h-11 px-4 rounded-xl bg-white border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  />
                  <input
                    type="number"
                    value={newVariantStock}
                    onChange={e => setNewVariantStock(e.target.value)}
                    placeholder="Estoque"
                    className="h-11 px-3 rounded-xl bg-white border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="h-11 px-4 rounded-xl bg-[#1E1D1B] text-white text-xs font-bold"
                  >
                    + Variante
                  </button>
                </div>

                <div className="space-y-2">
                  {variants.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E0D8CC] text-xs">
                      <div>
                        <span className="font-bold text-[#1E1D1B]">{v.name}</span>
                        <span className="text-[#7A7368] ml-2">Estoque: {v.stock} un.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {variants.length === 0 && (
                    <span className="text-xs text-[#7A7368]">Nenhuma variação adicionada.</span>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              ABA 4: SEO & PUBLICAÇÃO
          ───────────────────────────────────────────────────────────── */}
          {activeFormTab === 'seo' && (
            <div className="space-y-5">
              
              {/* Status de Publicação */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Status de Publicação
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('active')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                      status === 'active'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'bg-[#FAF7F2] border-[#E0D8CC] text-[#7A7368]'
                    }`}
                  >
                    <Check size={16} />
                    <span>Ativo no Catálogo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                      status === 'draft'
                        ? 'bg-amber-50 border-amber-500 text-amber-800'
                        : 'bg-[#FAF7F2] border-[#E0D8CC] text-[#7A7368]'
                    }`}
                  >
                    <Sliders size={16} />
                    <span>Rascunho</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('archived')}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 min-h-[44px] ${
                      status === 'archived'
                        ? 'bg-stone-200 border-stone-400 text-stone-800'
                        : 'bg-[#FAF7F2] border-[#E0D8CC] text-[#7A7368]'
                    }`}
                  >
                    <FolderTree size={16} />
                    <span>Arquivado</span>
                  </button>
                </div>
              </div>

              {/* Slug URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  URL Amigável (Slug)
                </label>
                <div className="flex items-center rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] px-4">
                  <span className="text-xs text-[#7A7368] font-mono">/produto/</span>
                  <input
                    type="text"
                    value={seoSlug}
                    onChange={e => setSeoSlug(e.target.value)}
                    placeholder="cabo-turbo-usb-c"
                    className="flex-1 h-12 bg-transparent text-xs text-[#1E1D1B] font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Meta Título & Descrição SEO */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Meta Título (Google)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={name || 'Título para mecanismos de busca'}
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Meta Descrição (Google)
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={e => setSeoDescription(e.target.value)}
                  placeholder="Resumo exibido no Google..."
                  className="w-full p-3 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                />
              </div>

            </div>
          )}

        </form>

        {/* Footer do Modal com Botões de Ação */}
        <div className="p-4 sm:p-5 border-t border-[#EFE9E0] flex items-center justify-between bg-[#FAF7F2]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-2xl text-xs font-bold text-[#7A7368] hover:bg-[#F2ECE2] transition-colors min-h-[44px]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="product-form"
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-[#D97757] text-white text-xs font-bold shadow-md hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px] flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>{product ? 'Salvar Alterações' : 'Cadastrar Produto'}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
