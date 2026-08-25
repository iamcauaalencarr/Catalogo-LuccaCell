import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MessageCircle, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  XCircle, 
  Printer, 
  Plus, 
  Calendar, 
  Filter, 
  ExternalLink, 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  Trash2, 
  DollarSign, 
  Check, 
  X,
  CreditCard
} from 'lucide-react';
import { Order, OrderStatus, StoreSettings, Product } from '@/types/admin';
import { AdminStore } from '@/services/adminStore';
import { AdminProfile } from '@/lib/supabase';
import { ThermalReceiptModal, ReceiptData } from '@/components/ThermalReceiptModal';

interface OrdersSectionProps {
  orders: Order[];
  products: Product[];
  storeSettings: StoreSettings;
  currentUser: AdminProfile;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onConfirmPayment: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onCreateOrder: (orderData: any) => void;
}

export function OrdersSection({
  orders,
  products,
  storeSettings,
  currentUser,
  onUpdateOrderStatus,
  onConfirmPayment,
  onDeleteOrder,
  onCreateOrder
}: OrdersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Modal Novo Pedido Manual
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'loja_fisica'>('pix');
  const [selectedProductsForOrder, setSelectedProductsForOrder] = useState<{ product: Product; quantity: number }[]>([]);

  // Modal de Impressão / Recibo
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Filtragem
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesNum = o.orderNumber.toLowerCase().includes(q);
        const matchesName = o.customerName.toLowerCase().includes(q);
        const matchesPhone = o.customerPhone.includes(q);
        if (!matchesNum && !matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Handlers
  const handleOpenWhatsApp = (order: Order) => {
    const url = AdminStore.generateWhatsAppOrderLink(order, storeSettings);
    window.open(url, '_blank');
  };

  const handlePrintReceipt = (order: Order) => {
    setReceiptOrder(order);
  };

  const handleAddProductToManualOrder = (prodId: number) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setSelectedProductsForOrder(prev => {
      const existing = prev.find(item => item.product.id === prodId);
      if (existing) {
        return prev.map(item => item.product.id === prodId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product: prod, quantity: 1 }];
    });
  };

  const handleCreateManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || selectedProductsForOrder.length === 0) return;

    const subtotal = selectedProductsForOrder.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    const deliveryFee = customerAddress.trim() ? storeSettings.deliveryConfig.defaultDeliveryFee : 0;
    const total = subtotal + deliveryFee;

    const newOrderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || '97991554563',
      customerAddress: customerAddress.trim() || undefined,
      customerNotes: customerNotes.trim() || undefined,
      items: selectedProductsForOrder.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image,
        category: item.product.category,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity
      })),
      subtotal,
      discount: 0,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: 'pending' as const,
      status: 'pending' as const
    };

    onCreateOrder(newOrderPayload);
    setIsNewOrderModalOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerNotes('');
    setSelectedProductsForOrder([]);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700">⏳ Pendente</span>;
      case 'paid':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">💳 Pix Confirmado</span>;
      case 'preparing':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-blue-700">📦 Em Separação</span>;
      case 'delivered':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-50 border border-green-200 text-green-800">✅ Entregue / Retirado</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 border border-red-200 text-red-700">❌ Cancelado</span>;
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & BOTÃO NOVO PEDIDO MANUAL
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Fluxo Comercial
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              WhatsApp & Balcão
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Gestão de Pedidos
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Confirme pagamentos via Pix, combine entregas e envie mensagens formatadas no WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewOrderModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D97757] text-white px-5 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
        >
          <Plus size={16} />
          <span>Registrar Pedido Manual</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. FILTROS POR STATUS & BUSCA
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E7E0D5] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="sm:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E978C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por número do pedido (#LC-...), cliente ou telefone..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs sm:text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            >
              <option value="all">🔍 Todos os Status ({orders.length})</option>
              <option value="pending">⏳ Pendentes ({orders.filter(o => o.status === 'pending').length})</option>
              <option value="paid">💳 Pix Confirmado ({orders.filter(o => o.status === 'paid').length})</option>
              <option value="preparing">📦 Em Separação ({orders.filter(o => o.status === 'preparing').length})</option>
              <option value="delivered">✅ Entregues / Retirados ({orders.filter(o => o.status === 'delivered').length})</option>
              <option value="cancelled">❌ Cancelados ({orders.filter(o => o.status === 'cancelled').length})</option>
            </select>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. LISTA DE PEDIDOS (CARDS MOBILE / TABELA DESKTOP)
      ───────────────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs space-y-3">
          <ShoppingBag size={32} className="mx-auto text-[#9E978C]" />
          <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
            Nenhum pedido encontrado
          </h3>
          <p className="text-xs text-[#7A7368]">
            Não encontramos pedidos correspondentes ao filtro aplicado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#D97757] transition-colors"
            >
              {/* Topo do Card */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#B05330] bg-[#FAF0E8] px-2.5 py-1 rounded-xl">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-[#7A7368]">
                      {new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {getStatusBadge(order.status)}
                </div>

                {/* Cliente */}
                <div className="space-y-1 mb-3">
                  <h3 className="text-sm font-bold text-[#1E1D1B] flex items-center gap-1.5">
                    <User size={14} className="text-[#D97757]" />
                    <span>{order.customerName}</span>
                  </h3>
                  <p className="text-xs text-[#7A7368] flex items-center gap-1.5">
                    <Phone size={13} className="text-[#9E978C]" />
                    <span>{order.customerPhone}</span>
                  </p>
                  {order.customerAddress && (
                    <p className="text-xs text-[#7A7368] flex items-center gap-1.5">
                      <MapPin size={13} className="text-[#9E978C]" />
                      <span className="truncate">{order.customerAddress}</span>
                    </p>
                  )}
                </div>

                {/* Itens do Pedido */}
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E978C]">
                    Itens Solicitados ({order.items.length})
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-[#1E1D1B] truncate max-w-[200px]">
                          <strong>{item.quantity}x</strong> {item.productName}
                        </span>
                        <span className="font-bold text-[#1E1D1B]">
                          R$ {item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total & Forma de Pagamento */}
                <div className="flex items-center justify-between pt-3 text-xs">
                  <div>
                    <span className="text-[#7A7368]">Pagamento: </span>
                    <strong className="text-[#1E1D1B]">{order.paymentMethod === 'pix' ? 'Chave Pix' : 'Na Loja Física'}</strong>
                    {order.paymentStatus === 'confirmed' ? (
                      <span className="ml-1.5 text-[10px] text-emerald-600 font-bold">✅ Confirmado</span>
                    ) : (
                      <span className="ml-1.5 text-[10px] text-amber-600 font-bold">⏳ Pendente</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-[#7A7368]">Total: </span>
                    <strong className="text-base font-serif font-bold text-[#1E1D1B]">
                      {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Ações do Pedido (Mobile First >= 44px) */}
              <div className="pt-3 border-t border-[#EFE9E0] flex flex-wrap items-center justify-between gap-2">
                
                {/* Botão WhatsApp wa.me */}
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(order)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs min-h-[44px] transition-colors"
                >
                  <MessageCircle size={16} />
                  <span>Enviar no WhatsApp</span>
                </button>

                {/* Confirmação Manual de Pagamento */}
                {order.paymentStatus !== 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => onConfirmPayment(order.id)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-2xl bg-[#FAF0E8] border border-[#EBD5C8] text-[#B05330] hover:bg-[#F5E2D4] text-xs font-bold min-h-[44px] transition-colors"
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirmar Pix</span>
                  </button>
                )}

                {/* Seletor de Mudança de Status */}
                <select
                  value={order.status}
                  onChange={e => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                  className="h-11 px-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                >
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="preparing">Em Separação</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelar</option>
                </select>

                {/* Imprimir Nota */}
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(order)}
                  className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-[#7A7368] hover:bg-[#F2ECE2] hover:text-[#1E1D1B] min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Imprimir nota do pedido"
                >
                  <Printer size={16} />
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. MODAL NOVO PEDIDO MANUAL
      ───────────────────────────────────────────────────────────── */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl flex flex-col overflow-hidden animate-rise space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[#D97757] text-white flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
                  Registrar Pedido Manual (Balcão / Whats)
                </h3>
              </div>
              <button type="button" onClick={() => setIsNewOrderModalOpen(false)} className="text-[#7A7368]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrderSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Nome do Cliente *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B] font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                    WhatsApp do Cliente
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="97991554563"
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                  >
                    <option value="pix">Chave Pix</option>
                    <option value="loja_fisica">Presencial na Loja Física</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Endereço (Vazio para Retirada na Loja)
                </label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro (ou deixe em branco)"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>

              {/* Adicionar Produtos ao Pedido */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E]">
                  Adicionar Itens do Catálogo
                </label>

                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddProductToManualOrder(Number(e.target.value));
                      e.target.value = '';
                    }
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-white border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                >
                  <option value="">+ Selecione um produto para adicionar...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {p.price.toFixed(2)} (Estoque: {p.stock ?? 10})
                    </option>
                  ))}
                </select>

                {/* Itens Adicionados */}
                <div className="space-y-1.5">
                  {selectedProductsForOrder.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E0D8CC] text-xs">
                      <div>
                        <span className="font-bold text-[#1E1D1B]">{item.product.name}</span>
                        <span className="text-[#7A7368] ml-2">x{item.quantity} = R$ {(item.product.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProductsForOrder(prev => prev.filter(i => i.product.id !== item.product.id))}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedProductsForOrder.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-bold disabled:opacity-50"
                >
                  Criar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Notinha Térmica Epson TM-T20X */}
      {receiptOrder && (
        <ThermalReceiptModal
          isOpen={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
          receiptData={{
            orderNumber: receiptOrder.orderNumber,
            date: new Date(receiptOrder.createdAt).toLocaleDateString('pt-BR') + ' ' + new Date(receiptOrder.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            customerName: receiptOrder.customerName,
            customerPhone: receiptOrder.customerPhone,
            customerAddress: receiptOrder.customerAddress,
            items: receiptOrder.items.map(i => ({
              name: i.productName,
              quantity: i.quantity,
              price: i.unitPrice
            })),
            subtotal: receiptOrder.subtotal,
            deliveryFee: receiptOrder.deliveryFee,
            discount: receiptOrder.discount,
            total: receiptOrder.total,
            paymentMethod: receiptOrder.paymentMethod,
            isPickup: !receiptOrder.customerAddress
          }}
          onSendWhatsApp={() => handleOpenWhatsApp(receiptOrder)}
        />
      )}

    </div>
  );
}
