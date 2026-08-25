import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquareText, 
  Search, 
  Phone, 
  User, 
  Calendar, 
  CheckCircle2, 
  Trash2, 
  MessageCircle, 
  Clock, 
  Check, 
  X,
  Sparkles
} from 'lucide-react';
import { 
  ProductRequest, 
  fetchProductRequests, 
  updateProductRequestStatus, 
  deleteProductRequest,
  logSecurityAction,
  AdminProfile
} from '@/lib/supabase';

interface RequestsSectionProps {
  currentUser: AdminProfile;
  onRequestHandled?: () => void;
}

export function RequestsSection({ currentUser, onRequestHandled }: RequestsSectionProps) {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'contacted' | 'resolved'>('all');

  const loadRequests = async () => {
    setLoading(true);
    const data = await fetchProductRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = r.customer_name.toLowerCase().includes(q);
        const matchesProd = r.product_name.toLowerCase().includes(q);
        const matchesPhone = r.customer_phone.includes(q);
        if (!matchesName && !matchesProd && !matchesPhone) return false;
      }
      return true;
    });
  }, [requests, statusFilter, searchTerm]);

  const handleUpdateStatus = async (id: string, newStatus: ProductRequest['status']) => {
    const success = await updateProductRequestStatus(id, newStatus);
    if (success) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (onRequestHandled) onRequestHandled();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteProductRequest(id);
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== id));
      if (onRequestHandled) onRequestHandled();
    }
  };

  const handleWhatsApp = (req: ProductRequest) => {
    const phone = req.customer_phone.replace(/\D/g, '');
    const msg = `Olá, *${req.customer_name}*! Vimos sua solicitação no catálogo da *Lucca Cell* sobre o produto *"${req.product_name}"*. Temos novidades para você! 📲`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Demanda & Clientes
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {requests.length} solicitações recebidas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Solicitações de Produtos
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Itens que os clientes procuraram no catálogo mas não encontraram em estoque.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E7E0D5] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E978C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, produto procurado ou telefone..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs sm:text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            >
              <option value="all">🔍 Todos os Status</option>
              <option value="pending">⏳ Pendente de Retorno</option>
              <option value="contacted">📞 Cliente Contatado</option>
              <option value="resolved">✅ Resolvido / Atendido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Solicitações */}
      {filteredRequests.length === 0 ? (
        <div className="p-12 text-center bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs space-y-2">
          <MessageSquareText size={32} className="mx-auto text-[#9E978C]" />
          <h3 className="text-base font-serif font-bold text-[#1E1D1B]">Nenhuma solicitação encontrada</h3>
          <p className="text-xs text-[#7A7368]">Não há solicitações pendentes no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map(req => (
            <div key={req.id} className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-[#B05330] bg-[#FAF0E8] px-2.5 py-1 rounded-xl">
                    Item Solicitado
                  </span>
                  <span className="text-[11px] text-[#7A7368]">
                    {new Date(req.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#1E1D1B] mb-1">
                  "{req.product_name}"
                </h3>
                {req.details && (
                  <p className="text-xs text-[#7A7368] mb-3 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#EFE9E0]">
                    📝 {req.details}
                  </p>
                )}

                <div className="space-y-1 text-xs text-[#4A453E]">
                  <p className="flex items-center gap-1.5">
                    <User size={13} className="text-[#D97757]" />
                    <strong>{req.customer_name}</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone size={13} className="text-[#9E978C]" />
                    <span>{req.customer_phone}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE9E0] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleWhatsApp(req)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px]"
                >
                  <MessageCircle size={15} />
                  <span>Chamar no WhatsApp</span>
                </button>

                <select
                  value={req.status}
                  onChange={e => handleUpdateStatus(req.id, e.target.value as any)}
                  className="h-11 px-3 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                >
                  <option value="pending">Pendente</option>
                  <option value="contacted">Contatado</option>
                  <option value="resolved">Resolvido</option>
                </select>

                <button
                  type="button"
                  onClick={() => handleDelete(req.id)}
                  className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
