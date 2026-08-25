import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { createProductRequest } from '@/lib/supabase';

interface ProductRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  onRequestSubmitted?: () => void;
}

export function ProductRequestModal({
  isOpen,
  onClose,
  initialProductName = '',
  onRequestSubmitted
}: ProductRequestModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProductName(initialProductName);
      setError(null);
      setSubmitted(false);
    }
  }, [isOpen, initialProductName]);

  if (!isOpen) return null;

  // Formatação de telefone / WhatsApp: (99) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setCustomerPhone(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = customerPhone.replace(/\D/g, '');

    if (!customerName.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Por favor, informe um número de WhatsApp válido com DDD.');
      return;
    }

    if (!productName.trim()) {
      setError('Por favor, descreva o produto ou peça que você procura.');
      return;
    }

    setLoading(true);

    try {
      const res = await createProductRequest({
        customer_name: customerName,
        customer_phone: cleanPhone,
        product_name: productName,
        details: details
      });

      if (res.success) {
        setSubmitted(true);
        if (onRequestSubmitted) {
          onRequestSubmitted();
        }
      } else {
        setError(res.error || 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
      }
    } catch {
      setError('Erro ao enviar solicitação. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setCustomerName('');
    setCustomerPhone('');
    setProductName('');
    setDetails('');
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-[#171411]/75 backdrop-blur-sm transition-opacity"
        onClick={handleResetAndClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-[#4b3927] bg-[#211b17] text-[#fff7e6] shadow-[0_25px_60px_rgba(0,0,0,0.5)] animate-rise"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Linha de Destaque Superior */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#d97621] via-[#f4b52e] to-[#e99c28]" />

          {/* Botão Fechar */}
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#45382c] text-[#bcae98] hover:bg-[#2b241e] hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <div className="p-6 sm:p-8">
            {submitted ? (
              <div className="py-6 text-center animate-fadeIn">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#3d7a42]/20 border border-[#4ea355]/40 text-[#5cdb66]">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-[#fff7e6]">Solicitação Recebida!</h3>
                <p className="mt-3 text-sm text-[#bcae98] leading-relaxed">
                  Obrigado, <strong className="text-white">{customerName}</strong>! Nós recebemos seu pedido de 
                  <strong className="text-[#f4b52e]"> &ldquo;{productName}&rdquo;</strong>.
                </p>
                <p className="mt-2 text-xs text-[#9e907d]">
                  Nossa equipe da Lucca Cell entrará em contato com você pelo WhatsApp em breve com opções e valores.
                </p>

                <div className="mt-7">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="w-full rounded-xl bg-gradient-to-r from-[#d97621] to-[#e99c28] px-6 py-3 text-sm font-bold text-white shadow-md hover:from-[#c26516] hover:to-[#d4891b] transition-all cursor-pointer"
                  >
                    Concluir e Voltar ao Catálogo
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Cabeçalho */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#67502d] bg-[#2b231c] text-[#f4b52e]">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#d7ad55]">
                      Lucca Cell Encontra Pra Você
                    </span>
                    <h2 className="text-xl font-bold text-[#fff7e6]">Não achou o que procurava?</h2>
                  </div>
                </div>

                <p className="mb-6 text-xs leading-relaxed text-[#bcae98]">
                  Diga o que você precisa! Nossa equipe busca com nossos fornecedores e manda uma mensagem no seu WhatsApp com a disponibilidade e melhor preço.
                </p>

                {error && (
                  <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#bcae98] mb-1.5">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-[#4b3927] bg-[#1a1512] px-3.5 py-2.5 text-sm text-[#fff7e6] placeholder-[#6b5e50] focus:border-[#d7ad55] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#bcae98] mb-1.5">
                      Seu WhatsApp com DDD *
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="(97) 99123-4567"
                        value={customerPhone}
                        onChange={handlePhoneChange}
                        className="w-full rounded-xl border border-[#4b3927] bg-[#1a1512] pl-3.5 pr-10 py-2.5 text-sm text-[#fff7e6] placeholder-[#6b5e50] focus:border-[#d7ad55] focus:outline-none transition-colors"
                      />
                      <MessageCircle size={18} className="absolute right-3 top-3 text-[#34d399]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#bcae98] mb-1.5">
                      Produto ou Peça que você procura *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Capinha aveludada para iPhone 13 Pro Max"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-xl border border-[#4b3927] bg-[#1a1512] px-3.5 py-2.5 text-sm text-[#fff7e6] placeholder-[#6b5e50] focus:border-[#d7ad55] focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#bcae98] mb-1.5">
                      Observações ou detalhes adicionais (opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Preferência pela cor preta ou azul marinho, original..."
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full resize-none rounded-xl border border-[#4b3927] bg-[#1a1512] px-3.5 py-2 text-sm text-[#fff7e6] placeholder-[#6b5e50] focus:border-[#d7ad55] focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d97621] to-[#e99c28] py-3 text-sm font-bold text-white shadow-lg hover:from-[#c26516] hover:to-[#d4891b] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? (
                        <>Enviando solicitação...</>
                      ) : (
                        <>
                          <Send size={16} />
                          Pedir este Produto
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
