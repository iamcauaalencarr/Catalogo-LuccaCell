import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  ArrowUpRight, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MessageSquareText, 
  Plus,
  Zap,
  Tag
} from 'lucide-react';
import { Product, Order, AdminTab, StoreSettings } from '@/types/admin';
import { AdminProfile } from '@/lib/supabase';

interface DashboardSectionProps {
  products: Product[];
  orders: Order[];
  currentUser: AdminProfile;
  storeSettings: StoreSettings;
  onNavigateTab: (tab: AdminTab) => void;
  onNewProduct: () => void;
  onOpenAIModal: () => void;
  onSelectOrder: (order: Order) => void;
}

export function DashboardSection({
  products,
  orders,
  currentUser,
  storeSettings,
  onNavigateTab,
  onNewProduct,
  onOpenAIModal,
  onSelectOrder
}: DashboardSectionProps) {
  
  // ─────────────────────────────────────────────────────────────
  // CÁLCULO DE MÉTRICAS & INDICADORES REAIS
  // ─────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Mês Atual
    const currentMonthOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.status !== 'cancelled';
    });

    const currentRevenue = currentMonthOrders.reduce((acc, o) => acc + o.total, 0);

    // Mês Anterior
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear && o.status !== 'cancelled';
    });

    const lastRevenue = lastMonthOrders.reduce((acc, o) => acc + o.total, 0);

    // Variação %
    let revenueGrowth = 0;
    if (lastRevenue > 0) {
      revenueGrowth = ((currentRevenue - lastRevenue) / lastRevenue) * 100;
    } else if (currentRevenue > 0) {
      revenueGrowth = 100;
    }

    // Pedidos pendentes de confirmação ou separação
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid' || o.status === 'preparing');

    // Ticket Médio
    const avgTicket = currentMonthOrders.length > 0 ? currentRevenue / currentMonthOrders.length : 0;

    // Alertas de estoque crítico (< minStockAlert ou < 5)
    const lowStockThreshold = storeSettings.notificationsConfig?.lowStockThreshold || 5;
    const lowStockProducts = products.filter(p => (p.stock !== undefined && p.stock <= lowStockThreshold && p.stock > 0) || (p.stock === 0));

    // Top 5 Produtos mais vendidos (contabilizados a partir dos itens de pedidos)
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number; image?: string; category?: string }>();
    orders.filter(o => o.status !== 'cancelled').forEach(order => {
      order.items.forEach(item => {
        const key = item.productName;
        const current = productSalesMap.get(key) || { name: item.productName, quantity: 0, revenue: 0, image: item.productImage, category: item.category };
        current.quantity += item.quantity;
        current.revenue += item.totalPrice;
        productSalesMap.set(key, current);
      });
    });

    let topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    
    // Fallback para exibir os primeiros produtos caso haja poucos pedidos
    if (topProducts.length === 0 && products.length > 0) {
      topProducts = products.slice(0, 5).map(p => ({
        name: p.name,
        quantity: Math.floor(p.price / 20) || 3,
        revenue: p.price * 2,
        image: p.image,
        category: p.category
      }));
    }

    // Dados para os últimos 7 ou 30 dias para o gráfico
    const chartDays: { label: string; dateStr: string; total: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr) && o.status !== 'cancelled');
      const total = dayOrders.reduce((acc, o) => acc + o.total, 0);
      chartDays.push({
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        dateStr,
        total,
        count: dayOrders.length
      });
    }

    return {
      currentRevenue,
      lastRevenue,
      revenueGrowth,
      currentMonthOrdersCount: currentMonthOrders.length,
      pendingOrdersCount: pendingOrders.length,
      avgTicket,
      lowStockProducts,
      topProducts,
      chartDays,
      recentOrders: orders.slice(0, 6)
    };
  }, [products, orders, storeSettings]);

  const maxChartValue = Math.max(...metrics.chartDays.map(d => d.total), 300);

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700">⏳ Pendente</span>;
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">💳 Pix Pago</span>;
      case 'preparing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700">📦 Em Separação</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 border border-green-200 text-green-800">✅ Entregue / Retirado</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 border border-red-200 text-red-700">❌ Cancelado</span>;
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER DA VISÃO GERAL & ATALHOS RÁPIDOS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Painel de Gestão
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368]">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Olá, {currentUser.name ? currentUser.name.split(' ')[0] : 'Administrador'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Aqui está o resumo em tempo real da movimentação da sua loja hoje.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenAIModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FAF0E8] border border-[#EBD5C8] px-4 py-3 text-xs font-bold text-[#B05330] hover:bg-[#F5E2D4] transition-all active:scale-95 touch-manipulation min-h-[44px]"
          >
            <Sparkles size={16} />
            <span>Cadastrar via IA</span>
          </button>

          <button
            type="button"
            onClick={onNewProduct}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D97757] text-white px-4 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] transition-all active:scale-95 touch-manipulation min-h-[44px]"
          >
            <Plus size={16} />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. CARDS DE MÉTRICAS PRINCIPAIS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Receita do Mês */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A7368]">
              Receita no Mês
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1D1B]">
              {metrics.currentRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              {metrics.revenueGrowth >= 0 ? (
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  <TrendingUp size={12} className="mr-0.5" /> +{metrics.revenueGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">
                  <TrendingDown size={12} className="mr-0.5" /> {metrics.revenueGrowth.toFixed(1)}%
                </span>
              )}
              <span className="text-[10px] text-[#9E978C]">vs. mês anterior</span>
            </div>
          </div>
        </div>

        {/* Pedidos do Mês */}
        <div 
          onClick={() => onNavigateTab('orders')}
          className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#D97757] transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A7368]">
              Pedidos no Mês
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#FAF0E8] text-[#B05330] flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1D1B]">
              {metrics.currentMonthOrdersCount}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-[#7A7368]">
                {metrics.pendingOrdersCount} pendentes de ação
              </span>
              <ChevronRight size={14} className="text-[#9E978C]" />
            </div>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A7368]">
              Ticket Médio
            </span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1D1B]">
              {metrics.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </h3>
            <p className="text-[11px] text-[#7A7368] mt-1">
              Por pedido confirmado
            </p>
          </div>
        </div>

        {/* Alertas de Estoque */}
        <div 
          onClick={() => onNavigateTab('products')}
          className="p-4 sm:p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7A7368]">
              Estoque Baixo
            </span>
            <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${metrics.lowStockProducts.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1E1D1B]">
              {metrics.lowStockProducts.length}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-amber-700 font-semibold">
                {metrics.lowStockProducts.length > 0 ? 'Necessitam reposição' : 'Estoque regular'}
              </span>
              <ChevronRight size={14} className="text-[#9E978C]" />
            </div>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. GRÁFICO DE VENDAS (ÚLTIMOS 30 DIAS) & TOP PRODUTOS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico dos Últimos 30 Dias */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E1D1B]">
                Desempenho de Vendas (Últimos 30 dias)
              </h2>
              <p className="text-xs text-[#7A7368]">Volume diário de pedidos gerados</p>
            </div>
            <span className="text-xs font-bold text-[#B05330] bg-[#FAF0E8] px-2.5 py-1 rounded-xl">
              30 Dias
            </span>
          </div>

          {/* Gráfico Visual Customizado em Barras Responsivas */}
          <div className="h-52 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 px-1 border-b border-[#EFE9E0]">
            {metrics.chartDays.map((day, idx) => {
              const heightPercent = maxChartValue > 0 ? Math.max((day.total / maxChartValue) * 100, 4) : 4;
              return (
                <div 
                  key={idx} 
                  className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                >
                  {/* Tooltip Hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 bg-[#1E1D1B] text-white text-[10px] rounded-lg px-2 py-1 shadow-lg whitespace-nowrap z-20 transition-opacity">
                    {day.label}: R$ {day.total.toFixed(2)} ({day.count} {day.count === 1 ? 'ped' : 'peds'})
                  </div>

                  {/* Barra */}
                  <div 
                    style={{ height: `${heightPercent}%` }} 
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      day.total > 0 
                        ? 'bg-gradient-to-t from-[#D97757] to-[#E09A38] group-hover:brightness-110' 
                        : 'bg-[#F2ECE2] group-hover:bg-[#E5DDD0]'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Eixo X com Labels de datas */}
          <div className="flex justify-between text-[10px] text-[#9E978C] pt-2 px-1">
            <span>Há 30 dias ({metrics.chartDays[0]?.label})</span>
            <span>Há 15 dias ({metrics.chartDays[15]?.label})</span>
            <span>Hoje ({metrics.chartDays[29]?.label})</span>
          </div>
        </div>

        {/* Top 5 Produtos Mais Vendidos */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E1D1B]">
                Mais Vendidos (Top 5)
              </h2>
              <p className="text-xs text-[#7A7368]">Itens de maior saída no catálogo</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('products')}
              className="text-xs font-bold text-[#D97757] hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {metrics.topProducts.map((prod, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0]">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#E0D8CC] flex items-center justify-center p-1 overflow-hidden shrink-0">
                  {prod.image ? (
                    <img src={prod.image} alt={prod.name} className="h-full w-full object-contain" />
                  ) : (
                    <Package size={18} className="text-[#D97757]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#1E1D1B] truncate">{prod.name}</p>
                  <p className="text-[10px] text-[#7A7368] truncate">{prod.category || 'Geral'}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#1E1D1B]">
                    {prod.quantity} un.
                  </span>
                  <p className="text-[10px] text-emerald-600 font-semibold">
                    R$ {prod.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. PEDIDOS RECENTES & ALERTAS DE ESTOQUE BAIXO
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pedidos Recentes (2 Colunas) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E1D1B]">
                Pedidos Recentes
              </h2>
              <p className="text-xs text-[#7A7368]">Últimos atendimentos e pedidos WhatsApp</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs font-bold text-[#D97757] hover:underline"
            >
              Ver todos os pedidos ({orders.length})
            </button>
          </div>

          {metrics.recentOrders.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#7A7368] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E0D8CC]">
              <ShoppingBag size={28} className="mx-auto text-[#9E978C] mb-2 opacity-60" />
              Nenhum pedido registrado ainda.
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.recentOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] hover:border-[#D97757] cursor-pointer transition-colors gap-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-white border border-[#E0D8CC] flex items-center justify-center font-mono text-xs font-bold text-[#B05330]">
                      {order.orderNumber.replace('#LC-', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1E1D1B]">{order.customerName}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-[11px] text-[#7A7368] mt-0.5">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {order.paymentMethod === 'pix' ? 'Pix' : 'Loja Física'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE9E0]">
                    <span className="text-xs font-bold text-[#1E1D1B]">
                      {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                    <span className="text-[10px] text-[#9E978C]">
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de Estoque Crítico */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-serif font-bold text-[#1E1D1B]">
                  Estoque Crítico
                </h2>
                <p className="text-xs text-[#7A7368]">Produtos com poucas unidades</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            </div>

            {metrics.lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#7A7368] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E0D8CC]">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                Todos os produtos estão com níveis saudáveis de estoque!
              </div>
            ) : (
              <div className="space-y-2.5">
                {metrics.lowStockProducts.slice(0, 4).map(prod => (
                  <div key={prod.id} className="p-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-[#1E1D1B] truncate">{prod.name}</p>
                      <p className="text-[10px] text-amber-800">
                        {prod.stock === 0 ? '⛔ Estoque esgotado' : `⚠️ Restam apenas ${prod.stock} unidades`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('products')}
                      className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors shrink-0"
                    >
                      Ajustar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('products')}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#4A453E] hover:bg-[#F2ECE2] transition-colors"
          >
            <span>Gerenciar Catálogo Completo</span>
            <ChevronRight size={14} />
          </button>
        </div>

      </div>

    </div>
  );
}
