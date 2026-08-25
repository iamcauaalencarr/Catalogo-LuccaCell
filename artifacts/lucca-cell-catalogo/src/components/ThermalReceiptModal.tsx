import React, { useRef } from 'react';
import { Printer, X, Check, MessageCircle, ArrowRight, Share2, Copy } from 'lucide-react';
import { Order, OrderItem } from '@/types/admin';
import logoPath from '@assets/LOGO_1_1786564407567.png';

export interface ReceiptData {
  orderNumber: string;
  date: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    color?: string;
  }>;
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  isPickup?: boolean;
}

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  onSendWhatsApp?: () => void;
}

export function ThermalReceiptModal({
  isOpen,
  onClose,
  receiptData,
  onSendWhatsApp
}: ThermalReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !receiptData) return null;

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handlePrint = () => {
    const receiptEl = receiptRef.current;
    if (!receiptEl) {
      window.print();
      return;
    }

    // Cria iframe isolado invisível para não herdar CSS do modal/backdrop
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Comprovante Lucca Cell - ${receiptData.orderNumber}</title>
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
              }
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 72mm;
                max-width: 80mm;
                margin: 0 auto;
                padding: 4mm 2mm 8mm 2mm;
                font-size: 11px;
                line-height: 1.25;
                color: #000000 !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .text-center { text-align: center; }
              .font-bold { font-weight: bold; }
              .font-black { font-weight: 900; }
              .uppercase { text-transform: uppercase; }
              .border-b-dashed { border-bottom: 1px dashed #000; }
              .border-b-dotted { border-bottom: 1px dotted #555; }
              .border-t-dotted { border-top: 1px dotted #555; }
              .flex-between { display: flex; justify-content: space-between; }
              .flex-col { display: flex; flex-direction: column; }
              .py-1 { padding-top: 4px; padding-bottom: 4px; }
              .py-2 { padding-top: 6px; padding-bottom: 6px; }
              .pt-1 { padding-top: 4px; }
              .pb-1 { padding-bottom: 4px; }
              .pb-2 { padding-bottom: 6px; }
              .mt-1 { margin-top: 4px; }
              .text-lg { font-size: 14px; }
              .text-sm { font-size: 11px; }
              .text-xs { font-size: 9.5px; }
              .text-xxs { font-size: 8px; }
              .color-detail { padding-left: 12px; font-size: 9px; color: #000; }
              .thermal-logo { filter: brightness(0) !important; -webkit-filter: brightness(0) !important; }
            </style>
          </head>
          <body>
            ${receiptEl.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }, 300);
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. BACKDROP & MODAL ON SCREEN
      ───────────────────────────────────────────────────────────── */}
      <div 
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-[#E0D8CC] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-rise text-[#1E1D1B]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-[#FFFFFF] border-b border-[#EAE3D8] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#FAF0E6] text-[#D97757] flex items-center justify-center border border-[#F0D5C7]">
                <Printer size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1E1D1B]">Notinha / Comprovante</h3>
                <p className="text-[11px] text-[#7A7368]">Otimizado para Epson TM-T20X (80mm)</p>
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

          {/* Thermal Receipt Visual Preview (80mm styling) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex justify-center bg-[#ECE6DC]">
            <div 
              id="thermal-receipt-print"
              ref={receiptRef}
              className="w-full max-w-[320px] bg-white p-4 shadow-md font-mono text-[11px] leading-tight text-black border border-stone-300 select-all"
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Header do Cupom com Logo em Preto Absoluto */}
              <div className="text-center pb-2 border-b border-dashed border-black">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                  <img 
                    src={logoPath} 
                    alt="Lucca Cell Logo" 
                    className="thermal-logo"
                    style={{ 
                      maxHeight: '44px', 
                      width: 'auto', 
                      display: 'block', 
                      margin: '0 auto',
                      filter: 'brightness(0)',
                      WebkitFilter: 'brightness(0)'
                    }} 
                  />
                </div>
                <div className="text-[14px] font-black tracking-wider uppercase">LUCCA CELL</div>
                <div className="text-[10px]">Acessórios & Assistência Técnica</div>
                <div className="text-[10px]">Guajará - AM</div>
                <div className="text-[10px] font-bold mt-0.5">WhatsApp: (97) 99155-4563</div>
              </div>

              {/* Informações do Pedido */}
              <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
                <div className="flex justify-between font-bold">
                  <span>PEDIDO: {receiptData.orderNumber}</span>
                  <span>{receiptData.date}</span>
                </div>
                {receiptData.customerName && (
                  <div>
                    <span className="font-bold">CLIENTE: </span>
                    <span>{receiptData.customerName.toUpperCase()}</span>
                  </div>
                )}
                {receiptData.customerPhone && (
                  <div>
                    <span className="font-bold">FONE: </span>
                    <span>{receiptData.customerPhone}</span>
                  </div>
                )}
                {receiptData.customerAddress && (
                  <div>
                    <span className="font-bold">ENDERECO: </span>
                    <span>{receiptData.customerAddress}</span>
                  </div>
                )}
              </div>

              {/* Itens */}
              <div className="py-2 border-b border-dashed border-black">
                <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dotted border-stone-400">
                  <span>QTD ITEM</span>
                  <span>TOTAL</span>
                </div>
                <div className="space-y-1.5 pt-1.5">
                  {receiptData.items.map((item, idx) => (
                    <div key={idx} className="text-[10px]">
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold">{item.quantity}x {item.name}</span>
                        <span className="shrink-0 font-bold">{formatBRL(item.price * item.quantity)}</span>
                      </div>
                      {item.color && (
                        <div className="text-[9px] text-stone-600 pl-4">
                          Cor: {item.color}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="py-2 border-b border-dashed border-black space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatBRL(receiptData.subtotal)}</span>
                </div>
                {Boolean(receiptData.deliveryFee && receiptData.deliveryFee > 0) && (
                  <div className="flex justify-between">
                    <span>TAXA DE ENTREGA:</span>
                    <span>{formatBRL(receiptData.deliveryFee!)}</span>
                  </div>
                )}
                {Boolean(receiptData.discount && receiptData.discount > 0) && (
                  <div className="flex justify-between text-stone-700">
                    <span>DESCONTO:</span>
                    <span>- {formatBRL(receiptData.discount!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[12px] font-black pt-1 border-t border-dotted border-stone-400">
                  <span>TOTAL:</span>
                  <span>{formatBRL(receiptData.total)}</span>
                </div>
              </div>

              {/* Pagamento e Entrega */}
              <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="font-bold">PAGAMENTO:</span>
                  <span className="uppercase">{receiptData.paymentMethod || 'A COMBINAR'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">MODALIDADE:</span>
                  <span>{receiptData.isPickup ? 'RETIRADA NA LOJA' : 'ENTREGA'}</span>
                </div>
              </div>

              {/* Mensagem de Rodapé */}
              <div className="text-center pt-2 text-[9px] space-y-0.5">
                <div className="font-bold">*** COMPROVANTE DE PEDIDO ***</div>
                <div>Agradecemos a preferencia!</div>
                <div>Garantia e qualidade Lucca Cell</div>
                <div className="text-[8px] text-stone-500 pt-1">
                  Emitido em {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-[#FFFFFF] border-t border-[#EAE3D8] p-4 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#E0D8CC] text-xs font-bold text-[#7A7368] hover:text-[#1E1D1B]"
            >
              Fechar
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onSendWhatsApp && (
                <button
                  type="button"
                  onClick={onSendWhatsApp}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#1EBE5D] transition-colors shadow-xs"
                >
                  <MessageCircle size={15} /> WhatsApp
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E1D1B] text-white text-xs font-bold hover:bg-[#33302C] transition-all shadow-md active:scale-95"
              >
                <Printer size={15} /> Imprimir (Epson)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
