import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Users, 
  TicketPercent, 
  MessageSquareText, 
  ShieldCheck, 
  History, 
  Settings, 
  Sparkles, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Plus, 
  ChevronRight,
  Shield,
  ChevronDown,
  Store
} from 'lucide-react';
import { AdminTab, StoreSettings } from '@/types/admin';
import { AdminProfile } from '@/lib/supabase';
import logoPath from '@assets/LOGO_1_1786564407567.png';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  currentUser: AdminProfile;
  storeSettings: StoreSettings;
  pendingOrdersCount: number;
  pendingRequestsCount: number;
  lowStockCount: number;
  onNewProduct: () => void;
  onOpenAIModal: () => void;
  onCloseAdmin: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export function AdminLayout({
  activeTab,
  onSelectTab,
  currentUser,
  storeSettings,
  pendingOrdersCount,
  pendingRequestsCount,
  lowStockCount,
  onNewProduct,
  onOpenAIModal,
  onCloseAdmin,
  onLogout,
  children
}: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const totalNotifications = pendingOrdersCount + pendingRequestsCount + lowStockCount;

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    group: 'principal' | 'vendas' | 'gestao' | 'sistema';
  }[] = [
    // Principal
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, group: 'principal' },
    { id: 'products', label: 'Produtos', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-amber-500', group: 'principal' },
    { id: 'categories', label: 'Categorias', icon: FolderTree, group: 'principal' },
    
    // Vendas
    { id: 'orders', label: 'Pedidos (WhatsApp)', icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined, badgeColor: 'bg-[#D97757]', group: 'vendas' },
    { id: 'requests', label: 'Solicitações', icon: MessageSquareText, badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined, badgeColor: 'bg-cyan-600', group: 'vendas' },
    { id: 'customers', label: 'Clientes', icon: Users, group: 'vendas' },
    { id: 'coupons', label: 'Cupons & Promoções', icon: TicketPercent, group: 'vendas' },

    // Gestão & Sistema
    { id: 'team', label: 'Equipe & Acessos', icon: ShieldCheck, group: 'gestao' },
    { id: 'audit', label: 'Auditoria de Logs', icon: History, group: 'gestao' },
    { id: 'settings', label: 'Configurações', icon: Settings, group: 'sistema' },
    { id: 'ai_playground', label: 'Playground de IA', icon: Sparkles, group: 'sistema' },
  ];

  const getTabTitle = (tab: AdminTab) => {
    const item = navItems.find(i => i.id === tab);
    return item ? item.label : 'Painel Administrativo';
  };

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#1E1D1B] flex flex-col font-sans">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER SUPERIOR (MOBILE & DESKTOP)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E7E0D5] px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-[#1E1D1B] hover:bg-[#F2ECE2] active:scale-95 transition-all touch-manipulation"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={20} />
          </button>

          {/* Logo e Nome */}
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#D97757] flex items-center justify-center p-1 text-white shadow-xs">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#1E1D1B]">
                  Lucca Cell
                </span>
                <span className="rounded-md bg-[#FAF0E8] border border-[#EBD5C8] px-1.5 py-0.5 text-[10px] font-bold text-[#B05330] uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-[#7A7368] hidden sm:block">
                Painel de Controle Oficial
              </p>
            </div>
          </div>
        </div>

        {/* Breadcrumb / Título no Desktop */}
        <div className="hidden lg:flex items-center gap-2 text-sm text-[#7A7368]">
          <span>Painel</span>
          <ChevronRight size={14} />
          <span className="font-semibold text-[#1E1D1B]">{getTabTitle(activeTab)}</span>
        </div>

        {/* Ações Rápidas Header */}
        <div className="flex items-center gap-2">
          {/* Scanner IA Rápido */}
          <button
            type="button"
            onClick={onOpenAIModal}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#FAF0E8] border border-[#EBD5C8] px-3 py-2 text-xs font-semibold text-[#B05330] hover:bg-[#F5E2D4] transition-all touch-manipulation"
          >
            <Sparkles size={14} />
            <span>Cadastrar via IA</span>
          </button>

          {/* Notificações Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-[#1E1D1B] hover:bg-[#F2ECE2] active:scale-95 transition-all touch-manipulation"
              aria-label="Ver notificações"
            >
              <Bell size={18} />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#D97757] text-[10px] font-bold text-white shadow-xs">
                  {totalNotifications > 9 ? '9+' : totalNotifications}
                </span>
              )}
            </button>

            {/* Painel de Notificações */}
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsNotificationsOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-[#E7E0D5] bg-[#FFFFFF] p-3 shadow-xl z-50 animate-rise">
                  <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2 mb-2">
                    <span className="font-bold text-sm text-[#1E1D1B]">Notificações</span>
                    <span className="text-[11px] text-[#7A7368]">{totalNotifications} pendências</span>
                  </div>

                  <div className="space-y-2">
                    {pendingOrdersCount > 0 && (
                      <div 
                        onClick={() => { onSelectTab('orders'); setIsNotificationsOpen(false); }}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF0E8] hover:bg-[#F5E2D4] cursor-pointer transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-[#D97757] text-white">
                          <ShoppingBag size={14} />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-[#1E1D1B]">
                            {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido pendente' : 'pedidos pendentes'}
                          </p>
                          <p className="text-[11px] text-[#7A7368]">Aguardando confirmação de Pix ou separação</p>
                        </div>
                      </div>
                    )}

                    {pendingRequestsCount > 0 && (
                      <div 
                        onClick={() => { onSelectTab('requests'); setIsNotificationsOpen(false); }}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 cursor-pointer transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-cyan-600 text-white">
                          <MessageSquareText size={14} />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-[#1E1D1B]">
                            {pendingRequestsCount} {pendingRequestsCount === 1 ? 'solicitação de cliente' : 'solicitações de clientes'}
                          </p>
                          <p className="text-[11px] text-[#7A7368]">Clientes procurando produtos sem estoque</p>
                        </div>
                      </div>
                    )}

                    {lowStockCount > 0 && (
                      <div 
                        onClick={() => { onSelectTab('products'); setIsNotificationsOpen(false); }}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 cursor-pointer transition-colors"
                      >
                        <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                          <Package size={14} />
                        </div>
                        <div className="flex-1 text-xs">
                          <p className="font-semibold text-[#1E1D1B]">
                            {lowStockCount} {lowStockCount === 1 ? 'produto com estoque baixo' : 'produtos com estoque baixo'}
                          </p>
                          <p className="text-[11px] text-[#7A7368]">Verifique para não perder vendas</p>
                        </div>
                      </div>
                    )}

                    {totalNotifications === 0 && (
                      <div className="p-4 text-center text-xs text-[#7A7368]">
                        🎉 Nenhuma pendência urgente no momento!
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Ver Catálogo Público */}
          <button
            type="button"
            onClick={onCloseAdmin}
            className="flex items-center gap-1.5 rounded-xl bg-[#1E1D1B] text-white px-3 py-2 text-xs font-semibold hover:bg-[#383531] transition-all touch-manipulation"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Ver Loja</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. ESTRUTURA PRINCIPAL (SIDEBAR DESKTOP + CONTEÚDO)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-row">
        
        {/* Sidebar Desktop */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#E7E0D5] bg-[#FFFFFF] p-4 shrink-0">
          
          {/* Card Usuário Logado */}
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E7E0D5] mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#D97757]/15 text-[#B05330] font-bold flex items-center justify-center text-sm uppercase">
                {currentUser.name ? currentUser.name.charAt(0) : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#1E1D1B] truncate">{currentUser.name || 'Administrador'}</p>
                <div className="flex items-center gap-1">
                  <Shield size={10} className="text-[#B05330]" />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7A7368]">
                    {currentUser.role === 'owner' ? 'Proprietário' : 'Admin'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Navegação */}
          <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
            
            {/* Grupo: Principal */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#9E978C] px-3 mb-1.5">
                Principal
              </p>
              <div className="space-y-1">
                {navItems.filter(i => i.group === 'principal').map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                        isActive
                          ? 'bg-[#D97757] text-white shadow-xs'
                          : 'text-[#4A453E] hover:bg-[#FAF7F2] hover:text-[#1E1D1B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-[#D97757]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grupo: Vendas */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#9E978C] px-3 mb-1.5">
                Vendas & Clientes
              </p>
              <div className="space-y-1">
                {navItems.filter(i => i.group === 'vendas').map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                        isActive
                          ? 'bg-[#D97757] text-white shadow-xs'
                          : 'text-[#4A453E] hover:bg-[#FAF7F2] hover:text-[#1E1D1B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-[#D97757]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grupo: Gestão & Config */}
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-[#9E978C] px-3 mb-1.5">
                Gestão & Configurações
              </p>
              <div className="space-y-1">
                {navItems.filter(i => i.group === 'gestao' || i.group === 'sistema').map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                        isActive
                          ? 'bg-[#D97757] text-white shadow-xs'
                          : 'text-[#4A453E] hover:bg-[#FAF7F2] hover:text-[#1E1D1B]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </nav>

          {/* Logout Footer */}
          {onLogout && (
            <div className="pt-3 border-t border-[#E7E0D5] mt-auto">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#B91C1C] hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </aside>

        {/* ─────────────────────────────────────────────────────────────
            3. ÁREA DE CONTEÚDO PRINCIPAL (COM PADDING INFERIOR NO MOBILE)
        ───────────────────────────────────────────────────────────── */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM NAVIGATION BAR (FIXA NO MOBILE)
      ───────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF]/95 backdrop-blur-lg border-t border-[#E7E0D5] px-2 py-1.5 flex items-center justify-around shadow-lg">
        
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold min-w-[56px] min-h-[48px] touch-manipulation ${
            activeTab === 'dashboard' ? 'text-[#D97757]' : 'text-[#7A7368]'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Início</span>
        </button>

        {/* Produtos */}
        <button
          type="button"
          onClick={() => onSelectTab('products')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold min-w-[56px] min-h-[48px] touch-manipulation ${
            activeTab === 'products' ? 'text-[#D97757]' : 'text-[#7A7368]'
          }`}
        >
          <Package size={20} />
          <span>Produtos</span>
        </button>

        {/* Botão Central de Ação Rápida */}
        <button
          type="button"
          onClick={onNewProduct}
          className="flex flex-col items-center justify-center -mt-5 h-12 w-12 rounded-full bg-[#D97757] text-white shadow-lg active:scale-95 transition-transform touch-manipulation"
          aria-label="Cadastrar novo produto"
        >
          <Plus size={24} />
        </button>

        {/* Pedidos */}
        <button
          type="button"
          onClick={() => onSelectTab('orders')}
          className={`relative flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold min-w-[56px] min-h-[48px] touch-manipulation ${
            activeTab === 'orders' ? 'text-[#D97757]' : 'text-[#7A7368]'
          }`}
        >
          <ShoppingBag size={20} />
          <span>Pedidos</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-[#D97757]" />
          )}
        </button>

        {/* Menu "Mais" */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-bold min-w-[56px] min-h-[48px] touch-manipulation ${
            isMobileMenuOpen ? 'text-[#D97757]' : 'text-[#7A7368]'
          }`}
        >
          <Menu size={20} />
          <span>Mais</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. DRAWER / MENU DESLIZANTE COMPLETO (MOBILE)
      ───────────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-4/5 max-w-xs h-full bg-[#FFFFFF] p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide z-10">
            <div>
              {/* Header Drawer */}
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE9E0] mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#D97757] text-white flex items-center justify-center">
                    <Store size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1E1D1B]">Menu Completo</h3>
                    <p className="text-[10px] text-[#7A7368]">{currentUser.name || 'Admin'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-[#7A7368] hover:bg-[#FAF7F2]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Todos os Módulos */}
              <div className="space-y-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-colors touch-manipulation min-h-[44px] ${
                        isActive
                          ? 'bg-[#D97757] text-white'
                          : 'text-[#1E1D1B] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${item.badgeColor || 'bg-[#D97757]'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Mobile */}
            {onLogout && (
              <div className="pt-4 border-t border-[#EFE9E0] mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 min-h-[44px] touch-manipulation"
                >
                  <LogOut size={18} />
                  <span>Sair do Painel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
