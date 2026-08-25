import { Product } from '@/types/admin';
import { ReceiptData } from '@/components/ThermalReceiptModal';

export interface CartLine {
  readonly product: Product;
  readonly quantity: number;
  readonly selectedColor?: string;
}

export const formatCurrency = (value: number): string =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Função Pura: Adiciona ou incrementa um item na sacola sem mutação
 */
export function addOrIncrementItem(
  currentCart: readonly CartLine[],
  product: Product,
  selectedColor?: string,
  quantity = 1
): CartLine[] {
  const targetColor = selectedColor || undefined;
  const existingIndex = currentCart.findIndex(
    (line) => line.product.id === product.id && line.selectedColor === targetColor
  );

  if (existingIndex >= 0) {
    return currentCart.map((line, idx) =>
      idx === existingIndex
        ? { ...line, quantity: line.quantity + quantity }
        : line
    );
  }

  return [...currentCart, { product, quantity, selectedColor: targetColor }];
}

/**
 * Função Pura: Altera a quantidade de um item de forma imutável (remove se <= 0)
 */
export function updateItemQuantity(
  currentCart: readonly CartLine[],
  lineIndex: number,
  delta: number
): CartLine[] {
  return currentCart.flatMap((line, idx) => {
    if (idx === lineIndex) {
      const nextQuantity = line.quantity + delta;
      return nextQuantity > 0 ? [{ ...line, quantity: nextQuantity }] : [];
    }
    return [line];
  });
}

/**
 * Função Pura: Remove um item da sacola
 */
export function removeItem(
  currentCart: readonly CartLine[],
  lineIndex: number
): CartLine[] {
  return currentCart.filter((_, idx) => idx !== lineIndex);
}

export interface CartTotals {
  readonly itemCount: number;
  readonly subtotal: number;
  readonly discount: number;
  readonly deliveryFee: number;
  readonly total: number;
}

/**
 * Função Pura: Calcula os totais da sacola de forma determinística
 */
export function calculateCartTotals(
  cart: readonly CartLine[],
  discount = 0,
  deliveryFee = 0
): CartTotals {
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0
  );
  const safeDiscount = Math.min(subtotal, Math.max(0, discount));
  const safeDelivery = Math.max(0, deliveryFee);
  const total = Math.max(0, subtotal - safeDiscount + safeDelivery);

  return {
    itemCount,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(safeDiscount.toFixed(2)),
    deliveryFee: Number(safeDelivery.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

/**
 * Função Pura: Gera o texto formatado para envio direto do pedido no WhatsApp
 */
export function buildWhatsAppOrderMessage(
  cart: readonly CartLine[],
  totals: CartTotals,
  pickupAddress = 'Rua Presidente Vargas, 021 - Centro, Guajará - AM'
): string {
  let message = `Olá, Lucca Cell! Gostaria de fazer o pedido pelo catálogo:\n\n`;

  cart.forEach((line) => {
    const colorInfo = line.selectedColor ? ` (Cor: *${line.selectedColor}*)` : '';
    const lineTotal = formatCurrency(line.product.price * line.quantity);
    message += `• ${line.quantity}x ${line.product.name}${colorInfo} - ${lineTotal}\n`;
  });

  message += `\n*Subtotal:* ${formatCurrency(totals.subtotal)}`;
  if (totals.discount > 0) {
    message += `\n*Desconto:* -${formatCurrency(totals.discount)}`;
  }
  if (totals.deliveryFee > 0) {
    message += `\n*Entrega:* +${formatCurrency(totals.deliveryFee)}`;
  }
  message += `\n*Total a Pagar: ${formatCurrency(totals.total)}*`;
  message += `\n\nRetirada na loja: ${pickupAddress}.`;

  return message;
}

/**
 * Função Pura: Gera o payload estruturado para a notinha térmica Epson TM-T20X
 */
export function buildThermalReceiptPayload(
  cart: readonly CartLine[],
  totals: CartTotals,
  customerName = 'Cliente Balcão / WhatsApp'
): ReceiptData {
  const now = new Date();
  const dateFormatted =
    now.toLocaleDateString('pt-BR') +
    ' ' +
    now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return {
    orderNumber: `LC-${Math.floor(1000 + Math.random() * 9000)}`,
    date: dateFormatted,
    customerName,
    items: cart.map((l) => ({
      name: l.product.name,
      quantity: l.quantity,
      price: l.product.price,
      color: l.selectedColor,
    })),
    subtotal: totals.subtotal,
    deliveryFee: totals.deliveryFee,
    discount: totals.discount,
    total: totals.total,
    paymentMethod: 'A Combinar / Pix',
    isPickup: true,
  };
}
