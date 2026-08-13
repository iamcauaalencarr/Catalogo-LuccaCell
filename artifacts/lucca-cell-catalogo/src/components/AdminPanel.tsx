import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, ShieldCheck, Package, DollarSign, Tag, Star, 
  ArrowLeft, Search, Check, X, Sparkles, AlertTriangle, Eye, Layers, Wrench, Camera,
  Users, UserCheck, UserX, Mail, KeyRound, History, Send, CheckCircle2, Clock, ShieldAlert, Crown, LogOut
} from 'lucide-react';
import { AIVisionModal } from '@/components/AIVisionModal';
import { ScannedProductData } from '@/services/openrouter';
import { 
  AdminProfile, 
  PermissionType, 
  hasClientPermission,
  fetchAllAdminProfiles,
  updateAdminProfile,
  createAdminInvitation,
  fetchAdminInvitations,
  deleteAdminInvitation,
  fetchSecurityAuditLogs,
  SecurityAuditLog,
  AdminInvitation
} from '@/lib/supabase';

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
  currentUser: AdminProfile;
  onAddProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onCloseAdmin: () => void;
  onLogout?: () => void;
}

export function AdminPanel({
  products,
  currentUser,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onCloseAdmin,
  onLogout
}: AdminPanelProps) {
  const [activeSection, setActiveSection] = useState<'products' | 'team' | 'audit'>('products');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Todos');
  
  // Modal de IA e Formulário de Produto
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State Produto
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

  // Owner State: Equipe, Convites e Auditoria
  const isOwner = currentUser.role === 'owner';
  const [adminList, setAdminList] = useState<AdminProfile[]>([]);
  const [invitationsList, setInvitationsList] = useState<AdminInvitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Convite Modal / Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermissions, setInvitePermissions] = useState<PermissionType[]>([
    'products.read',
    'products.create',
    'products.update'
  ]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  // Permissões do usuário atual
  const canCreate = hasClientPermission(currentUser, 'products.create');
  const canUpdate = hasClientPermission(currentUser, 'products.update');
  const canDelete = hasClientPermission(currentUser, 'products.delete');

  // Carregar dados de equipe quando o Owner entrar na aba
  useEffect(() => {
    if (isOwner && activeSection === 'team') {
      loadTeamData();
    } else if (isOwner && activeSection === 'audit') {
      loadAuditLogs();
    }
  }, [activeSection, isOwner]);

  const loadTeamData = async () => {
    setLoadingTeam(true);
    const [profiles, invites] = await Promise.all([
      fetchAllAdminProfiles(),
      fetchAdminInvitations()
    ]);
    setAdminList(profiles);
    setInvitationsList(invites);
    setLoadingTeam(false);
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    const logs = await fetchSecurityAuditLogs();
    setAuditLogs(logs);
    setLoadingAudit(false);
  };

  const handleToggleAdminStatus = async (admin: AdminProfile) => {
    if (admin.role === 'owner') return; // Owner não pode ser desativado
    const newStatus = !admin.is_active;
    const ok = await updateAdminProfile(admin.id, { is_active: newStatus });
    if (ok) {
      setAdminList(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: newStatus } : a));
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    setIsInviting(true);

    const res = await createAdminInvitation(inviteEmail, invitePermissions);
    if (res.success) {
      setInviteSuccess(`Convite criado com sucesso para ${inviteEmail}!`);
      setInviteEmail('');
      loadTeamData();
    } else {
      setInviteError(res.error || 'Erro ao criar convite.');
    }
    setIsInviting(false);
  };

  const handleDeleteInvite = async (id: string) => {
    const ok = await deleteAdminInvitation(id);
    if (ok) {
      setInvitationsList(prev => prev.filter(i => i.id !== id));
    }
  };

  const togglePermissionSelection = (perm: PermissionType) => {
    setInvitePermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

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
      visual: (aiData.visual as Product['visual']) || 'phone',
      tone: aiData.tone || 'linear-gradient(135deg,#29251f,#bd7824)',
      image: aiData.image || ''
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
      installment: product.installment,
      tag: product.tag || '',
      description: product.description,
      visual: product.visual,
      tone: product.tone,
      image: product.image || ''
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formData.price.replace(',', '.'));
    const oldPriceNum = formData.oldPrice ? parseFloat(formData.oldPrice.replace(',', '.')) : undefined;

    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Por favor, informe um preço válido.');
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
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E1D1B] pb-24">
      
      {/* Top Admin Header Bar */}
      <div className="border-b border-[#E7E0D6] bg-[#FFFFFF] text-[#1E1D1B] sticky top-0 z-30 shadow-2xs">
        <div className="gold-line h-0.5 w-full" />
        <div className="container-lucca py-3 sm:py-0 sm:h-[72px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Header Title & Status */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#FDF2EC] text-[#D97757] border border-[#F3D7C9] shrink-0">
                {isOwner ? <Crown size={19} className="text-[#D97757]" /> : <ShieldCheck size={19} className="text-[#D97757]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="display text-base sm:text-lg font-bold text-[#1E1D1B]">Painel Administrativo</h1>
                  <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isOwner ? 'bg-[#D97757] text-[#FFFFFF]' : 'bg-[#FAF4ED] text-[#B05330] border border-[#F0E4D5]'
                  }`}>
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[10px] text-[#736B60] flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  <span className="opacity-40">·</span>
                  <span className="text-[#B05330]">{currentUser.email}</span>
                </p>
              </div>
            </div>

            {/* Close button on mobile */}
            <button
              onClick={onCloseAdmin}
              className="sm:hidden flex items-center justify-center h-8 w-8 rounded-full border border-[#E0D8CC] text-[#6E675D] hover:bg-[#F7F3EC]"
            >
              <X size={16} />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canCreate && (
              <>
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="flex-1 sm:flex-none flex h-9 items-center justify-center gap-2 rounded-full border border-[#F0D5C7] bg-[#FAF5EF] px-3.5 sm:px-4 text-xs font-bold text-[#B05330] active:scale-95 transition-all shadow-2xs hover:border-[#D97757]"
                >
                  <Sparkles size={14} className="text-[#D97757]" />
                  <span>Cadastrar via IA</span>
                </button>
                <button
                  onClick={openNewProductForm}
                  className="flex-1 sm:flex-none flex h-9 items-center justify-center gap-2 rounded-full bg-[#D97757] px-3.5 sm:px-4 text-xs font-bold text-[#FFFFFF] active:scale-95 transition-all shadow-xs hover:bg-[#C85A32]"
                >
                  <Plus size={15} />
                  <span>Novo Produto</span>
                </button>
              </>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center justify-center h-9 w-9 rounded-full border border-[#E0D8CC] text-[#6E675D] hover:text-[#D93838] hover:bg-[#F7F3EC] shrink-0 transition-colors"
                title="Encerrar Sessão"
              >
                <LogOut size={15} />
              </button>
            )}

            <button
              onClick={onCloseAdmin}
              className="hidden sm:flex items-center gap-1.5 h-9 rounded-full border border-[#E0D8CC] px-3.5 text-xs font-bold text-[#4A443B] hover:bg-[#F7F3EC] transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Catálogo</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container-lucca flex gap-2 border-t border-[#E7E0D6] pt-2 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection('products')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'products'
                ? 'bg-[#D97757] text-[#FFFFFF]'
                : 'text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#FAF6F0]'
            }`}
          >
            <Package size={14} />
            <span>Produtos ({products.length})</span>
          </button>

          {isOwner && (
            <>
              <button
                onClick={() => setActiveSection('team')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSection === 'team'
                    ? 'bg-[#D97757] text-[#FFFFFF]'
                    : 'text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#FAF6F0]'
                }`}
              >
                <Users size={14} />
                <span>Equipe & Acessos</span>
              </button>

              <button
                onClick={() => setActiveSection('audit')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSection === 'audit'
                    ? 'bg-[#D97757] text-[#FFFFFF]'
                    : 'text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#FAF6F0]'
                }`}
              >
                <History size={14} />
                <span>Auditoria de Logs</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: CATÁLOGO DE PRODUTOS */}
      {/* ========================================================================= */}
      {activeSection === 'products' && (
        <div className="container-lucca pt-4 sm:pt-8 space-y-6 sm:space-y-8 animate-rise">
          
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-[16px] sm:rounded-[18px] border border-[#E7E0D6] bg-[#FFFFFF] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#6E675D] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Produtos</span>
                <Package size={18} className="text-[#D97757] shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#1E1D1B]">{products.length}</div>
              <span className="text-[10px] sm:text-[11px] text-[#736B60] mt-0.5 sm:mt-1 block line-clamp-1">Cadastrados no catálogo</span>
            </div>

            <div className="rounded-[16px] sm:rounded-[18px] border border-[#E7E0D6] bg-[#FFFFFF] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#6E675D] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Estoque Total</span>
                <DollarSign size={18} className="text-[#2E7D32] shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#1E1D1B] truncate">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#736B60] mt-0.5 sm:mt-1 block line-clamp-1">Soma dos itens</span>
            </div>

            <div className="rounded-[16px] sm:rounded-[18px] border border-[#E7E0D6] bg-[#FFFFFF] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#6E675D] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Destaques</span>
                <Tag size={18} className="text-[#D48825] shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#1E1D1B]">{featuredCount}</div>
              <span className="text-[10px] sm:text-[11px] text-[#736B60] mt-0.5 sm:mt-1 block line-clamp-1">Com selo especial</span>
            </div>

            <div className="rounded-[16px] sm:rounded-[18px] border border-[#E7E0D6] bg-[#FFFFFF] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#6E675D] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Seu Perfil</span>
                <ShieldCheck size={18} className="text-[#D97757] shrink-0" />
              </div>
              <div className="text-base sm:text-xl font-extrabold text-[#1E1D1B] truncate">{currentUser.role.toUpperCase()}</div>
              <span className="text-[10px] sm:text-[11px] text-[#736B60] mt-0.5 sm:mt-1 block line-clamp-1">
                {isOwner ? 'Acesso Irrestrito' : `${currentUser.permissions.length} permissões ativas`}
              </span>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8578]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="h-11 w-full rounded-full border border-[#DED6CA] bg-[#FFFFFF] pl-10 pr-4 text-xs text-[#1E1D1B] placeholder:text-[#8E8578] outline-none focus:border-[#D97757] shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(['Todos', 'Capinhas', 'Cabos e carregadores', 'Áudio', 'Proteção', 'Assistência'] as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-[#D97757] text-[#FFFFFF] shadow-xs' 
                      : 'bg-[#FFFFFF] text-[#5C554B] border border-[#E0D8CC] hover:bg-[#FAF6F0] hover:text-[#1E1D1B]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1E1D1B]">
                <thead className="border-b border-[#E7E0D6] bg-[#FAF8F5] font-bold text-[#6E675D] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 sm:p-4">Produto</th>
                    <th className="p-3.5 sm:p-4">Categoria</th>
                    <th className="p-3.5 sm:p-4">Preço</th>
                    <th className="p-3.5 sm:p-4">Tag</th>
                    <th className="p-3.5 sm:p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE0]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#8E8578]">
                        Nenhum produto encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(product => (
                      <tr key={product.id} className="hover:bg-[#FAF9F6] transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-9 w-9 rounded-lg object-cover border border-[#EAE3D8]" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-[#FAF4EC] text-[#D97757] flex items-center justify-center font-bold text-xs">
                              {product.name.charAt(0)}
                            </div>
                          )}
                          <div className="truncate max-w-[200px] sm:max-w-xs">
                            <span className="block truncate text-xs sm:text-sm text-[#1E1D1B]">{product.name}</span>
                            <span className="block text-[10px] text-[#736B60] font-normal truncate">{product.description}</span>
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-[#4A443B] font-medium">{product.category}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-[#1E1D1B]">
                          {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          {product.tag ? (
                            <span className="bg-[#FAF2EB] border border-[#F0D5C7] text-[#B8522E] px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {product.tag}
                            </span>
                          ) : (
                            <span className="text-[#948A7D] text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canUpdate && (
                              <button
                                onClick={() => openEditProductForm(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF4ED] text-[#B05330] hover:bg-[#D97757] hover:text-[#FFFFFF] transition-colors shadow-2xs"
                                title="Editar Produto"
                              >
                                <Edit size={14} />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                onClick={() => {
                                  if (confirm(`Deseja realmente excluir "${product.name}"?`)) {
                                    onDeleteProduct(product.id);
                                  }
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                                title="Excluir Produto"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}

                            {!canUpdate && !canDelete && (
                              <span className="text-[10px] text-[#887864] italic">Apenas Leitura</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: GESTÃO DE EQUIPE & CONVITES (EXCLUSIVO OWNER) */}
      {/* ========================================================================= */}
      {activeSection === 'team' && isOwner && (
        <div className="container-lucca pt-4 sm:pt-8 space-y-6 sm:space-y-8 animate-rise">
          
          {/* Card: Convidar Novo Administrador */}
          <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF2EB] text-[#D97757] border border-[#F0D5C7]">
                <Send size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1E1D1B]">Convidar Novo Administrador</h3>
                <p className="text-xs text-[#736B60]">Gere um convite com permissões granulares no banco de dados.</p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              {inviteError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                    E-mail do Novo Administrador *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="novo.admin@luccacell.com.br"
                    className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] px-4 text-xs text-[#1E1D1B] placeholder:text-[#8E8578] outline-none focus:border-[#D97757] shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-[#D97757] px-6 text-xs font-bold text-[#FFFFFF] hover:bg-[#C85A32] transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Send size={14} />
                  <span>{isInviting ? 'Gerando...' : 'Criar Convite'}</span>
                </button>
              </div>

              {/* Permissões Granulares Checkboxes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-2">
                  Permissões Concedidas a Este Administrador:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    { id: 'products.read', label: 'Visualizar Produtos' },
                    { id: 'products.create', label: 'Cadastrar Produtos' },
                    { id: 'products.update', label: 'Editar Produtos' },
                    { id: 'products.delete', label: 'Excluir Produtos' },
                  ].map(perm => (
                    <label 
                      key={perm.id} 
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer text-xs transition-colors ${
                        invitePermissions.includes(perm.id as PermissionType)
                          ? 'bg-[#FAF2EB] border-[#D97757] text-[#B05330] font-bold'
                          : 'bg-[#FFFFFF] border-[#E7E0D6] text-[#6E675D]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(perm.id as PermissionType)}
                        onChange={() => togglePermissionSelection(perm.id as PermissionType)}
                        className="rounded accent-[#D97757]"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Lista de Administradores Ativos */}
          <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E7E0D6] bg-[#FAF8F5] flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#6E675D]">
                Administradores Cadastrados ({adminList.length})
              </h4>
              <button onClick={loadTeamData} className="text-xs text-[#B05330] font-bold hover:underline">
                Atualizar Lista
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1E1D1B]">
                <thead className="border-b border-[#E7E0D6] bg-[#FFFFFF] text-[#736B60] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Nome / E-mail</th>
                    <th className="p-3.5">Papel</th>
                    <th className="p-3.5">Permissões</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE0]">
                  {loadingTeam ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#8E8578]">Carregando equipe...</td>
                    </tr>
                  ) : adminList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#8E8578]">Nenhum administrador cadastrado.</td>
                    </tr>
                  ) : (
                    adminList.map(admin => (
                      <tr key={admin.id} className="hover:bg-[#FAF9F6]">
                        <td className="p-3.5 font-bold">
                          <div className="text-[#1E1D1B]">{admin.name}</div>
                          <div className="text-[10px] text-[#736B60] font-normal">{admin.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            admin.role === 'owner' ? 'bg-[#D97757] text-[#FFFFFF]' : 'bg-[#FAF4ED] text-[#B05330] border border-[#F0E4D5]'
                          }`}>
                            {admin.role === 'owner' ? '👑 OWNER' : '🛡️ ADMIN'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {admin.role === 'owner' ? (
                            <span className="text-[11px] font-bold text-[#2E7D32]">Acesso Total</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {admin.permissions.map(p => (
                                <span key={p} className="bg-[#FAF8F5] border border-[#E7E0D6] text-[9px] px-1.5 py-0.5 rounded font-mono text-[#6E675D]">
                                  {p.replace('products.', '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            admin.is_active ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'
                          }`}>
                            {admin.is_active ? 'Ativo' : 'Desativado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {admin.role !== 'owner' && (
                            <button
                              onClick={() => handleToggleAdminStatus(admin)}
                              className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                                admin.is_active 
                                  ? 'border border-red-200 text-red-600 hover:bg-red-50' 
                                  : 'bg-emerald-600 text-[#fff] hover:bg-emerald-700'
                              }`}
                            >
                              {admin.is_active ? 'Desativar' : 'Reativar'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Convites Pendentes */}
          {invitationsList.length > 0 && (
            <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-4 shadow-xs">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#6E675D] mb-3">
                Convites Pendentes de Ativação ({invitationsList.length})
              </h4>
              <div className="space-y-2">
                {invitationsList.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#E7E0D6] text-xs">
                    <div>
                      <span className="font-bold text-[#1E1D1B]">{inv.email}</span>
                      <span className="ml-2 text-[10px] text-[#736B60] font-mono">
                        Expira em: {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteInvite(inv.id)}
                      className="text-red-600 font-bold hover:underline text-xs"
                    >
                      Cancelar Convite
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: LOGS DE AUDITORIA DE SEGURANÇA (EXCLUSIVO OWNER) */}
      {/* ========================================================================= */}
      {activeSection === 'audit' && isOwner && (
        <div className="container-lucca pt-4 sm:pt-8 space-y-6 sm:space-y-8 animate-rise">
          <div className="rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[#E7E0D6] bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#6E675D]">
                  Logs de Auditoria de Segurança
                </h4>
                <p className="text-[11px] text-[#736B60]">Registro imutável de ações administrativas gravadas no banco de dados.</p>
              </div>
              <button onClick={loadAuditLogs} className="text-xs text-[#B05330] font-bold hover:underline">
                Recarregar Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#1E1D1B]">
                <thead className="border-b border-[#E7E0D6] bg-[#FFFFFF] text-[#736B60] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Usuário (Actor)</th>
                    <th className="p-3.5">Ação</th>
                    <th className="p-3.5">Recurso</th>
                    <th className="p-3.5">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE0]">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#8E8578]">Carregando logs de auditoria...</td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#8E8578]">Nenhum registro de auditoria encontrado.</td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#FAF9F6]">
                        <td className="p-3.5 font-mono text-[11px] text-[#736B60] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5 font-bold text-[#1E1D1B]">{log.actor_email}</td>
                        <td className="p-3.5">
                          <span className="bg-[#FAF2EB] text-[#B05330] border border-[#F0D5C7] px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-[#6E675D]">{log.resource || '-'}</td>
                        <td className="p-3.5 text-[11px] font-mono text-[#736B60] max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar / Editar Produto */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-[24px] sm:rounded-2xl border border-[#E7E0D6] bg-[#FFFFFF] p-4 sm:p-6 text-[#1E1D1B] shadow-2xl animate-rise flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-3 mb-4 sticky top-0 bg-[#FFFFFF] z-10">
              <h3 className="display text-base sm:text-lg font-bold text-[#1E1D1B]">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E0D8CC] text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#F7F3EC]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Capinha Silicone iPhone 15 Pro Max"
                  className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] px-3.5 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] px-3 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] shadow-2xs"
                  >
                    <option value="Capinhas">Capinhas</option>
                    <option value="Cabos e carregadores">Cabos e carregadores</option>
                    <option value="Áudio">Áudio</option>
                    <option value="Proteção">Proteção</option>
                    <option value="Assistência">Assistência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                    URL da Imagem (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] px-3.5 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="89,90"
                    className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] px-3.5 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                    Preço Antigo (R$)
                  </label>
                  <input
                    type="text"
                    value={formData.oldPrice}
                    onChange={e => setFormData({ ...formData, oldPrice: e.target.value })}
                    placeholder="109,90"
                    className="h-11 w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] px-3.5 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#6E675D] mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[#DED6CA] bg-[#FFFFFF] p-3 text-xs text-[#1E1D1B] outline-none focus:border-[#D97757] shadow-2xs"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#D97757] text-[#FFFFFF] rounded-xl font-bold text-xs hover:bg-[#C85A32] transition-colors shadow-xs"
              >
                {editingProduct ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AIVisionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApplyAIData={handleApplyAIData}
      />
    </div>
  );
}
