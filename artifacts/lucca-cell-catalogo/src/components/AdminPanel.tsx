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
    <div className="min-h-screen bg-[#f4efe5] text-[#241c16] pb-24">
      
      {/* Top Admin Header Bar */}
      <div className="border-b border-[#2b241e] bg-[#171411] text-[#fff8e8] sticky top-0 z-30 shadow-md">
        <div className="gold-line h-1 w-full" />
        <div className="container-lucca py-3 sm:py-0 sm:h-[76px] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Header Title & Status */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#f4b52e]/20 text-[#f4b52e] border border-[#f4b52e]/40 shrink-0">
                {isOwner ? <Crown size={20} className="text-[#f4b52e]" /> : <ShieldCheck size={20} className="text-[#f4b52e]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-base tracking-tight text-[#fff8e8] font-['Outfit']">
                    PAINEL ADMIN
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isOwner ? 'bg-[#f4b52e] text-[#211b17]' : 'bg-[#3e3226] text-[#f4b52e] border border-[#67502d]'
                  }`}>
                    {isOwner ? '👑 OWNER' : '🛡️ ADMIN'}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-[#bcae98] line-clamp-1">
                  {currentUser.name} ({currentUser.email})
                </p>
              </div>
            </div>

            {/* Back Button (Mobile top-right) */}
            <div className="flex items-center gap-1 sm:hidden">
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center h-9 w-9 rounded-full border border-red-500/40 text-red-300 hover:bg-red-500/20 shrink-0"
                  title="Sair"
                >
                  <LogOut size={15} />
                </button>
              )}
              <button
                onClick={onCloseAdmin}
                className="flex items-center justify-center h-9 w-9 rounded-full border border-[#69543c] text-[#e8d9bf] hover:bg-[#2b241e] shrink-0"
                title="Voltar ao Site"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canCreate && (
              <>
                <button
                  onClick={() => setIsAIModalOpen(true)}
                  className="flex-1 sm:flex-none flex h-11 sm:h-10 items-center justify-center gap-2 rounded-full border border-[#f4b52e]/80 bg-[#2b231c] px-3.5 sm:px-4 text-xs font-extrabold text-[#f4b52e] active:scale-95 transition-all shadow-sm"
                  title="Cadastrar produto automaticamente enviando uma foto"
                >
                  <Sparkles size={16} />
                  <span className="truncate">Com IA</span>
                </button>

                <button
                  onClick={openNewProductForm}
                  className="flex-1 sm:flex-none flex h-11 sm:h-10 items-center justify-center gap-2 rounded-full bg-[#f4b52e] px-3.5 sm:px-4 text-xs font-extrabold text-[#261c14] active:scale-95 transition-all shadow-sm"
                >
                  <Plus size={16} />
                  <span className="truncate">Novo Produto</span>
                </button>
              </>
            )}

            {/* Logout & Back Buttons (Desktop) */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="hidden sm:flex items-center gap-1.5 h-10 rounded-full border border-red-500/30 px-3.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors shrink-0"
                title="Encerrar Sessão"
              >
                <LogOut size={14} />
                <span>Sair</span>
              </button>
            )}

            <button
              onClick={onCloseAdmin}
              className="hidden sm:flex items-center gap-1.5 h-10 rounded-full border border-[#69543c] px-4 text-xs font-bold text-[#e8d9bf] hover:bg-[#2b241e] transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Voltar ao Site</span>
            </button>
          </div>

        </div>

        {/* OWNER NAVIGATION TABS */}
        {isOwner && (
          <div className="container-lucca flex items-center gap-2 border-t border-[#2d251f] pt-2 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSection('products')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'products'
                  ? 'bg-[#f4b52e] text-[#211b17]'
                  : 'text-[#bcae98] hover:text-white hover:bg-[#2b241e]'
              }`}
            >
              <Package size={14} />
              <span>Produtos & Catálogo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('team')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'team'
                  ? 'bg-[#f4b52e] text-[#211b17]'
                  : 'text-[#bcae98] hover:text-white hover:bg-[#2b241e]'
              }`}
            >
              <Users size={14} />
              <span>Equipe & Convites (Owner)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('audit')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeSection === 'audit'
                  ? 'bg-[#f4b52e] text-[#211b17]'
                  : 'text-[#bcae98] hover:text-white hover:bg-[#2b241e]'
              }`}
            >
              <History size={14} />
              <span>Logs de Auditoria</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: CATÁLOGO DE PRODUTOS */}
      {/* ========================================================================= */}
      {activeSection === 'products' && (
        <div className="container-lucca pt-4 sm:pt-8 space-y-6 sm:space-y-8 animate-rise">
          
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-[16px] sm:rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#887864] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Produtos</span>
                <Package size={18} className="text-[#d97621] shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2c2118]">{products.length}</div>
              <span className="text-[10px] sm:text-[11px] text-[#7a6b5a] mt-0.5 sm:mt-1 block line-clamp-1">Cadastrados no catálogo</span>
            </div>

            <div className="rounded-[16px] sm:rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#887864] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Estoque Total</span>
                <DollarSign size={18} className="text-[#2b8a3e] shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2c2118] truncate">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#7a6b5a] mt-0.5 sm:mt-1 block line-clamp-1">Soma dos itens</span>
            </div>

            <div className="rounded-[16px] sm:rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#887864] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Destaques</span>
                <Tag size={18} className="text-[#f4b52e] shrink-0" />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold text-[#2c2118]">{featuredCount}</div>
              <span className="text-[10px] sm:text-[11px] text-[#7a6b5a] mt-0.5 sm:mt-1 block line-clamp-1">Com selo especial</span>
            </div>

            <div className="rounded-[16px] sm:rounded-[18px] border border-[#dfd5c5] bg-[#fbf8f0] p-3.5 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between text-[#887864] mb-1 sm:mb-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider line-clamp-1">Seu Perfil</span>
                <ShieldCheck size={18} className="text-[#d7ad55] shrink-0" />
              </div>
              <div className="text-base sm:text-xl font-extrabold text-[#2c2118] truncate">{currentUser.role.toUpperCase()}</div>
              <span className="text-[10px] sm:text-[11px] text-[#7a6b5a] mt-0.5 sm:mt-1 block line-clamp-1">
                {isOwner ? 'Acesso Irrestrito' : `${currentUser.permissions.length} permissões ativas`}
              </span>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#887864]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou descrição..."
                className="h-11 w-full rounded-full border border-[#ded2c0] bg-[#fbf8f0] pl-10 pr-4 text-xs text-[#241c16] placeholder:text-[#887864] outline-none focus:border-[#f4b52e]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(['Todos', 'Capinhas', 'Cabos e carregadores', 'Áudio', 'Proteção', 'Assistência'] as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-9 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-[#211b17] text-[#f4b52e] shadow-xs' 
                      : 'bg-[#ede5d5] text-[#695a48] hover:bg-[#dfd5c2]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="rounded-2xl border border-[#ded2c0] bg-[#fbf8f0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#241c16]">
                <thead className="border-b border-[#ded2c0] bg-[#ede5d5] font-bold text-[#695a48] uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5 sm:p-4">Produto</th>
                    <th className="p-3.5 sm:p-4">Categoria</th>
                    <th className="p-3.5 sm:p-4">Preço</th>
                    <th className="p-3.5 sm:p-4">Tag</th>
                    <th className="p-3.5 sm:p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded2c0]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#887864]">
                        Nenhum produto encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(product => (
                      <tr key={product.id} className="hover:bg-[#f4efe5] transition-colors">
                        <td className="p-3.5 sm:p-4 font-bold flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="h-9 w-9 rounded-lg object-cover border border-[#ded2c0]" />
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-[#211b17] text-[#f4b52e] flex items-center justify-center font-bold text-xs">
                              {product.name.charAt(0)}
                            </div>
                          )}
                          <div className="truncate max-w-[200px] sm:max-w-xs">
                            <span className="block truncate text-xs sm:text-sm">{product.name}</span>
                            <span className="block text-[10px] text-[#887864] font-normal truncate">{product.description}</span>
                          </div>
                        </td>
                        <td className="p-3.5 sm:p-4 text-[#695a48] font-medium">{product.category}</td>
                        <td className="p-3.5 sm:p-4 font-bold text-[#211b17]">
                          {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          {product.tag ? (
                            <span className="bg-[#f4b52e]/30 text-[#8f6412] px-2 py-0.5 rounded-full text-[10px] font-bold">
                              {product.tag}
                            </span>
                          ) : (
                            <span className="text-[#a49683] text-[10px]">-</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {canUpdate && (
                              <button
                                onClick={() => openEditProductForm(product)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ede5d5] text-[#211b17] hover:bg-[#f4b52e] transition-colors"
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
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
          <div className="rounded-2xl border border-[#ded2c0] bg-[#fbf8f0] p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4b52e]/20 text-[#f4b52e] border border-[#f4b52e]/40">
                <Send size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#211b17]">Convidar Novo Administrador</h3>
                <p className="text-xs text-[#887864]">Gere um convite com permissões granulares no banco de dados.</p>
              </div>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              {inviteError && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{inviteError}</span>
                </div>
              )}

              {inviteSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#695a48] mb-1.5">
                    E-mail do Novo Administrador *
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="novo.admin@luccacell.com.br"
                    className="h-11 w-full rounded-xl border border-[#ded2c0] bg-white px-4 text-xs text-[#211b17] outline-none focus:border-[#f4b52e]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="h-11 flex items-center justify-center gap-2 rounded-xl bg-[#211b17] px-6 text-xs font-extrabold text-[#f4b52e] hover:bg-[#382e26] transition-colors disabled:opacity-50"
                >
                  <Send size={15} />
                  <span>{isInviting ? 'Gerando...' : 'Criar Convite'}</span>
                </button>
              </div>

              {/* Permissões Granulares Checkboxes */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#695a48] mb-2">
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
                          ? 'bg-[#f4b52e]/20 border-[#f4b52e] text-[#211b17] font-bold'
                          : 'bg-white border-[#ded2c0] text-[#695a48]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={invitePermissions.includes(perm.id as PermissionType)}
                        onChange={() => togglePermissionSelection(perm.id as PermissionType)}
                        className="rounded accent-[#f4b52e]"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Lista de Administradores Ativos */}
          <div className="rounded-2xl border border-[#ded2c0] bg-[#fbf8f0] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#ded2c0] bg-[#ede5d5] flex items-center justify-between">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#695a48]">
                Administradores Cadastrados ({adminList.length})
              </h4>
              <button onClick={loadTeamData} className="text-xs text-[#8f6412] font-bold hover:underline">
                Atualizar Lista
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#241c16]">
                <thead className="border-b border-[#ded2c0] bg-[#f4efe5] text-[#887864] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Nome / E-mail</th>
                    <th className="p-3.5">Papel</th>
                    <th className="p-3.5">Permissões</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded2c0]">
                  {loadingTeam ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#887864]">Carregando equipe...</td>
                    </tr>
                  ) : adminList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#887864]">Nenhum administrador cadastrado.</td>
                    </tr>
                  ) : (
                    adminList.map(admin => (
                      <tr key={admin.id} className="hover:bg-[#f4efe5]">
                        <td className="p-3.5 font-bold">
                          <div>{admin.name}</div>
                          <div className="text-[10px] text-[#887864] font-normal">{admin.email}</div>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            admin.role === 'owner' ? 'bg-[#f4b52e] text-[#211b17]' : 'bg-[#ede5d5] text-[#695a48]'
                          }`}>
                            {admin.role === 'owner' ? '👑 OWNER' : '🛡️ ADMIN'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {admin.role === 'owner' ? (
                            <span className="text-[11px] font-bold text-[#2b8a3e]">Acesso Total</span>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {admin.permissions.map(p => (
                                <span key={p} className="bg-white border border-[#ded2c0] text-[9px] px-1.5 py-0.5 rounded font-mono">
                                  {p.replace('products.', '')}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            admin.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
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
                                  ? 'border border-red-400 text-red-600 hover:bg-red-50' 
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
            <div className="rounded-2xl border border-[#ded2c0] bg-[#fbf8f0] p-4 shadow-sm">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#695a48] mb-3">
                Convites Pendentes de Ativação ({invitationsList.length})
              </h4>
              <div className="space-y-2">
                {invitationsList.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#ded2c0] text-xs">
                    <div>
                      <span className="font-bold text-[#211b17]">{inv.email}</span>
                      <span className="ml-2 text-[10px] text-[#887864] font-mono">
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
          <div className="rounded-2xl border border-[#ded2c0] bg-[#fbf8f0] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#ded2c0] bg-[#ede5d5] flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-[#695a48]">
                  Logs de Auditoria de Segurança
                </h4>
                <p className="text-[11px] text-[#887864]">Registro imutável de ações administrativas gravadas no banco de dados.</p>
              </div>
              <button onClick={loadAuditLogs} className="text-xs text-[#8f6412] font-bold hover:underline">
                Recarregar Logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#241c16]">
                <thead className="border-b border-[#ded2c0] bg-[#f4efe5] text-[#887864] text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Usuário (Actor)</th>
                    <th className="p-3.5">Ação</th>
                    <th className="p-3.5">Recurso</th>
                    <th className="p-3.5">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ded2c0]">
                  {loadingAudit ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#887864]">Carregando logs de auditoria...</td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#887864]">Nenhum registro de auditoria encontrado.</td>
                    </tr>
                  ) : (
                    auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-[#f4efe5]">
                        <td className="p-3.5 font-mono text-[11px] text-[#887864] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3.5 font-bold text-[#211b17]">{log.actor_email}</td>
                        <td className="p-3.5">
                          <span className="bg-[#211b17] text-[#f4b52e] px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-[#695a48]">{log.resource || '-'}</td>
                        <td className="p-3.5 text-[11px] font-mono text-[#887864] max-w-xs truncate">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-[24px] sm:rounded-2xl border border-[#45382c] bg-[#211b17] p-4 sm:p-6 text-[#fff4dc] shadow-2xl animate-rise flex flex-col">
            
            <div className="flex items-center justify-between border-b border-[#3e3226] pb-3 mb-4 sticky top-0 bg-[#211b17] z-10">
              <h3 className="display text-base sm:text-lg font-bold text-[#fff4dc]">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#45382c] text-[#bcae98] hover:bg-[#2b241e]"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Capinha Silicone iPhone 15 Pro Max"
                  className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
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
                    URL da Imagem (Opcional)
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={e => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://exemplo.com/foto.jpg"
                    className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Preço de Venda (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    placeholder="89,90"
                    className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                    Preço Antigo (R$)
                  </label>
                  <input
                    type="text"
                    value={formData.oldPrice}
                    onChange={e => setFormData({ ...formData, oldPrice: e.target.value })}
                    placeholder="109,90"
                    className="h-11 w-full rounded-xl border border-[#45382c] bg-[#171411] px-3.5 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[.1em] text-[#c9bdad] mb-1.5">
                  Descrição
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[#45382c] bg-[#171411] p-3 text-xs text-[#fff4dc] outline-none focus:border-[#f4b52e]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 bg-[#f4b52e] text-[#211b17] rounded-xl font-bold text-xs hover:bg-[#eab23d] transition-colors"
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
