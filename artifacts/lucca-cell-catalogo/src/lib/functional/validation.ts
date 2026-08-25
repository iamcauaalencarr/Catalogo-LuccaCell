import { Product, Coupon } from '@/types/admin';
import { Result, Ok, Err } from './result';

/**
 * Função Pura: Valida os dados de cadastro ou edição de produto
 */
export function validateProductInput(
  data: Partial<Product>
): Result<Omit<Product, 'id' | 'rating' | 'reviews'>, string> {
  const name = data.name?.trim();
  if (!name) {
    return Err('O nome do produto é obrigatório.');
  }

  const price = typeof data.price === 'number' ? data.price : parseFloat(String(data.price || 0));
  if (isNaN(price) || price < 0) {
    return Err('O preço do produto deve ser um valor numérico válido.');
  }

  const category = data.category?.trim() || 'Outros';

  return Ok({
    name,
    category,
    price,
    oldPrice: data.oldPrice ? Number(data.oldPrice) : undefined,
    installment: data.installment?.trim() || 'Em até 12x no cartão',
    tag: data.tag?.trim() || undefined,
    description: data.description?.trim() || '',
    visual: data.visual || 'phone',
    tone: data.tone || 'gold',
    image: data.image || undefined,
    colors: Array.isArray(data.colors) ? data.colors.filter(Boolean) : undefined,
    stock: typeof data.stock === 'number' ? data.stock : 10,
    costPrice: data.costPrice,
    status: data.status || 'active',
  });
}

/**
 * Função Pura: Validação e cálculo de aplicação de cupom
 */
export function validateAndApplyCoupon(
  subtotal: number,
  couponCode: string,
  coupons: readonly Coupon[]
): Result<{ discountAmount: number; finalTotal: number; coupon: Coupon }, string> {
  if (subtotal <= 0) {
    return Err('O valor do pedido precisa ser maior que zero para aplicar cupons.');
  }

  const cleanCode = couponCode.trim().toUpperCase();
  if (!cleanCode) {
    return Err('Informe o código do cupom.');
  }

  const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);
  if (!coupon) {
    return Err(`O cupom "${cleanCode}" não foi encontrado.`);
  }

  if (!coupon.isActive) {
    return Err(`O cupom "${coupon.code}" está inativo.`);
  }

  if (coupon.endDate) {
    const expiry = new Date(coupon.endDate).getTime();
    if (Date.now() > expiry) {
      return Err(`O cupom "${coupon.code}" já expirou.`);
    }
  }

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return Err(
      `O cupom "${coupon.code}" exige pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2)}.`
    );
  }

  let discountAmount =
    coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : coupon.value;

  if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
    discountAmount = coupon.maxDiscount;
  }

  const safeDiscount = Math.min(subtotal, Math.max(0, discountAmount));
  const finalTotal = Math.max(0, subtotal - safeDiscount);

  return Ok({
    discountAmount: Number(safeDiscount.toFixed(2)),
    finalTotal: Number(finalTotal.toFixed(2)),
    coupon,
  });
}
