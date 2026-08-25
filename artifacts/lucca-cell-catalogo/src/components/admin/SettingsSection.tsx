import React, { useState } from 'react';
import { 
  Settings, 
  Store, 
  QrCode, 
  Truck, 
  Bell, 
  Shield, 
  Sparkles, 
  Save, 
  Check, 
  Key, 
  Smartphone, 
  MapPin, 
  Mail, 
  Phone,
  AlertCircle
} from 'lucide-react';
import { StoreSettings } from '@/types/admin';
import { 
  setSelectedOpenRouterModel, 
  getSelectedOpenRouterModel, 
  getModelDisplayName,
  KNOWN_AI_MODELS 
} from '@/services/openrouter';

interface SettingsSectionProps {
  settings: StoreSettings;
  onSaveSettings: (newSettings: StoreSettings) => void;
}

export function SettingsSection({
  settings,
  onSaveSettings
}: SettingsSectionProps) {
  const [activeTab, setActiveTab] = useState<'loja' | 'pagamentos' | 'entrega' | 'notificacoes' | 'ia'>('loja');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.aiConfig?.defaultModel) {
      setSelectedOpenRouterModel(formData.aiConfig.defaultModel);
    }
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Personalização & Operação
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              Lucca Cell
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Configurações da Loja
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Configure dados da loja física, recebimento Pix, regras de frete e integrações de IA.
          </p>
        </div>

        <button
          type="submit"
          form="settings-form"
          className="inline-flex items-center gap-2 rounded-2xl bg-[#D97757] text-white px-6 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
        >
          {savedSuccess ? <Check size={16} /> : <Save size={16} />}
          <span>{savedSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Navegação de Sub-Abas */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('loja')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'loja' ? 'bg-[#1E1D1B] text-white' : 'bg-[#FFFFFF] text-[#7A7368] border border-[#E7E0D5]'
          }`}
        >
          <Store size={16} />
          <span>Dados da Loja</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pagamentos')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'pagamentos' ? 'bg-[#1E1D1B] text-white' : 'bg-[#FFFFFF] text-[#7A7368] border border-[#E7E0D5]'
          }`}
        >
          <QrCode size={16} />
          <span>Pagamentos (Pix & Loja)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entrega')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'entrega' ? 'bg-[#1E1D1B] text-white' : 'bg-[#FFFFFF] text-[#7A7368] border border-[#E7E0D5]'
          }`}
        >
          <Truck size={16} />
          <span>Retirada & Frete</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notificacoes')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'notificacoes' ? 'bg-[#1E1D1B] text-white' : 'bg-[#FFFFFF] text-[#7A7368] border border-[#E7E0D5]'
          }`}
        >
          <Bell size={16} />
          <span>Notificações</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ia')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[44px] ${
            activeTab === 'ia' ? 'bg-[#1E1D1B] text-white' : 'bg-[#FFFFFF] text-[#7A7368] border border-[#E7E0D5]'
          }`}
        >
          <Sparkles size={16} />
          <span>Configuração IA</span>
        </button>
      </div>

      {/* Formulário Principal */}
      <form id="settings-form" onSubmit={handleSave} className="bg-[#FFFFFF] p-6 rounded-3xl border border-[#E7E0D5] shadow-xs space-y-6">
        
        {/* ─────────────────────────────────────────────────────────────
            SUB-ABA 1: LOJA
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'loja' && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1E1D1B] border-b border-[#EFE9E0] pb-3">
              Identificação & Contato da Lucca Cell
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Nome da Loja
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Slogan do Catálogo
                </label>
                <input
                  type="text"
                  value={formData.storeSlogan}
                  onChange={e => setFormData({ ...formData, storeSlogan: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  WhatsApp de Vendas (com DDI e DDD)
                </label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  placeholder="5597991554563"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-mono text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Telefone de Contato Exibido
                </label>
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="(97) 99155-4563"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Endereço Físico (Rua e Número)
                </label>
                <input
                  type="text"
                  value={`${formData.address.street}, ${formData.address.number}`}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value.split(',')[0] || '', number: e.target.value.split(',')[1] || '021' } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Cidade e Estado
                </label>
                <input
                  type="text"
                  value={`${formData.address.city} - ${formData.address.state}`}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, city: 'Guajará', state: 'AM' } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SUB-ABA 2: PAGAMENTOS (PIX & LOJA FÍSICA)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'pagamentos' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
                Configuração de Pagamento (Sem Gateway Externo)
              </h3>
              <p className="text-xs text-[#7A7368] mt-0.5">
                A Lucca Cell opera com pagamento presencial no balcão da loja e transferência Pix direto na conta.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Fluxo 100% Seguro e Sem Taxas de Intermediação</strong>
                Os clientes enviam o pedido via WhatsApp. Você confere o comprovante Pix diretamente no aplicativo do seu banco antes de aprovar e separar o pedido.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Tipo de Chave Pix
                </label>
                <select
                  value={formData.pixConfig.keyType}
                  onChange={e => setFormData({ ...formData, pixConfig: { ...formData.pixConfig, keyType: e.target.value as any } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                >
                  <option value="phone">Telefone / Celular</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="random">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={formData.pixConfig.keyValue}
                  onChange={e => setFormData({ ...formData, pixConfig: { ...formData.pixConfig, keyValue: e.target.value } })}
                  placeholder="97991554563"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-mono font-bold text-[#B05330]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Nome do Titular da Conta
                </label>
                <input
                  type="text"
                  value={formData.pixConfig.receiverName}
                  onChange={e => setFormData({ ...formData, pixConfig: { ...formData.pixConfig, receiverName: e.target.value } })}
                  placeholder="Lucca Cell Comércio"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Banco / Instituição Financeira
                </label>
                <input
                  type="text"
                  value={formData.pixConfig.bankName}
                  onChange={e => setFormData({ ...formData, pixConfig: { ...formData.pixConfig, bankName: e.target.value } })}
                  placeholder="Nubank / Banco Inter"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                Instruções Padrão de Pagamento Pix para o Cliente
              </label>
              <textarea
                rows={3}
                value={formData.pixConfig.instructions}
                onChange={e => setFormData({ ...formData, pixConfig: { ...formData.pixConfig, instructions: e.target.value } })}
                className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
              />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SUB-ABA 3: RETIRADA & ENTREGA
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'entrega' && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1E1D1B] border-b border-[#EFE9E0] pb-3">
              Opções de Entrega & Retirada em Guajará - AM
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Taxa Padrão de Entrega Local (R$)
                </label>
                <input
                  type="number"
                  value={formData.deliveryConfig.defaultDeliveryFee}
                  onChange={e => setFormData({ ...formData, deliveryConfig: { ...formData.deliveryConfig, defaultDeliveryFee: parseFloat(e.target.value) || 0 } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Frete Grátis a partir de (R$)
                </label>
                <input
                  type="number"
                  value={formData.deliveryConfig.freeDeliveryThreshold}
                  onChange={e => setFormData({ ...formData, deliveryConfig: { ...formData.deliveryConfig, freeDeliveryThreshold: parseFloat(e.target.value) || 0 } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                Instruções de Retirada no Balcão
              </label>
              <textarea
                rows={2}
                value={formData.deliveryConfig.pickupInstructions}
                onChange={e => setFormData({ ...formData, deliveryConfig: { ...formData.deliveryConfig, pickupInstructions: e.target.value } })}
                className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
              />
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SUB-ABA 4: NOTIFICAÇÕES
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1E1D1B] border-b border-[#EFE9E0] pb-3">
              Alertas do Painel
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[#1E1D1B] block">Alerta de Estoque Crítico</span>
                  <span className="text-[11px] text-[#7A7368]">Avisar no topo do painel quando um produto estiver acabando</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notificationsConfig.alertOnLowStock}
                  onChange={e => setFormData({ ...formData, notificationsConfig: { ...formData.notificationsConfig, alertOnLowStock: e.target.checked } })}
                  className="h-5 w-5 rounded border-[#E0D8CC] text-[#D97757] focus:ring-[#D97757]"
                />
              </label>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Limite para Alerta de Estoque Baixo (Unidades)
                </label>
                <input
                  type="number"
                  value={formData.notificationsConfig.lowStockThreshold}
                  onChange={e => setFormData({ ...formData, notificationsConfig: { ...formData.notificationsConfig, lowStockThreshold: parseInt(e.target.value, 10) || 3 } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SUB-ABA 5: IA
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'ia' && (
          <div className="space-y-4">
            <h3 className="text-base font-serif font-bold text-[#1E1D1B] border-b border-[#EFE9E0] pb-3">
              Configurações do Scanner de IA (Visão Computacional)
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-2">
                Escolha a IA Ativa para a Loja
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                {Object.entries(KNOWN_AI_MODELS).map(([modelId, info]) => {
                  const isSelected = formData.aiConfig.defaultModel === modelId;
                  return (
                    <button
                      key={modelId}
                      type="button"
                      onClick={() => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, defaultModel: modelId } })}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-start justify-between gap-2 ${
                        isSelected 
                          ? 'border-[#D97757] bg-[#FAF0E8] shadow-2xs' 
                          : 'border-[#E0D8CC] bg-[#FAF7F2] hover:border-[#D97757]/60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-[#1E1D1B] truncate">{info.name}</span>
                          {info.isFree ? (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2">Grátis</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2">Pro</span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-[#7A7368] block truncate mt-0.5">{modelId}</span>
                      </div>
                      {isSelected && (
                        <span className="h-5 w-5 rounded-full bg-[#D97757] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  ID do Modelo (Customizado ou Selecionado)
                </label>
                <input
                  type="text"
                  value={formData.aiConfig.defaultModel}
                  onChange={e => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, defaultModel: e.target.value } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-mono text-[#1E1D1B]"
                  placeholder="ex: nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  Temperatura (Criatividade vs. Precisão)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.aiConfig.temperature}
                  onChange={e => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, temperature: parseFloat(e.target.value) || 0.2 } })}
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                Instruções Personalizadas do Prompt de Visão
              </label>
              <textarea
                rows={3}
                value={formData.aiConfig.customPromptInstructions}
                onChange={e => setFormData({ ...formData, aiConfig: { ...formData.aiConfig, customPromptInstructions: e.target.value } })}
                className="w-full p-3 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs text-[#1E1D1B]"
              />
            </div>
          </div>
        )}

      </form>

    </div>
  );
}
