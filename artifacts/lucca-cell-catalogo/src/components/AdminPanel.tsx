import React, { useState, useEffect } from 'react';
import { AdminProfile } from '@/lib/supabase';
import { 
  Product, 
  DynamicCategory, 
  Order, 
  Customer, 
  Coupon, 
  StoreSettings, 
  AdminTab,
  OrderStatus 
} from '@/types/admin';
import { AdminStore } from '@/services/adminStore';

// Modais Auxiliares
import { AIVisionModal } from '@/components/AIVisionModal';
import { AIModelSelectorModal } from '@/components/AIModelSelectorModal';
import { ScannedProductData } from '@/services/openrouter';

// Componentes Modulares do Painel
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DashboardSection } from '@/components/admin/DashboardSection';
import { ProductsSection } from '@/components/admin/ProductsSection';
import { ProductFormModal } from '@/components/admin/ProductFormModal';
import { CategoriesSection } from '@/components/admin/CategoriesSection';
import { OrdersSection } from '@/components/admin/OrdersSection';
import { CustomersSection } from '@/components/admin/CustomersSection';
import { CouponsSection } from '@/components/admin/CouponsSection';
import { RequestsSection } from '@/components/admin/RequestsSection';
import { TeamSection } from '@/components/admin/TeamSection';
import { AuditSection } from '@/components/admin/AuditSection';
import { SettingsSection } from '@/components/admin/SettingsSection';
import { AIPlaygroundSection } from '@/components/admin/AIPlaygroundSection';

// Exportando os tipos para compatibilidade com outros arquivos
export type { Product, DynamicCategory } from '@/types/admin';
export type Category = string;

interface AdminPanelProps {
  products: Product[];
  currentUser: AdminProfile;
  onAddProduct: (product: Omit<Product, 'id' | 'rating' | 'reviews'>) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onCloseAdmin: () => void;
  onLogout?: () => void;
}

export function AdminPanel({
  products,
  currentUser,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onCloseAdmin,
  onLogout
}: AdminPanelProps) {
  if (!currentUser || !currentUser.is_active) {
    return null;
  }

  // ─────────────────────────────────────────────────────────────
  // ESTADOS PRINCIPAIS DO ADMIN STORE
  // ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [categories, setCategories] = useState<DynamicCategory[]>(() => AdminStore.getCategories());
  const [orders, setOrders] = useState<Order[]>(() => AdminStore.getOrders());
  const [customers, setCustomers] = useState<Customer[]>(() => AdminStore.getCustomers());
  const [coupons, setCoupons] = useState<Coupon[]>(() => AdminStore.getCoupons());
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => AdminStore.getSettings());

  // Modais de Controle
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAIModelModalOpen, setIsAIModelModalOpen] = useState(false);

  // Recalcular pendências para badges
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'paid' || o.status === 'preparing').length;
  const lowStockThreshold = storeSettings.notificationsConfig?.lowStockThreshold || 5;
  const lowStockCount = products.filter(p => (p.stock !== undefined && p.stock <= lowStockThreshold && p.stock > 0) || p.stock === 0).length;

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE PRODUTOS
  // ─────────────────────────────────────────────────────────────
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = async (productData: any) => {
    if (editingProduct && typeof editingProduct.id === 'number') {
      onEditProduct(productData);
    } else {
      onAddProduct(productData);
    }
  };

  const handleBulkDelete = (ids: number[]) => {
    ids.forEach(id => onDeleteProduct(id));
  };

  const handleBulkUpdateCategory = (ids: number[], newCategory: string) => {
    ids.forEach(id => {
      const prod = products.find(p => p.id === id);
      if (prod) {
        onEditProduct({ ...prod, category: newCategory });
      }
    });
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DO SCANNER IA
  // ─────────────────────────────────────────────────────────────
  const handleApplyAIData = (data: ScannedProductData) => {
    setIsAIModalOpen(false);
    
    const matchedCategory = categories.find(c => c.name.toLowerCase() === (data.category || '').toLowerCase())?.name || categories[0]?.name || 'Outros';

    const newProdPayload: any = {
      name: data.name || 'Novo Produto Identificado',
      category: matchedCategory,
      price: data.price || 49.90,
      oldPrice: data.oldPrice || undefined,
      description: data.description || 'Produto de alta performance com garantia Lucca Cell.',
      tag: data.tag || 'LANÇAMENTO',
      visual: data.visual || 'phone',
      tone: data.tone || 'gold',
      image: data.image || undefined,
      stock: 10,
      minStockAlert: 3,
      status: 'active'
    };

    setEditingProduct(newProdPayload);
    setIsProductFormOpen(true);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE CATEGORIAS
  // ─────────────────────────────────────────────────────────────
  const handleAddCategory = (catData: Omit<DynamicCategory, 'id' | 'order'>) => {
    const newCat = AdminStore.addCategory(catData);
    setCategories(AdminStore.getCategories());
  };

  const handleUpdateCategory = (id: string, updates: Partial<DynamicCategory>) => {
    const updated = AdminStore.updateCategory(id, updates);
    setCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (catToDelete) {
      // Reatribuir produtos desta categoria para "Outros"
      products.forEach(prod => {
        if (prod.category?.toLowerCase() === catToDelete.name.toLowerCase()) {
          onEditProduct({ ...prod, category: 'Outros' });
        }
      });
    }
    const updated = AdminStore.deleteCategory(id);
    setCategories(updated);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE PEDIDOS
  // ─────────────────────────────────────────────────────────────
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updated = AdminStore.updateOrderStatus(orderId, status, currentUser.name);
    setOrders(AdminStore.getOrders());
  };

  const handleConfirmPayment = (orderId: string) => {
    const updated = AdminStore.confirmOrderPayment(orderId, currentUser.name || 'Admin');
    setOrders(AdminStore.getOrders());
  };

  const handleDeleteOrder = (orderId: string) => {
    const updated = AdminStore.deleteOrder(orderId);
    setOrders(updated);
  };

  const handleCreateOrder = (orderData: any) => {
    const newOrder = AdminStore.createOrder(orderData);
    setOrders(AdminStore.getOrders());
    setCustomers(AdminStore.getCustomers());
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE CLIENTES & CUPONS
  // ─────────────────────────────────────────────────────────────
  const handleAddCustomer = (custData: any) => {
    AdminStore.addCustomer(custData);
    setCustomers(AdminStore.getCustomers());
  };

  const handleUpdateCustomer = (id: string, updates: any) => {
    const updated = AdminStore.updateCustomer(id, updates);
    setCustomers(updated);
  };

  const handleAddCoupon = (couponData: any) => {
    AdminStore.addCoupon(couponData);
    setCoupons(AdminStore.getCoupons());
  };

  const handleUpdateCoupon = (id: string, updates: any) => {
    const updated = AdminStore.updateCoupon(id, updates);
    setCoupons(updated);
  };

  const handleDeleteCoupon = (id: string) => {
    const updated = AdminStore.deleteCoupon(id);
    setCoupons(updated);
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS DE CONFIGURAÇÕES
  // ─────────────────────────────────────────────────────────────
  const handleSaveSettings = (newSettings: StoreSettings) => {
    AdminStore.saveSettings(newSettings);
    setStoreSettings(newSettings);
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      currentUser={currentUser}
      storeSettings={storeSettings}
      pendingOrdersCount={pendingOrdersCount}
      pendingRequestsCount={0}
      lowStockCount={lowStockCount}
      onNewProduct={handleOpenNewProduct}
      onOpenAIModal={() => setIsAIModalOpen(true)}
      onCloseAdmin={onCloseAdmin}
      onLogout={onLogout}
    >
      
      {/* 1. VISÃO GERAL (DASHBOARD) */}
      {activeTab === 'dashboard' && (
        <DashboardSection
          products={products}
          orders={orders}
          currentUser={currentUser}
          storeSettings={storeSettings}
          onNavigateTab={setActiveTab}
          onNewProduct={handleOpenNewProduct}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onSelectOrder={(order) => {
            setActiveTab('orders');
          }}
        />
      )}

      {/* 2. PRODUTOS */}
      {activeTab === 'products' && (
        <ProductsSection
          products={products}
          categories={categories}
          currentUser={currentUser}
          onNewProduct={handleOpenNewProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={onDeleteProduct}
          onBulkDelete={handleBulkDelete}
          onBulkUpdateCategory={handleBulkUpdateCategory}
          onOpenAIModal={() => setIsAIModalOpen(true)}
        />
      )}

      {/* 3. CATEGORIAS */}
      {activeTab === 'categories' && (
        <CategoriesSection
          categories={categories}
          products={products}
          onAddCategory={handleAddCategory}
          onUpdateCategory={handleUpdateCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {/* 4. PEDIDOS (WHATSAPP / PIX / BALCÃO) */}
      {activeTab === 'orders' && (
        <OrdersSection
          orders={orders}
          products={products}
          storeSettings={storeSettings}
          currentUser={currentUser}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onConfirmPayment={handleConfirmPayment}
          onDeleteOrder={handleDeleteOrder}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* 5. CLIENTES */}
      {activeTab === 'customers' && (
        <CustomersSection
          customers={customers}
          orders={orders}
          onAddCustomer={handleAddCustomer}
          onUpdateCustomer={handleUpdateCustomer}
        />
      )}

      {/* 6. CUPONS & PROMOÇÕES */}
      {activeTab === 'coupons' && (
        <CouponsSection
          coupons={coupons}
          categories={categories}
          onAddCoupon={handleAddCoupon}
          onUpdateCoupon={handleUpdateCoupon}
          onDeleteCoupon={handleDeleteCoupon}
        />
      )}

      {/* 7. SOLICITAÇÕES DE PRODUTOS */}
      {activeTab === 'requests' && (
        <RequestsSection currentUser={currentUser} />
      )}

      {/* 8. EQUIPE & PERMISSÕES (RBAC) */}
      {activeTab === 'team' && (
        <TeamSection currentUser={currentUser} />
      )}

      {/* 9. AUDITORIA DE LOGS */}
      {activeTab === 'audit' && (
        <AuditSection />
      )}

      {/* 10. CONFIGURAÇÕES */}
      {activeTab === 'settings' && (
        <SettingsSection
          settings={storeSettings}
          onSaveSettings={handleSaveSettings}
        />
      )}

      {/* 11. PLAYGROUND IA */}
      {activeTab === 'ai_playground' && (
        <AIPlaygroundSection
          storeSettings={storeSettings}
          categories={categories}
          onOpenModelSelector={() => setIsAIModelModalOpen(true)}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAIS GLOBAIS
      ───────────────────────────────────────────────────────────── */}
      {/* Formulário Completo de Produto */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
        onOpenAIModal={() => setIsAIModalOpen(true)}
      />

      {/* Scanner Visual de IA */}
      <AIVisionModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onApplyAIData={handleApplyAIData}
      />

      {/* Seletor de Modelo de IA */}
      <AIModelSelectorModal
        isOpen={isAIModelModalOpen}
        onClose={() => setIsAIModelModalOpen(false)}
        onSaveModel={(newModel) => {
          const updatedSettings = {
            ...storeSettings,
            aiConfig: {
              ...storeSettings.aiConfig,
              defaultModel: newModel
            }
          };
          handleSaveSettings(updatedSettings);
        }}
      />

    </AdminLayout>
  );
}
