import { 
  DynamicCategory, 
  Order, 
  Customer, 
  Coupon, 
  StoreSettings, 
  Product,
  OrderStatus 
} from '@/types/admin';
import { supabase, logSecurityAction, AdminProfile, fetchStoreSettingsFromSupabase, syncStoreSettingsToSupabase } from '@/lib/supabase';
import { CATEGORIAS_VALIDAS } from '@/services/openrouter';

const STORAGE_KEYS = {
  PRODUCTS: 'lucca_cell_admin_products',
  CATEGORIES: 'lucca_cell_admin_categories',
  ORDERS: 'lucca_cell_admin_orders',
  CUSTOMERS: 'lucca_cell_admin_customers',
  COUPONS: 'lucca_cell_admin_coupons',
  SETTINGS: 'lucca_cell_admin_settings',
};

// ==========================================
// PRODUTOS INICIAIS (CARREGAMENTO INSTANTÂNEO 0MS)
// ==========================================
export const INITIAL_CATALOG_PRODUCTS: Product[] = [
  { 
    id: 1, 
    name: 'Capa Armor MagSafe Anti-Impacto', 
    category: 'Capinhas', 
    price: 89.90, 
    oldPrice: 109.90, 
    installment: '3x de R$ 29,97', 
    rating: 4.9, 
    reviews: 38, 
    tag: 'Mais pedido', 
    description: 'Proteção militar contra quedas, toque aveludado e anel magnético integrado compatível com carregamento MagSafe.', 
    visual: 'phone', 
    tone: 'linear-gradient(135deg,#29251f,#bd7824)',
    colors: ['Preto Fosco', 'Transparente', 'Azul Marinho', 'Grafite'],
    stock: 25
  },
  { 
    id: 2, 
    name: 'Cabo Kaidi Nylon Trançado Turbo 2m', 
    category: 'Cabos e Carregadores', 
    price: 54.90, 
    installment: '2x de R$ 27,45', 
    rating: 4.8, 
    reviews: 27, 
    tag: 'Novo', 
    description: 'Cabo ultra resistente de 2 metros com tecnologia de carregamento rápido e conectores reforçados em alumínio.', 
    visual: 'cable', 
    tone: 'linear-gradient(145deg,#e9d6a5,#fbf5df)',
    stock: 40
  },
  { 
    id: 3, 
    name: 'Fone de Ouvido Pulse TWS Bluetooth 5.3', 
    category: 'Áudio', 
    price: 149.90, 
    oldPrice: 179.90, 
    installment: '4x de R$ 37,48', 
    rating: 4.7, 
    reviews: 51, 
    tag: 'Oferta', 
    description: 'Som estéreo imersivo com graves reforçados, cancelamento passivo de ruído e até 24h de autonomia com estojo.', 
    visual: 'audio', 
    tone: 'linear-gradient(140deg,#20201e,#5d5b55)',
    stock: 18
  },
  { 
    id: 4, 
    name: 'Película de Vidro 3D Privacidade Cerâmica', 
    category: 'Proteção', 
    price: 39.90, 
    installment: 'à vista ou 2x', 
    rating: 4.9, 
    reviews: 64, 
    tag: 'Instalação grátis', 
    description: 'Filtro de privacidade anti-olhares laterais, alta resistência a riscos e bordas com curvatura 3D anti-estilhaço.', 
    visual: 'shield', 
    tone: 'linear-gradient(135deg,#d4d9d7,#f7fbfa)',
    stock: 50
  },
  { 
    id: 5, 
    name: 'Carregador Turbo GaN 33W Power Delivery', 
    category: 'Cabos e Carregadores', 
    price: 119.90, 
    installment: '3x de R$ 39,97', 
    rating: 4.8, 
    reviews: 19, 
    tag: 'Mais pedido', 
    description: 'Tecnologia GaN de alta eficiência térmica e carregamento turbo para iPhone, Samsung e Xiaomi.', 
    visual: 'battery', 
    tone: 'linear-gradient(135deg,#f2c85b,#f7eac0)',
    stock: 15
  },
  { 
    id: 6, 
    name: 'Capa Silicone Soft Touch Aveludada', 
    category: 'Capinhas', 
    price: 69.90, 
    installment: '2x de R$ 34,95', 
    rating: 4.6, 
    reviews: 22, 
    description: 'Interior em microfibra macia para não riscar a traseira do aparelho e exterior em silicone antiderrapante.', 
    visual: 'tablet', 
    tone: 'linear-gradient(135deg,#d96131,#edac54)',
    colors: ['Preto', 'Vermelho', 'Rosa Areia', 'Verde Militar', 'Lilás'],
    stock: 30
  },
  { 
    id: 7, 
    name: 'Cartão de Memória SanDisk Ultra 64GB MicroSD', 
    category: 'Cartões de Memória & Armazenamento', 
    price: 65.00, 
    installment: '2x de R$ 32,50', 
    rating: 4.9, 
    reviews: 45, 
    tag: 'Original SanDisk', 
    description: 'Velocidade de transferência até 100MB/s Classe 10 A1, ideal para gravação em Full HD e expansão de memória.', 
    visual: 'laptop', 
    tone: 'linear-gradient(135deg,#1c2331,#2f3b52)',
    stock: 20
  },
  { 
    id: 8, 
    name: 'Suporte Veicular Magnético Articulado 360°', 
    category: 'Suportes', 
    price: 49.90, 
    installment: '2x de R$ 24,95', 
    rating: 4.8, 
    reviews: 33, 
    tag: 'Super Ímã', 
    description: 'Fixação magnética ultra forte para saídas de ar ou painel, com rotação 360 graus para navegação GPS.', 
    visual: 'phone', 
    tone: 'linear-gradient(135deg,#373b44,#4286f4)',
    stock: 22
  }
];

// ==========================================
// CATEGORIAS INICIAIS
// ==========================================
export const DEFAULT_CATEGORIES: DynamicCategory[] = [
  { id: 'cat-1', name: 'Cartões de Memória & Armazenamento', slug: 'cartoes-memoria', iconName: 'Laptop', color: '#3B82F6', description: 'Cartões MicroSD, Pendrives, Leitores e Adaptadores', order: 1, isActive: true },
  { id: 'cat-2', name: 'Cabos e Carregadores', slug: 'cabos-carregadores', iconName: 'Zap', color: '#F59E0B', description: 'Cabos USB, Tipo-C, Lightning, Carregadores rápidos e fontes', order: 2, isActive: true },
  { id: 'cat-3', name: 'Suportes', slug: 'suportes', iconName: 'Smartphone', color: '#8B5CF6', description: 'Suportes veiculares magnéticos, de mesa e tripés articulados', order: 3, isActive: true },
  { id: 'cat-4', name: 'Iluminação & Vídeo', slug: 'iluminacao-video', iconName: 'Sparkles', color: '#EC4899', description: 'Ring lights, luzes LED RGB e iluminação para criadores', order: 4, isActive: true },
  { id: 'cat-5', name: 'Smartwatches e Pulseiras', slug: 'smartwatches', iconName: 'Watch', color: '#10B981', description: 'Relógios inteligentes, smartbands e pulseiras avulsas', order: 5, isActive: true },
  { id: 'cat-6', name: 'Áudio', slug: 'audio', iconName: 'Headphones', color: '#EC4899', description: 'Fones de ouvido bluetooth, headsets e caixas de som', order: 6, isActive: true },
  { id: 'cat-7', name: 'Proteção', slug: 'protecao', iconName: 'ShieldCheck', color: '#06B6D4', description: 'Películas de vidro 3D, privacidade e proteção de câmeras', order: 7, isActive: true },
  { id: 'cat-8', name: 'Power Banks & Baterias', slug: 'power-banks', iconName: 'BatteryCharging', color: '#14B8A6', description: 'Baterias portáteis de alta capacidade e baterias internas', order: 8, isActive: true },
  { id: 'cat-9', name: 'Capinhas', slug: 'capinhas', iconName: 'Smartphone', color: '#D97757', description: 'Capas antichoque, silicone e personalizadas para smartphones', order: 9, isActive: true },
  { id: 'cat-10', name: 'Outros', slug: 'outros', iconName: 'Tag', color: '#6B7280', description: 'Diversos acessórios e utilitários eletrônicos', order: 10, isActive: true },
];

// ==========================================
// CONFIGURAÇÕES PADRÃO DA LOJA
// ==========================================
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Lucca Cell & Loucas Por Esmaltes',
  storeSlogan: 'Catálogo Online & Assistência Técnica Especializada',
  storeLogoUrl: '/favicon.png',
  contactPhone: '(97) 99155-4563',
  whatsappNumber: '5597991554563',
  emailContact: 'contato@luccacell.com',
  address: {
    street: 'Rua Presidente Vargas',
    number: '021',
    neighborhood: 'Centro',
    city: 'Guajará',
    state: 'AM',
    zipCode: '69895-000'
  },
  social: {
    instagram: '@luccacell_am',
    facebook: 'luccacell'
  },
  pixConfig: {
    keyType: 'phone',
    keyValue: '97991554563',
    receiverName: 'Lucca Cell Comércio e Serviços',
    bankName: 'Nubank / Banco Inter',
    city: 'Guajará - AM',
    instructions: 'Envie o comprovante pelo WhatsApp com o número do seu pedido para agilizar a liberação.'
  },
  deliveryConfig: {
    allowPickup: true,
    pickupInstructions: 'Retirada rápida e gratuita em nossa loja física na Rua Presidente Vargas, 021 - Centro.',
    deliveryAvailable: true,
    defaultDeliveryFee: 5.00,
    freeDeliveryThreshold: 150.00,
    estimatedDeliveryTime: 'Entrega rápida no mesmo dia em Guajará e Cruzeiro do Sul.'
  },
  notificationsConfig: {
    soundOnNewOrder: true,
    emailAlerts: false,
    lowStockThreshold: 5,
    alertOnLowStock: true
  },
  aiConfig: {
    defaultModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    temperature: 0.2,
    customPromptInstructions: `Você é o especialista sênior em catalogação e visão computacional da Lucca Cell (Guajará - AM). Analise a imagem do produto seguindo rigorosamente as diretrizes abaixo:

1. IDENTIFICAÇÃO E NOME DO PRODUTO:
- Extraia a MARCA (ex: Kaidi, Hrebos, Basike, PMCELL, Inova, SanDisk, Apple, Samsung) e o MODELO/CÓDIGO visível na embalagem.
- No Nome do Produto, inclua sempre as especificações técnicas essenciais identificadas na foto (ex: '20W', '3.1A', '1m', '2m', '64GB', '10.000mAh', 'Tipo-C', 'Lightning', 'Bluetooth 5.3').
- Formato padrão do Nome: [Marca] + [Tipo do Produto] + [Especificação / Modelo] (Ex: "Cabo Kaidi Tipo-C para Lightning 20W 1m").

2. REGRAS DE CATEGORIZAÇÃO E DESEMPATE:
- Categorize SOMENTE pela FUNÇÃO PRINCIPAL do objeto na foto.
- Cabos e Carregadores: Fontes de tomada, carregadores de parede, cabos USB/Tipo-C/Lightning.
- Suportes: Qualquer item cuja função primária seja segurar/fixar o celular (mesmo com carregamento por indução).
- Capinhas vs. Proteção: 'Capinhas' envolvem o corpo/traseira; 'Proteção' aplica-se a películas de tela (3D, Cerâmica, Privacidade) e câmeras.
- Áudio: Fones TWS, fones com fio, caixas de som e headsets.
- Smartwatches e Pulseiras: Relógios inteligentes e pulseiras avulsas.
- Cartões de Memória & Armazenamento: Cartões MicroSD, adaptadores e pendrives.
- Power Banks & Baterias: Baterias portáteis externas.

3. DESCRIÇÃO COMERCIAL:
- Crie uma descrição atrativa, direta e focada em benefícios para o cliente no WhatsApp.`,
    promptVersion: 1,
    promptHistory: [
      {
        version: 1,
        updatedAt: new Date().toISOString(),
        promptText: 'Classificação oficial de 10 categorias com desempate.',
        notes: 'Versão inicial padrão de alta acurácia'
      }
    ]
  }
};

// ==========================================
// PEDIDOS INICIAIS (DEMO REALISTA)
// ==========================================
export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1082',
    orderNumber: '#LC-1082',
    customerName: 'Marcos Vinícius Silva',
    customerPhone: '97991884422',
    customerAddress: 'Rua das Flores, 140 - Bairro Novo',
    customerNotes: 'Por favor, testar antes de embalar.',
    items: [
      {
        productId: 1,
        productName: 'Carregador Turbo 30W USB-C',
        quantity: 1,
        unitPrice: 79.90,
        totalPrice: 79.90,
        category: 'Cabos e Carregadores'
      },
      {
        productId: 2,
        productName: 'Cabo Trançado USB-C para Lightning 1.2m',
        quantity: 1,
        unitPrice: 45.00,
        totalPrice: 45.00,
        selectedColor: 'Preto',
        category: 'Cabos e Carregadores'
      }
    ],
    subtotal: 124.90,
    discount: 10.00,
    couponCode: 'BEMVINDO10',
    deliveryFee: 5.00,
    total: 119.90,
    paymentMethod: 'pix',
    paymentStatus: 'confirmed',
    status: 'preparing',
    pixReceiptConfirmedBy: 'Admin Lucca',
    pixReceiptConfirmedAt: new Date(Date.now() - 3600000).toISOString(),
    whatsappMessageSent: true,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 'ord-1081',
    orderNumber: '#LC-1081',
    customerName: 'Ana Beatriz Souza',
    customerPhone: '97991443311',
    customerNotes: 'Vou retirar na loja no final da tarde.',
    items: [
      {
        productId: 4,
        productName: 'Fone de Ouvido TWS Bluetooth Pro 5.3',
        quantity: 1,
        unitPrice: 139.90,
        totalPrice: 139.90,
        selectedColor: 'Branco',
        category: 'Áudio'
      }
    ],
    subtotal: 139.90,
    discount: 0,
    deliveryFee: 0,
    total: 139.90,
    paymentMethod: 'loja_fisica',
    paymentStatus: 'pending',
    status: 'pending',
    whatsappMessageSent: true,
    createdAt: new Date(Date.now() - 14400000).toISOString()
  },
  {
    id: 'ord-1080',
    orderNumber: '#LC-1080',
    customerName: 'Carlos Eduardo Lima',
    customerPhone: '97991225588',
    customerAddress: 'Av. Marechal Deodoro, 310 - Centro',
    items: [
      {
        productId: 7,
        productName: 'Película de Vidro 3D Cerâmica iPhone 14/15',
        quantity: 2,
        unitPrice: 35.00,
        totalPrice: 70.00,
        category: 'Proteção'
      },
      {
        productId: 8,
        productName: 'Capinha Anti-Impacto com Borda Reforçada',
        quantity: 1,
        unitPrice: 49.90,
        totalPrice: 49.90,
        selectedColor: 'Fumê Transparente',
        category: 'Capinhas'
      }
    ],
    subtotal: 119.90,
    discount: 0,
    deliveryFee: 5.00,
    total: 124.90,
    paymentMethod: 'pix',
    paymentStatus: 'confirmed',
    status: 'delivered',
    pixReceiptConfirmedBy: 'Admin Lucca',
    pixReceiptConfirmedAt: new Date(Date.now() - 86400000).toISOString(),
    whatsappMessageSent: true,
    createdAt: new Date(Date.now() - 90000000).toISOString()
  }
];

// ==========================================
// CLIENTES INICIAIS
// ==========================================
export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Marcos Vinícius Silva',
    phone: '(97) 99188-4422',
    email: 'marcos.silva@email.com',
    address: 'Rua das Flores, 140 - Bairro Novo',
    city: 'Guajará - AM',
    totalOrders: 3,
    totalSpent: 345.80,
    lastOrderDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: 'cust-2',
    name: 'Ana Beatriz Souza',
    phone: '(97) 99144-3311',
    email: 'ana.souza@email.com',
    city: 'Guajará - AM',
    totalOrders: 1,
    totalSpent: 139.90,
    lastOrderDate: new Date().toISOString(),
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'cust-3',
    name: 'Carlos Eduardo Lima',
    phone: '(97) 99122-5588',
    email: 'carlos.lima@email.com',
    address: 'Av. Marechal Deodoro, 310 - Centro',
    city: 'Guajará - AM',
    totalOrders: 4,
    totalSpent: 489.50,
    lastOrderDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString()
  }
];

// ==========================================
// CUPONS INICIAIS
// ==========================================
export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'cup-1',
    code: 'BEMVINDO10',
    type: 'percentage',
    value: 10,
    minOrderValue: 50.00,
    maxDiscount: 30.00,
    usageLimit: 100,
    usageCount: 14,
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    isActive: true
  },
  {
    id: 'cup-2',
    code: 'LUCCACELL20',
    type: 'fixed',
    value: 20.00,
    minOrderValue: 150.00,
    usageLimit: 50,
    usageCount: 8,
    startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
    isActive: true
  },
  {
    id: 'cup-3',
    code: 'FRETEGRATIS',
    type: 'fixed',
    value: 5.00,
    minOrderValue: 80.00,
    usageLimit: 200,
    usageCount: 42,
    startDate: new Date(Date.now() - 45 * 86400000).toISOString(),
    isActive: true
  }
];

// ==========================================
// STORE API & MÉTODOS CRUD
// ==========================================

export class AdminStore {
  // 0. PRODUTOS (CACHE INSTANTÂNEO 0MS)
  static getProducts(): Product[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_CATALOG_PRODUCTS));
    return INITIAL_CATALOG_PRODUCTS;
  }

  static saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}
  }

  // 1. CATEGORIAS
  static getCategories(): DynamicCategory[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    return DEFAULT_CATEGORIES;
  }

  static saveCategories(categories: DynamicCategory[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch {}
  }

  static addCategory(category: Omit<DynamicCategory, 'id' | 'order'>): DynamicCategory {
    const categories = this.getCategories();
    const newCategory: DynamicCategory = {
      ...category,
      id: `cat-${Date.now()}`,
      order: categories.length + 1,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
    const updated = [...categories, newCategory];
    this.saveCategories(updated);
    return newCategory;
  }

  static updateCategory(id: string, updates: Partial<DynamicCategory>): DynamicCategory[] {
    const categories = this.getCategories();
    const updated = categories.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCategories(updated);
    return updated;
  }

  static deleteCategory(id: string): DynamicCategory[] {
    const categories = this.getCategories();
    const updated = categories.filter(c => c.id !== id);
    this.saveCategories(updated);
    return updated;
  }

  // 2. PEDIDOS
  static getOrders(): Order[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(DEFAULT_ORDERS));
    return DEFAULT_ORDERS;
  }

  static saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }

  static createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'whatsappMessageSent'>): Order {
    const orders = this.getOrders();
    const nextNumber = orders.length > 0 
      ? Math.max(...orders.map(o => parseInt(o.orderNumber.replace('#LC-', ''), 10) || 1000)) + 1
      : 1083;

    const newOrder: Order = {
      ...data,
      id: `ord-${Date.now()}`,
      orderNumber: `#LC-${nextNumber}`,
      whatsappMessageSent: false,
      createdAt: new Date().toISOString()
    };

    const updated = [newOrder, ...orders];
    this.saveOrders(updated);

    // Atualizar/cadastrar cliente automaticamente
    this.recordCustomerOrder(newOrder);

    return newOrder;
  }

  static updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    adminName?: string
  ): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;

    const updated = orders.map(order => {
      if (order.id === orderId) {
        updatedOrder = {
          ...order,
          status,
          updatedAt: new Date().toISOString()
        };
        return updatedOrder;
      }
      return order;
    });

    if (updatedOrder) {
      this.saveOrders(updated);
    }
    return updatedOrder;
  }

  static confirmOrderPayment(
    orderId: string, 
    adminName: string
  ): Order | null {
    const orders = this.getOrders();
    let updatedOrder: Order | null = null;

    const updated = orders.map(order => {
      if (order.id === orderId) {
        updatedOrder = {
          ...order,
          paymentStatus: 'confirmed',
          status: order.status === 'pending' ? 'paid' : order.status,
          pixReceiptConfirmedBy: adminName,
          pixReceiptConfirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        return updatedOrder;
      }
      return order;
    });

    if (updatedOrder) {
      this.saveOrders(updated);
    }
    return updatedOrder;
  }

  static deleteOrder(id: string): Order[] {
    const orders = this.getOrders();
    const updated = orders.filter(o => o.id !== id);
    this.saveOrders(updated);
    return updated;
  }

  // 3. CLIENTES
  static getCustomers(): Customer[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(DEFAULT_CUSTOMERS));
    return DEFAULT_CUSTOMERS;
  }

  static saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch {}
  }

  static recordCustomerOrder(order: Order) {
    const customers = this.getCustomers();
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const existing = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone || (c.email && order.customerEmail && c.email.toLowerCase() === order.customerEmail.toLowerCase()));

    if (existing) {
      existing.totalOrders += 1;
      existing.totalSpent += order.total;
      existing.lastOrderDate = new Date().toISOString();
      if (order.customerAddress && !existing.address) existing.address = order.customerAddress;
      this.saveCustomers([...customers]);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        address: order.customerAddress,
        totalOrders: 1,
        totalSpent: order.total,
        lastOrderDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.saveCustomers([newCust, ...customers]);
    }
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString()
    };
    this.saveCustomers([newCustomer, ...customers]);
    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Customer>): Customer[] {
    const customers = this.getCustomers();
    const updated = customers.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCustomers(updated);
    return updated;
  }

  // 4. CUPONS
  static getCoupons(): Coupon[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.COUPONS);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(DEFAULT_COUPONS));
    return DEFAULT_COUPONS;
  }

  static saveCoupons(coupons: Coupon[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
    } catch {}
  }

  static addCoupon(coupon: Omit<Coupon, 'id' | 'usageCount'>): Coupon {
    const coupons = this.getCoupons();
    const newCoupon: Coupon = {
      ...coupon,
      id: `cup-${Date.now()}`,
      code: coupon.code.trim().toUpperCase(),
      usageCount: 0
    };
    this.saveCoupons([newCoupon, ...coupons]);
    return newCoupon;
  }

  static updateCoupon(id: string, updates: Partial<Coupon>): Coupon[] {
    const coupons = this.getCoupons();
    const updated = coupons.map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCoupons(updated);
    return updated;
  }

  static deleteCoupon(id: string): Coupon[] {
    const coupons = this.getCoupons();
    const updated = coupons.filter(c => c.id !== id);
    this.saveCoupons(updated);
    return updated;
  }

  // 5. CONFIGURAÇÕES
  static getSettings(): StoreSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(raw) };
    } catch {}
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_STORE_SETTINGS));
    return DEFAULT_STORE_SETTINGS;
  }

  static saveSettings(settings: StoreSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
    // Sincroniza em segundo plano com a nuvem (Supabase)
    syncStoreSettingsToSupabase(settings).catch(() => {});
  }

  static async loadSettingsFromCloud(): Promise<StoreSettings> {
    try {
      const cloudSettings = await fetchStoreSettingsFromSupabase();
      if (cloudSettings && typeof cloudSettings === 'object') {
        const merged = { ...DEFAULT_STORE_SETTINGS, ...cloudSettings };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        return merged;
      }
    } catch {}
    return this.getSettings();
  }

  // 6. WHATSAPP LINK GENERATOR
  static generateWhatsAppOrderLink(order: Order, storeSettings: StoreSettings): string {
    const phone = (storeSettings.whatsappNumber || '5597991554563').replace(/\D/g, '');
    const itemsList = order.items
      .map(i => `• ${i.quantity}x ${i.productName}${i.selectedColor ? ` (${i.selectedColor})` : ''} - R$ ${i.totalPrice.toFixed(2)}`)
      .join('\n');

    const paymentText = order.paymentMethod === 'pix' ? 'Pix' : 'Pagamento presencial na loja';
    const statusText = order.paymentStatus === 'confirmed' ? '✅ Pagamento Confirmado' : '⏳ Aguardando Confirmação';

    const message = `Olá, *${order.customerName}*! Segue o resumo do seu pedido na *${storeSettings.storeName}*:\n\n` +
      `📦 *Pedido ${order.orderNumber}*\n` +
      `📅 Data: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}\n\n` +
      `🛒 *Itens:* \n${itemsList}\n\n` +
      (order.discount > 0 ? `🎟️ Desconto: R$ ${order.discount.toFixed(2)}\n` : '') +
      (order.deliveryFee > 0 ? `🚚 Taxa de Entrega: R$ ${order.deliveryFee.toFixed(2)}\n` : '') +
      `💰 *Total:* R$ ${order.total.toFixed(2)}\n` +
      `💳 *Forma de Pagamento:* ${paymentText} (${statusText})\n` +
      (order.customerAddress ? `📍 *Endereço:* ${order.customerAddress}\n` : '📍 *Retirada:* Na Loja Física (Rua Presidente Vargas, 021 - Centro)\n') +
      (order.customerNotes ? `📝 *Observação:* ${order.customerNotes}\n\n` : '\n') +
      `Caso tenha alguma dúvida ou precise alterar algo, estamos à disposição! 📲`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
}
