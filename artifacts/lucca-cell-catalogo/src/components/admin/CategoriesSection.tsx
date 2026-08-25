import React, { useState } from 'react';
import { 
  FolderTree, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Tag, 
  Check, 
  X, 
  Sparkles, 
  Laptop, 
  Zap, 
  Smartphone, 
  Watch, 
  Headphones, 
  ShieldCheck, 
  BatteryCharging,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { DynamicCategory, Product } from '@/types/admin';

const AVAILABLE_ICONS = [
  { name: 'Laptop', label: 'Memória / Info', icon: Laptop },
  { name: 'Zap', label: 'Energia / Cabo', icon: Zap },
  { name: 'Smartphone', label: 'Celular / Capa', icon: Smartphone },
  { name: 'Watch', label: 'Smartwatch', icon: Watch },
  { name: 'Headphones', label: 'Áudio / Som', icon: Headphones },
  { name: 'ShieldCheck', label: 'Proteção / Película', icon: ShieldCheck },
  { name: 'BatteryCharging', label: 'Bateria / Power', icon: BatteryCharging },
  { name: 'Sparkles', label: 'Iluminação / Destaque', icon: Sparkles },
  { name: 'Tag', label: 'Geral / Outros', icon: Tag },
];

const PRESET_COLORS = [
  '#D97757', '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#6B7280'
];

interface CategoriesSectionProps {
  categories: DynamicCategory[];
  products: Product[];
  onAddCategory: (category: Omit<DynamicCategory, 'id' | 'order'>) => void;
  onUpdateCategory: (id: string, updates: Partial<DynamicCategory>) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories?: (reordered: DynamicCategory[]) => void;
}

export function CategoriesSection({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories
}: CategoriesSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DynamicCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Tag');
  const [color, setColor] = useState('#D97757');

  // Modal de Aviso de Exclusão
  const [deleteWarningModalOpen, setDeleteWarningModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<DynamicCategory | null>(null);
  const [affectedProductCount, setAffectedProductCount] = useState(0);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setIconName('Tag');
    setColor('#D97757');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: DynamicCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setIconName(cat.iconName);
    setColor(cat.color);
    setModalOpen(true);
  };

  const handleOpenDelete = (cat: DynamicCategory) => {
    const count = products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length;
    setCategoryToDelete(cat);
    setAffectedProductCount(count);
    setDeleteWarningModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalSlug = slug.trim() || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        iconName,
        color
      });
    } else {
      onAddCategory({
        name: name.trim(),
        slug: finalSlug,
        description: description.trim(),
        iconName,
        color,
        isActive: true
      });
    }

    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setDeleteWarningModalOpen(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Taxonomia Dinâmica
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {categories.length} categorias cadastradas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Gerenciador de Categorias
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            As categorias aqui criadas alimentam tanto os filtros do catálogo quanto a IA de categorização.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D97757] text-white px-5 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
        >
          <Plus size={16} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat, index) => {
          const productCount = products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length;
          const IconComponent = AVAILABLE_ICONS.find(i => i.name === cat.iconName)?.icon || Tag;

          return (
            <div 
              key={cat.id} 
              className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between hover:border-[#D97757] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div 
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }} 
                    className="h-10 w-10 rounded-2xl flex items-center justify-center font-bold"
                  >
                    <IconComponent size={20} />
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] text-[10px] font-bold text-[#7A7368]">
                    {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#1E1D1B] mb-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#7A7368] line-clamp-2 mb-3">
                  {cat.description || 'Sem descrição cadastrada.'}
                </p>
                <div className="font-mono text-[10px] text-[#9E978C]">
                  Slug: /{cat.slug}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#EFE9E0] mt-4">
                <div className="flex items-center gap-1.5">
                  <span style={{ backgroundColor: cat.color }} className="h-3 w-3 rounded-full" />
                  <span className="text-[11px] text-[#7A7368] font-bold">Cor ativa</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-xl text-[#7A7368] hover:bg-[#FAF7F2] hover:text-[#1E1D1B] transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Editar categoria"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDelete(cat)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Excluir categoria"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE CADASTRO / EDIÇÃO DE CATEGORIA
      ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-5 animate-rise">
            
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[#D97757] text-white flex items-center justify-center">
                  <FolderTree size={18} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
                    {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                  </h3>
                  <p className="text-[11px] text-[#7A7368]">Configure nome, ícone e cor</p>
                </div>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} className="text-[#7A7368] hover:text-[#1E1D1B]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Fones & Caixas de Som"
                  className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] font-bold focus:outline-none focus:border-[#D97757]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1.5">
                  Descrição (Ajuda a IA a categorizar com precisão)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Fones bluetooth, TWS, headsets e caixas portáteis..."
                  className="w-full p-3 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
                />
              </div>

              {/* Seletor de Ícones */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-2">
                  Ícone Visual
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_ICONS.map(item => {
                    const Icon = item.icon;
                    const isSelected = iconName === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIconName(item.name)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors min-h-[44px] ${
                          isSelected 
                            ? 'bg-[#FAF0E8] border-[#D97757] text-[#B05330]' 
                            : 'bg-[#FAF7F2] border-[#E0D8CC] text-[#7A7368]'
                        }`}
                      >
                        <Icon size={16} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor de Cor */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-2">
                  Cor da Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-white transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-black' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {color === c && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368] hover:bg-[#FAF7F2] min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-bold hover:bg-[#C26243] min-h-[44px]"
                >
                  {editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE AVISO AO EXCLUIR CATEGORIA EM USO
      ───────────────────────────────────────────────────────────── */}
      {deleteWarningModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-4 animate-rise">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-[#1E1D1B]">
                Excluir Categoria "{categoryToDelete.name}"?
              </h3>
              {affectedProductCount > 0 ? (
                <div className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold">
                  ⚠️ Atenção: Existem <strong>{affectedProductCount} {affectedProductCount === 1 ? 'produto vinculado' : 'produtos vinculados'}</strong> a esta categoria. Eles serão automaticamente movidos para a categoria "Outros".
                </div>
              ) : (
                <p className="text-xs text-[#7A7368] mt-1">
                  Nenhum produto cadastrado atualmente utiliza esta categoria. A exclusão é segura.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteWarningModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368] hover:bg-[#FAF7F2] min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 min-h-[44px]"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
