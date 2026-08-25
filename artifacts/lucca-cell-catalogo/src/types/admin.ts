import { AdminProfile, RoleType, PermissionType } from '@/lib/supabase';

export type ProductVisual = 'phone' | 'cable' | 'audio' | 'shield' | 'battery' | 'laptop' | 'tablet' | 'repair';

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface ProductVariant {
  id: string;
  name: string; // Ex: "Preto - 128GB", "Branco"
  price?: number;
  stock: number;
  sku?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  costPrice?: number;
  installment: string;
  rating: number;
  reviews: number;
  tag?: string;
  description: string;
  visual: ProductVisual;
  tone: string;
  image?: string;
  gallery?: string[];
  colors?: string[];
  stock?: number;
  minStockAlert?: number;
  status?: ProductStatus;
  variants?: ProductVariant[];
  sku?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  color: string;
  description?: string;
  order: number;
  isActive: boolean;
  productCount?: number;
}

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled';
export type PaymentMethod = 'pix' | 'loja_fisica' | 'outro';

export interface OrderItem {
  productId: number;
  productName: string;
  productImage?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedColor?: string;
  variantName?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: "#LC-1082"
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'confirmed';
  status: OrderStatus;
  pixReceiptConfirmedBy?: string;
  pixReceiptConfirmedAt?: string;
  whatsappMessageSent: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // Porcentagem (ex: 10 para 10%) ou valor em R$ (ex: 20)
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  applicableCategories?: string[];
}

export interface StoreSettings {
  storeName: string;
  storeSlogan: string;
  storeLogoUrl: string;
  contactPhone: string;
  whatsappNumber: string;
  emailContact: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  social: {
    instagram: string;
    facebook?: string;
  };
  pixConfig: {
    keyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
    keyValue: string;
    receiverName: string;
    bankName: string;
    city: string;
    instructions: string;
  };
  deliveryConfig: {
    allowPickup: boolean;
    pickupInstructions: string;
    deliveryAvailable: boolean;
    defaultDeliveryFee: number;
    freeDeliveryThreshold: number;
    estimatedDeliveryTime: string;
  };
  notificationsConfig: {
    soundOnNewOrder: boolean;
    emailAlerts: boolean;
    lowStockThreshold: number;
    alertOnLowStock: boolean;
  };
  aiConfig: {
    defaultModel: string;
    temperature: number;
    customPromptInstructions: string;
    promptVersion: number;
    promptHistory: {
      version: number;
      updatedAt: string;
      promptText: string;
      notes: string;
    }[];
  };
}

export type AdminTab = 
  | 'dashboard' 
  | 'products' 
  | 'categories' 
  | 'orders' 
  | 'customers' 
  | 'coupons' 
  | 'requests'
  | 'team' 
  | 'audit' 
  | 'settings' 
  | 'ai_playground';
