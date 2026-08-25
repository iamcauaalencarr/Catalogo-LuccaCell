import React, { useState } from 'react';
import { 
  TicketPercent, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Calendar, 
  Percent, 
  DollarSign, 
  Copy, 
  CheckCircle2, 
  Power 
} from 'lucide-react';
import { Coupon, DynamicCategory } from '@/types/admin';

interface CouponsSectionProps {
  coupons: Coupon[];
  categories: DynamicCategory[];
  onAddCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  onUpdateCoupon: (id: string, updates: Partial<Coupon>) => void;
  onDeleteCoupon: (id: string) => void;
}

export function CouponsSection({
  coupons,
  categories,
  onAddCoupon,
  onUpdateCoupon,
  onDeleteCoupon
}: CouponsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode('');
    setType('percentage');
    setValue('10');
    setMinOrderValue('50');
    setUsageLimit('100');
    setModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    setType(c.type);
    setValue(String(c.value));
    setMinOrderValue(c.minOrderValue ? String(c.minOrderValue) : '');
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : '');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) return;

    const parsedVal = parseFloat(value.replace(',', '.'));
    const parsedMin = minOrderValue ? parseFloat(minOrderValue.replace(',', '.')) : undefined;
    const parsedLimit = usageLimit ? parseInt(usageLimit, 10) : undefined;

    if (editingCoupon) {
      onUpdateCoupon(editingCoupon.id, {
        code: code.trim().toUpperCase(),
        type,
        value: parsedVal,
        minOrderValue: parsedMin,
        usageLimit: parsedLimit
      });
    } else {
      onAddCoupon({
        code: code.trim().toUpperCase(),
        type,
        value: parsedVal,
        minOrderValue: parsedMin,
        usageLimit: parsedLimit,
        startDate: new Date().toISOString(),
        isActive: true
      });
    }

    setModalOpen(false);
  };

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Marketing & Descontos
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {coupons.length} cupons cadastrados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Cupons & Campanhas
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Crie códigos promocionais em porcentagem ou valor fixo para estimular as vendas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-[#D97757] text-white px-5 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
        >
          <Plus size={16} />
          <span>Criar Cupom</span>
        </button>
      </div>

      {/* Grid de Cupons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map(coupon => (
          <div
            key={coupon.id}
            className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between transition-all space-y-4 ${
              coupon.isActive ? 'bg-[#FFFFFF] border-[#E7E0D5]' : 'bg-[#FAF7F2] border-[#E0D8CC] opacity-70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-2xl bg-[#FAF0E8] text-[#B05330] flex items-center justify-center font-bold">
                  <TicketPercent size={20} />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateCoupon(coupon.id, { isActive: !coupon.isActive })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      coupon.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    <Power size={11} />
                    <span>{coupon.isActive ? 'Ativo' : 'Pausado'}</span>
                  </button>
                </div>
              </div>

              {/* Código com Botão de Copiar */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FAF7F2] border border-dashed border-[#E0D8CC] mb-3">
                <span className="font-mono text-base font-bold text-[#B05330] tracking-wider">
                  {coupon.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(coupon.code)}
                  className="p-1.5 rounded-lg bg-white border border-[#E0D8CC] text-[#7A7368] hover:text-[#1E1D1B]"
                  title="Copiar código"
                >
                  {copiedCode === coupon.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="space-y-1 text-xs text-[#7A7368]">
                <p>
                  Desconto: <strong className="text-[#1E1D1B]">
                    {coupon.type === 'percentage' ? `${coupon.value}% de desconto` : `R$ ${coupon.value.toFixed(2)} OFF`}
                  </strong>
                </p>
                {coupon.minOrderValue && (
                  <p>Pedido mínimo: <strong className="text-[#1E1D1B]">R$ {coupon.minOrderValue.toFixed(2)}</strong></p>
                )}
                <p>Utilizações: <strong className="text-[#1E1D1B]">{coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : 'vezes'}</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-3 border-t border-[#EFE9E0]">
              <button
                type="button"
                onClick={() => handleOpenEdit(coupon)}
                className="p-2 rounded-xl text-[#7A7368] hover:bg-[#FAF7F2] min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <Edit size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDeleteCoupon(coupon.id)}
                className="p-2 rounded-xl text-red-600 hover:bg-red-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL CRIAR / EDITAR CUPOM
      ───────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
                {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
              </h3>
              <button type="button" onClick={() => setModalOpen(false)} className="text-[#7A7368]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Código do Cupom *
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: PROMO10, LUCCAFRETE"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-mono font-bold text-[#B05330]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                    Tipo de Desconto
                  </label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full h-11 px-3 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                    Valor do Desconto *
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={type === 'percentage' ? '10' : '20,00'}
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                    Pedido Mínimo (R$)
                  </label>
                  <input
                    type="text"
                    value={minOrderValue}
                    onChange={e => setMinOrderValue(e.target.value)}
                    placeholder="50,00"
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                    Limite de Usos
                  </label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={e => setUsageLimit(e.target.value)}
                    placeholder="100"
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                  />
                </div>
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
                  Salvar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
