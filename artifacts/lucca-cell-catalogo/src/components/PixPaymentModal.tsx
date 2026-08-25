import React, { useState, useMemo } from 'react';
import { QrCode, Copy, Check, X, ShieldCheck, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { generatePixPayload, generatePixQrCodeUrl } from '@/lib/functional/pix';
import { StoreSettings } from '@/types/admin';
import { AdminStore } from '@/services/adminStore';
import { formatCurrency, CartLine, calculateCartTotals } from '@/lib/functional/cart';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartLines: CartLine[];
  storeSettings: StoreSettings;
  orderNumber?: string;
  onOrderCompleted?: () => void;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  cartLines,
  storeSettings,
  orderNumber,
  onOrderCompleted
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);

  const totals = useMemo(() => calculateCartTotals(cartLines), [cartLines]);
  const activeOrderNumber = useMemo(
    () => orderNumber || `LC${Math.floor(1000 + Math.random() * 9000)}`,
    [orderNumber]
  );

  // Lê sempre as configurações ativas mais recentes (incluindo CPF recém-salvo)
  const currentSettings = useMemo(() => {
    try {
      return AdminStore.getSettings();
    } catch {
      return storeSettings;
    }
  }, [isOpen, storeSettings]);

  const pixConfig = currentSettings.pixConfig || {
    keyValue: '97991554563',
    keyType: 'cpf',
    receiverName: 'Lucca Cell',
    city: 'Guajará',
  };

  // Gera o código Pix Copia e Cola Oficial com o valor exato
  const pixPayload = useMemo(() => {
    return generatePixPayload({
      pixKey: pixConfig.keyValue || '97991554563',
      pixKeyType: pixConfig.keyType || 'cpf',
      merchantName: pixConfig.receiverName || currentSettings.storeName || 'LUCCA CELL',
      merchantCity: pixConfig.city || currentSettings.address?.city || 'GUAJARA',
      amount: totals.total > 0 ? totals.total : undefined,
      txid: activeOrderNumber.replace(/[^a-zA-Z0-9]/g, ''),
      description: `Pedido ${activeOrderNumber}`,
    });
  }, [pixConfig, currentSettings, totals.total, activeOrderNumber]);

  const qrCodeUrl = useMemo(() => {
    return generatePixQrCodeUrl(pixPayload, 260);
  }, [pixPayload]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback manual de cópia
      const el = document.createElement('textarea');
      el.value = pixPayload;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSendProofOnWhatsApp = () => {
    const phone = (storeSettings.whatsappNumber || '5597991554563').replace(/\D/g, '');
    let text = `Olá, Lucca Cell! Acabei de gerar o Pix do meu pedido pelo catálogo:\n\n`;
    text += `📦 *Pedido:* #${activeOrderNumber}\n`;
    text += `💰 *Valor Exato:* ${formatCurrency(totals.total)}\n\n`;
    text += `*Itens do Pedido:*\n`;
    cartLines.forEach((line) => {
      const color = line.selectedColor ? ` (Cor: ${line.selectedColor})` : '';
      text += `• ${line.quantity}x ${line.product.name}${color}\n`;
    });
    text += `\nEstou enviando o comprovante em anexo para confirmação! ✨`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    if (onOrderCompleted) onOrderCompleted();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-[#E0D8CC] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-rise text-[#1E1D1B]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#FFFFFF] border-b border-[#EAE3D8] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#D97757] flex items-center justify-center border border-[#F0D5C7]">
              <QrCode size={16} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1E1D1B]">Pix com Valor Automático</h3>
              <p className="text-[11px] text-[#7A7368]">Copie e pague com o valor já preenchido</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-[#E0D8CC] text-[#7A7368] hover:text-[#1E1D1B] hover:bg-[#F3EDE2] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Card de Valor Total */}
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#EAE3D8] p-4 text-center shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7A7368]">
              Valor Exato a Pagar
            </span>
            <div className="text-2xl sm:text-3xl font-serif font-black text-[#D97757] mt-0.5">
              {formatCurrency(totals.total)}
            </div>
            <p className="text-[10px] text-[#8E8578] mt-1">
              Pedido #{activeOrderNumber} • {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'itens'}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3D8]">
            <div className="p-2.5 rounded-xl bg-white border border-[#E0D8CC] shadow-inner mb-2">
              <img
                src={qrCodeUrl}
                alt="QR Code Pix"
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
              />
            </div>
            <p className="text-[11px] text-[#7A7368] text-center max-w-[280px]">
              Aponte a câmera no app do seu banco ou use o botão abaixo para copiar o código.
            </p>
          </div>

          {/* Botão Copiar Código Pix Copia e Cola */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-[#D97757] text-white hover:bg-[#C85A32] shadow-[#D97757]/30'
              }`}
            >
              {copied ? (
                <>
                  <Check size={18} />
                  <span>Código Pix Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy size={18} />
                  <span>Copiar Pix Copia e Cola ({formatCurrency(totals.total)})</span>
                </>
              )}
            </button>

            <div className="p-3 rounded-xl bg-[#FAF0E8] border border-[#EBD5C8] text-[11px] text-[#9C4B2E] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck size={14} /> Pagamento Direto & Seguro
              </div>
              <p className="text-[10px] text-[#7A3F29] leading-relaxed">
                Ao colar no seu app bancário, o recebedor será <strong>{pixConfig.receiverName || 'LUCCA CELL'}</strong> e o valor será preenchido automaticamente.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[#FFFFFF] border-t border-[#EAE3D8] p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E0D8CC] text-xs font-bold text-[#7A7368] hover:text-[#1E1D1B]"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleSendProofOnWhatsApp}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition-colors shadow-xs"
          >
            <MessageCircle size={15} /> Já paguei! Enviar Comprovante
          </button>
        </div>
      </div>
    </div>
  );
}
