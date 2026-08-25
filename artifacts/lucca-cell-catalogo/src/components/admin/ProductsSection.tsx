import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Sparkles, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Edit, 
  Download, 
  Upload, 
  Eye, 
  Tag, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Layers, 
  Check, 
  X,
  FileSpreadsheet,
  RefreshCw,
  FolderTree
} from 'lucide-react';
import { Product, DynamicCategory, ProductStatus } from '@/types/admin';
import { AdminProfile, PermissionType, hasClientPermission } from '@/lib/supabase';

interface ProductsSectionProps {
  products: Product[];
  categories: DynamicCategory[];
  currentUser: AdminProfile;
  onNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onBulkDelete?: (ids: number[]) => void;
  onBulkUpdateCategory?: (ids: number[], category: string) => void;
  onOpenAIModal: () => void;
}

export function ProductsSection({
  products,
  categories,
  currentUser,
  onNewProduct,
  onEditProduct,
  onDeleteProduct,
  onBulkDelete,
  onBulkUpdateCategory,
  onOpenAIModal
}: ProductsSectionProps) {
  
  // ─────────────────────────────────────────────────────────────
  // ESTADOS DE BUSCA, FILTROS & PAGINAÇÃO
  // ─────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  
  // Ordenação
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'id'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Seleção Múltipla
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState(categories[0]?.name || 'Outros');
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // ─────────────────────────────────────────────────────────────
  // FILTRAGEM & ORDENAÇÃO
  // ─────────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Busca por texto
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesCat = p.category?.toLowerCase().includes(query);
        const matchesTag = p.tag?.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        if (!matchesName && !matchesCat && !matchesTag && !matchesSku) return false;
      }

      // Filtro por Categoria
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Filtro por Status
      if (statusFilter !== 'all' && (p.status || 'active') !== statusFilter) {
        return false;
      }

      // Filtro por Estoque
      if (stockFilter === 'out_of_stock' && (p.stock || 0) > 0) return false;
      if (stockFilter === 'low_stock' && ((p.stock || 0) <= 0 || (p.stock || 0) > (p.minStockAlert || 3))) return false;
      if (stockFilter === 'in_stock' && (p.stock || 0) <= (p.minStockAlert || 3)) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'price') comparison = a.price - b.price;
      else if (sortBy === 'stock') comparison = (a.stock || 0) - (b.stock || 0);
      else comparison = a.id - b.id;

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [products, debouncedSearch, selectedCategory, statusFilter, stockFilter, sortBy, sortOrder]);

  // Paginação real
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Handlers de Seleção
  const handleSelectAllOnPage = () => {
    const pageIds = paginatedProducts.map(p => p.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Exportar para CSV
  const handleExportCSV = (exportSelectedOnly = false) => {
    const listToExport = exportSelectedOnly 
      ? products.filter(p => selectedIds.includes(p.id))
      : filteredProducts;

    if (listToExport.length === 0) return;

    const headers = ['ID', 'Nome', 'Categoria', 'Preco', 'Preco_Antigo', 'Estoque', 'Tag', 'Status', 'Descricao'];
    const rows = listToExport.map(p => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.price.toFixed(2),
      p.oldPrice ? p.oldPrice.toFixed(2) : '',
      p.stock || 0,
      `"${p.tag || ''}"`,
      p.status || 'active',
      `"${(p.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_lucca_cell_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Ações em Massa
  const handleExecuteBulkDelete = () => {
    if (onBulkDelete) {
      onBulkDelete(selectedIds);
    } else {
      selectedIds.forEach(id => onDeleteProduct(id));
    }
    setSelectedIds([]);
    setDeleteConfirmModalOpen(false);
  };

  const handleExecuteBulkCategoryChange = () => {
    if (onBulkUpdateCategory) {
      onBulkUpdateCategory(selectedIds, targetCategory);
    }
    setSelectedIds([]);
    setBulkCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* ─────────────────────────────────────────────────────────────
          1. CABEÇALHO DO MÓDULO & AÇÕES RÁPIDAS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Inventário & Catálogo
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'} cadastrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Gerenciar Produtos
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Controle preços, estoque, variantes e publicações do catálogo da Lucca Cell.
          </p>
        </div>

        {/* Botões Topo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleExportCSV(false)}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] px-3.5 py-3 text-xs font-bold text-[#4A453E] hover:bg-[#F2ECE2] transition-colors min-h-[44px]"
            title="Exportar todos os produtos para planilha CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAIModal}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FAF0E8] border border-[#EBD5C8] px-4 py-3 text-xs font-bold text-[#B05330] hover:bg-[#F5E2D4] transition-colors min-h-[44px]"
          >
            <Sparkles size={16} />
            <span>Cadastrar via IA</span>
          </button>

          <button
            type="button"
            onClick={onNewProduct}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D97757] text-white px-5 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
          >
            <Plus size={16} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BARRA DE BUSCA, FILTROS & ORDENAÇÃO
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E7E0D5] shadow-xs space-y-4">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Input Busca com Debounce */}
          <div className="sm:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E978C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, categoria, SKU ou tag..."
              className="w-full h-12 pl-11 pr-10 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs sm:text-sm text-[#1E1D1B] placeholder-[#9E978C] focus:outline-none focus:border-[#D97757]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E978C] hover:text-[#1E1D1B]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filtro de Categoria */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full h-12 px-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-semibold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            >
              <option value="all">📁 Todas as Categorias ({products.length})</option>
              {categories.map(cat => {
                const count = products.filter(p => p.category === cat.name).length;
                return (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filtro de Estoque */}
          <div>
            <select
              value={stockFilter}
              onChange={e => { setStockFilter(e.target.value as any); setCurrentPage(1); }}
              className="w-full h-12 px-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-semibold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            >
              <option value="all">📦 Todos os Estoques</option>
              <option value="in_stock">✅ Em Estoque Regular</option>
              <option value="low_stock">⚠️ Estoque Baixo</option>
              <option value="out_of_stock">⛔ Esgotados (Zero)</option>
            </select>
          </div>

        </div>

        {/* Linha Secundária: Ordenação e Contadores */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#EFE9E0] text-xs">
          
          <div className="flex items-center gap-2">
            <span className="text-[#7A7368]">Ordenar por:</span>
            <button
              type="button"
              onClick={() => {
                if (sortBy === 'name') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                else { setSortBy('name'); setSortOrder('asc'); }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                sortBy === 'name' ? 'bg-[#FAF0E8] text-[#B05330] border border-[#EBD5C8]' : 'text-[#7A7368] hover:bg-[#FAF7F2]'
              }`}
            >
              Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (sortBy === 'price') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                else { setSortBy('price'); setSortOrder('asc'); }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                sortBy === 'price' ? 'bg-[#FAF0E8] text-[#B05330] border border-[#EBD5C8]' : 'text-[#7A7368] hover:bg-[#FAF7F2]'
              }`}
            >
              Preço {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (sortBy === 'stock') setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                else { setSortBy('stock'); setSortOrder('asc'); }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
                sortBy === 'stock' ? 'bg-[#FAF0E8] text-[#B05330] border border-[#EBD5C8]' : 'text-[#7A7368] hover:bg-[#FAF7F2]'
              }`}
            >
              Estoque {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>

          <div className="flex items-center gap-2 text-[#7A7368]">
            <span>Exibir:</span>
            <select
              value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="h-8 px-2 rounded-lg bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
            >
              <option value={10}>10 itens</option>
              <option value={25}>25 itens</option>
              <option value={50}>50 itens</option>
            </select>
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. BARRA FLUTUANTE DE AÇÕES EM MASSA (QUANDO HÁ SELEÇÃO)
      ───────────────────────────────────────────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#1E1D1B] text-white flex flex-wrap items-center justify-between gap-3 shadow-xl animate-rise">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare size={18} className="text-[#D97757]" />
            <span>{selectedIds.length} {selectedIds.length === 1 ? 'produto selecionado' : 'produtos selecionados'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setBulkCategoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white transition-colors"
            >
              Alterar Categoria
            </button>

            <button
              type="button"
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-white transition-colors"
            >
              Exportar Selecionados
            </button>

            <button
              type="button"
              onClick={() => setDeleteConfirmModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white transition-colors"
            >
              Excluir ({selectedIds.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2 py-1.5 text-xs text-stone-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. LISTA DE PRODUTOS (CARDS NO MOBILE / TABELA NO DESKTOP)
      ───────────────────────────────────────────────────────────── */}
      {filteredProducts.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs space-y-4">
          <div className="h-16 w-16 rounded-full bg-[#FAF0E8] text-[#D97757] flex items-center justify-center mx-auto">
            <Package size={32} />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#1E1D1B]">
              Nenhum produto encontrado
            </h3>
            <p className="text-xs sm:text-sm text-[#7A7368] max-w-md mx-auto mt-1">
              {debouncedSearch || selectedCategory !== 'all' || statusFilter !== 'all' || stockFilter !== 'all'
                ? 'Tente ajustar os filtros ou termos da sua busca para encontrar o item desejado.'
                : 'Você ainda não possui produtos cadastrados no catálogo da Lucca Cell.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {(debouncedSearch || selectedCategory !== 'all' || statusFilter !== 'all' || stockFilter !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setStatusFilter('all'); setStockFilter('all'); }}
                className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#4A453E]"
              >
                Limpar Filtros
              </button>
            )}
            <button
              type="button"
              onClick={onNewProduct}
              className="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-bold shadow-xs hover:bg-[#C26243]"
            >
              Cadastrar Primeiro Produto
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
          
          {/* TABELA NO DESKTOP (MD PRA CIMA) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EFE9E0] text-[#7A7368] uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))}
                      onChange={handleSelectAllOnPage}
                      className="rounded border-[#E0D8CC] text-[#D97757] focus:ring-[#D97757] h-4 w-4"
                    />
                  </th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Preço</th>
                  <th className="p-4">Estoque</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9E0]">
                {paginatedProducts.map(product => {
                  const isSelected = selectedIds.includes(product.id);
                  const isLowStock = (product.stock || 0) <= (product.minStockAlert || 3);
                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-[#FAF7F2]/60 transition-colors ${isSelected ? 'bg-[#FAF0E8]/30' : ''}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          className="rounded border-[#E0D8CC] text-[#D97757] focus:ring-[#D97757] h-4 w-4"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-white border border-[#E0D8CC] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                            ) : (
                              <Package size={20} className="text-[#D97757]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[#1E1D1B] truncate max-w-xs">{product.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-[#7A7368]">#LC-{product.id}</span>
                              {product.tag && (
                                <span className="px-1.5 py-0.2 rounded bg-[#FAF0E8] text-[#B05330] text-[9px] font-bold">
                                  {product.tag}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-xl bg-[#FAF7F2] border border-[#EFE9E0] text-[11px] font-semibold text-[#4A453E]">
                          {product.category}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-[#1E1D1B]">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        {product.oldPrice && (
                          <span className="block text-[10px] text-[#9E978C] line-through font-normal">
                            {product.oldPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${
                            (product.stock || 0) === 0 ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                          }`} />
                          <span className={`font-bold ${isLowStock ? 'text-amber-700' : 'text-[#1E1D1B]'}`}>
                            {product.stock ?? 10} un.
                          </span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          product.status === 'draft'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : product.status === 'archived'
                            ? 'bg-stone-100 text-stone-700 border border-stone-300'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {product.status === 'draft' ? 'Rascunho' : product.status === 'archived' ? 'Arquivado' : 'Ativo'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-2 rounded-xl text-[#7A7368] hover:bg-[#F2ECE2] hover:text-[#1E1D1B] transition-colors"
                            title="Editar produto"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setItemToDelete(product.id); setDeleteConfirmModalOpen(true); }}
                            className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                            title="Excluir produto"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* CARDS EMPILHADOS NO MOBILE (TOUCH FRIENDLY >= 44px) */}
          <div className="md:hidden divide-y divide-[#EFE9E0]">
            {paginatedProducts.map(product => {
              const isSelected = selectedIds.includes(product.id);
              const isLowStock = (product.stock || 0) <= (product.minStockAlert || 3);
              return (
                <div key={product.id} className={`p-4 space-y-3 ${isSelected ? 'bg-[#FAF0E8]/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(product.id)}
                      className="mt-1 rounded border-[#E0D8CC] text-[#D97757] focus:ring-[#D97757] h-5 w-5"
                    />

                    <div className="h-16 w-16 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                      ) : (
                        <Package size={24} className="text-[#D97757]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold text-[#B05330] bg-[#FAF0E8] px-1.5 py-0.5 rounded-md">
                          {product.category}
                        </span>
                        {product.tag && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-md">
                            {product.tag}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-[#1E1D1B] line-clamp-2">{product.name}</h4>
                      <p className="text-sm font-serif font-bold text-[#1E1D1B] mt-1">
                        {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#EFE9E0] text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${
                        (product.stock || 0) === 0 ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-[#7A7368]">Estoque: <strong className="text-[#1E1D1B]">{product.stock ?? 10} un.</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditProduct(product)}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B] min-h-[44px] touch-manipulation flex items-center gap-1.5"
                      >
                        <Edit size={14} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setItemToDelete(product.id); setDeleteConfirmModalOpen(true); }}
                        className="p-2.5 rounded-xl bg-red-50 text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
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
              PAGINAÇÃO RODAPÉ
          ───────────────────────────────────────────────────────────── */}
          <div className="p-4 border-t border-[#EFE9E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-[#FAF7F2]">
            <div className="text-[#7A7368]">
              Mostrando <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> até <strong>{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</strong> de <strong>{filteredProducts.length}</strong> produtos
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 rounded-xl bg-white border border-[#E0D8CC] text-[#1E1D1B] disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1.5 rounded-xl bg-white border border-[#E0D8CC] font-bold text-[#1E1D1B]">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 rounded-xl bg-white border border-[#E0D8CC] text-[#1E1D1B] disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
      ───────────────────────────────────────────────────────────── */}
      {deleteConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-4 animate-rise">
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1E1D1B]">
                {itemToDelete ? 'Excluir Produto?' : `Excluir ${selectedIds.length} produtos selecionados?`}
              </h3>
              <p className="text-xs text-[#7A7368] mt-1">
                Esta ação removerá o produto do catálogo e do banco de dados. Você confirma a exclusão?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setDeleteConfirmModalOpen(false); setItemToDelete(null); }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368] hover:bg-[#FAF7F2] min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itemToDelete) {
                    onDeleteProduct(itemToDelete);
                    setItemToDelete(null);
                    setDeleteConfirmModalOpen(false);
                  } else {
                    handleExecuteBulkDelete();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 min-h-[44px]"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL DE ALTERAÇÃO DE CATEGORIA EM MASSA
      ───────────────────────────────────────────────────────────── */}
      {bulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-4 animate-rise">
            <div className="h-12 w-12 rounded-2xl bg-[#FAF0E8] text-[#D97757] flex items-center justify-center">
              <FolderTree size={24} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-[#1E1D1B]">
                Mudar Categoria em Massa
              </h3>
              <p className="text-xs text-[#7A7368] mt-1">
                Selecione a nova categoria para os {selectedIds.length} produtos selecionados:
              </p>
            </div>
            <div>
              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value)}
                className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-sm text-[#1E1D1B] font-bold"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkCategoryModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368] hover:bg-[#FAF7F2] min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkCategoryChange}
                className="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-bold hover:bg-[#C26243] min-h-[44px]"
              >
                Atualizar Categoria
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
