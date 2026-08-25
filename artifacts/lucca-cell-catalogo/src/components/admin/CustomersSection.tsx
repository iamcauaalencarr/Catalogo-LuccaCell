import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  ChevronRight, 
  X, 
  Edit, 
  MessageCircle 
} from 'lucide-react';
import { Customer, Order } from '@/types/admin';

interface CustomersSectionProps {
  customers: Customer[];
  orders: Order[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
}

export function CustomersSection({
  customers,
  orders,
  onAddCustomer,
  onUpdateCustomer
}: CustomersSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Guajará - AM');
  const [notes, setNotes] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail) return false;
      }
      return true;
    });
  }, [customers, searchTerm]);

  // Pedidos do cliente selecionado
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    const cleanPhone = selectedCustomer.phone.replace(/\D/g, '');
    return orders.filter(o => 
      o.customerPhone.replace(/\D/g, '') === cleanPhone || 
      o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
    );
  }, [selectedCustomer, orders]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Guajará - AM');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setCity(c.city || 'Guajará - AM');
    setNotes(c.notes || '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      onAddCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Base de Clientes
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {customers.length} cadastrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Clientes & Histórico
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Visualize o total gasto, número de pedidos e histórico de compras de cada cliente.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D97757] text-white px-5 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
        >
          <Plus size={16} />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Busca */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E978C]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs sm:text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
          />
        </div>
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <div
            key={customer.id}
            onClick={() => setSelectedCustomer(customer)}
            className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between hover:border-[#D97757] cursor-pointer transition-all space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FAF0E8] text-[#B05330] flex items-center justify-center font-bold text-sm uppercase">
                  {customer.name.charAt(0)}
                </div>

                <span className="px-2.5 py-1 rounded-full bg-[#FAF7F2] border border-[#EFE9E0] text-[10px] font-bold text-[#7A7368]">
                  {customer.totalOrders} {customer.totalOrders === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#1E1D1B] mb-1">
                {customer.name}
              </h3>
              <p className="text-xs text-[#7A7368] flex items-center gap-1.5">
                <Phone size={13} className="text-[#9E978C]" />
                <span>{customer.phone}</span>
              </p>
              {customer.address && (
                <p className="text-xs text-[#7A7368] flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} className="text-[#9E978C]" />
                  <span className="truncate">{customer.address}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EFE9E0] text-xs">
              <div>
                <span className="text-[#7A7368]">Total acumulado:</span>
                <p className="font-serif font-bold text-[#1E1D1B] text-sm">
                  {customer.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenEdit(customer); }}
                  className="p-2 rounded-xl text-[#7A7368] hover:bg-[#FAF7F2] min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <Edit size={16} />
                </button>
                <a
                  href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle size={16} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DRAWER / DETALHES DO CLIENTE & HISTÓRICO DE PEDIDOS
      ───────────────────────────────────────────────────────────── */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedCustomer(null)} />
          
          <div className="relative ml-auto w-full max-w-md h-full bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 animate-slide">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EFE9E0] mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#D97757] text-white flex items-center justify-center font-bold text-lg">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1E1D1B]">{selectedCustomer.name}</h3>
                    <p className="text-xs text-[#7A7368]">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedCustomer(null)} className="p-2 text-[#7A7368]">
                  <X size={20} />
                </button>
              </div>

              {/* Informações de Contato */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#7A7368]">Total Gasto:</span>
                  <strong className="text-[#1E1D1B]">{selectedCustomer.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7A7368]">Total de Pedidos:</span>
                  <strong className="text-[#1E1D1B]">{selectedCustomer.totalOrders}</strong>
                </div>
                {selectedCustomer.email && (
                  <div className="flex justify-between">
                    <span className="text-[#7A7368]">E-mail:</span>
                    <span className="text-[#1E1D1B]">{selectedCustomer.email}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex justify-between">
                    <span className="text-[#7A7368]">Endereço:</span>
                    <span className="text-[#1E1D1B]">{selectedCustomer.address}</span>
                  </div>
                )}
              </div>

              {/* Histórico de Pedidos */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#9E978C] mb-2">
                  Histórico de Pedidos ({customerOrders.length})
                </h4>
                
                {customerOrders.length === 0 ? (
                  <p className="text-xs text-[#7A7368] py-4 text-center">Nenhum pedido registrado para este cliente.</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(order => (
                      <div key={order.id} className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#EFE9E0] text-xs">
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="text-[#B05330]">{order.orderNumber}</span>
                          <span className="text-[#1E1D1B]">R$ {order.total.toFixed(2)}</span>
                        </div>
                        <p className="text-[11px] text-[#7A7368]">
                          {new Date(order.createdAt).toLocaleDateString('pt-BR')} • {order.items.length} itens
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#EFE9E0] mt-6">
              <a
                href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px]"
              >
                <MessageCircle size={16} />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL CADASTRO / EDIÇÃO DE CLIENTE
      ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-[#7A7368]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(97) 99155-4563"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Endereço de Entrega
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-bold"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
