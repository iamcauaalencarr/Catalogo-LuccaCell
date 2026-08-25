import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Search, Check, Zap, RefreshCw, Eye, CheckCircle2 
} from 'lucide-react';
import { 
  fetchOpenRouterModels, 
  OpenRouterModelItem, 
  getSelectedOpenRouterModel, 
  setSelectedOpenRouterModel
} from '@/services/openrouter';

interface AIModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveModel?: (newModel: string) => void;
}

const FEATURED_VISION_MODELS = [
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
    name: 'NVIDIA Nemotron 3 Nano Omni (Grátis & Visão)',
    description: 'Modelo oficial da NVIDIA com raciocínio multimodal e alta velocidade para análise por foto.',
    isFree: true,
    isVision: true,
    provider: 'NVIDIA',
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Auto (Modelos Gratuitos com Visão)',
    description: 'Roteador inteligente oficial da OpenRouter que seleciona automaticamente o melhor modelo gratuito ativo com suporte a imagens.',
    isFree: true,
    isVision: true,
    provider: 'OpenRouter',
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 Lightning (Grátis)',
    description: 'Modelo ultrarrápido da NVIDIA para extração de especificações e texto de embalagens.',
    isFree: true,
    isVision: true,
    provider: 'NVIDIA',
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Anthropic Claude 3.5 Haiku (Chave Direta)',
    description: 'Modelo de visão oficial da Anthropic de altíssima precisão e raciocínio técnico rápido.',
    isFree: false,
    isVision: true,
    provider: 'Anthropic',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Google Gemini 2.5 Flash (Comercial)',
    description: 'Versão comercial ultra rápida do Gemini para visão (requer créditos OpenRouter).',
    isFree: false,
    isVision: true,
    provider: 'Google',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini (Comercial)',
    description: 'Modelo comercial da OpenAI com excelente raciocínio visual (requer créditos OpenRouter).',
    isFree: false,
    isVision: true,
    provider: 'OpenAI',
  },
];

export function AIModelSelectorModal({ isOpen, onClose, onSaveModel }: AIModelSelectorModalProps) {
  const [selectedModel, setSelectedModel] = useState<string>(() => getSelectedOpenRouterModel());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'vision'>('all');
  const [allModels, setAllModels] = useState<OpenRouterModelItem[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedModel(getSelectedOpenRouterModel());
      loadModels();
    }
  }, [isOpen]);

  const loadModels = async () => {
    setLoadingModels(true);
    const models = await fetchOpenRouterModels();
    setAllModels(models);
    setLoadingModels(false);
  };

  if (!isOpen) return null;

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleSave = () => {
    setSelectedOpenRouterModel(selectedModel);
    if (onSaveModel) {
      onSaveModel(selectedModel);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  // Filtragem de todos os modelos
  const filteredAllModels = allModels.filter((model) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      model.id.toLowerCase().includes(term) || 
      model.name.toLowerCase().includes(term) || 
      (model.description && model.description.toLowerCase().includes(term));
    
    if (!matchesSearch) return false;

    const isFree = model.id.endsWith(':free') || 
      (model.pricing?.prompt === 0 && model.pricing?.completion === 0);
    const isVision = 
      model.architecture?.modality?.includes('image') ||
      model.architecture?.input_modalities?.includes('image') ||
      /vision|vl|pixtral|gemini|4o|claude-3|gemma.*it/i.test(model.id);

    if (filterType === 'free' && !isFree) return false;
    if (filterType === 'vision' && !isVision) return false;

    return true;
  });

  const filteredFeatured = FEATURED_VISION_MODELS.filter((model) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      model.id.toLowerCase().includes(term) || 
      model.name.toLowerCase().includes(term) || 
      model.description.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (filterType === 'free' && !model.isFree) return false;
    if (filterType === 'vision' && !model.isVision) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#141210]/80 backdrop-blur-md">
      <div 
        className="relative flex flex-col w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-[#D97757]/30 bg-[#FFFFFF] shadow-2xl animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#D97757] via-[#E28E72] to-[#B05330]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F0E4D5] px-6 py-4 bg-[#FAF4ED]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D97757] text-[#FFFFFF] shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97757]">
                  Exclusivo Owner
                </span>
                <span className="rounded-full bg-[#E0D8CC]/50 px-2 py-0.5 text-[10px] font-bold text-[#6E675D]">
                  IA Multimodal
                </span>
              </div>
              <h2 className="text-lg font-bold text-[#1E1D1B] font-['Outfit']">
                Configuração de Modelo da IA
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#6E675D] hover:bg-[#F0E4D5] hover:text-[#1E1D1B] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="border-b border-[#F0E4D5] bg-[#FAF8F5] px-6 py-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-[#9E9487]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar modelo por nome (ex: free, gemini, llama, pixtral, gpt-4o)..."
                className="w-full rounded-xl border border-[#E0D8CC] bg-[#FFFFFF] pl-9 pr-3 py-1.5 text-xs text-[#1E1D1B] placeholder-[#9E9487] focus:border-[#D97757] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={loadModels}
              disabled={loadingModels}
              title="Recarregar modelos da OpenRouter"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E0D8CC] bg-[#FFFFFF] text-[#6E675D] hover:text-[#1E1D1B] hover:bg-[#F0E4D5] disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingModels ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            {/* Abas */}
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('featured')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'featured'
                    ? 'bg-[#D97757] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] border border-[#E0D8CC] text-[#6E675D] hover:text-[#1E1D1B]'
                }`}
              >
                Modelos Recomendados ({FEATURED_VISION_MODELS.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#D97757] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] border border-[#E0D8CC] text-[#6E675D] hover:text-[#1E1D1B]'
                }`}
              >
                Todos da OpenRouter ({allModels.length > 0 ? allModels.length : '...'})
              </button>
            </div>

            {/* Filtros rápidos */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  filterType === 'all' ? 'bg-[#E0D8CC] text-[#1E1D1B]' : 'text-[#6E675D] hover:bg-[#E0D8CC]/50'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('free')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  filterType === 'free' ? 'bg-[#22c55e]/20 text-[#15803d]' : 'text-[#6E675D] hover:bg-[#E0D8CC]/50'
                }`}
              >
                Gratuitos
              </button>
              <button
                type="button"
                onClick={() => setFilterType('vision')}
                className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  filterType === 'vision' ? 'bg-[#D97757]/20 text-[#B05330]' : 'text-[#6E675D] hover:bg-[#E0D8CC]/50'
                }`}
              >
                Com Visão
              </button>
            </div>
          </div>
        </div>

        {/* Model List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 max-h-[380px]">
          {activeTab === 'featured' ? (
            filteredFeatured.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D97757] bg-[#FAF4ED] shadow-sm'
                      : 'border-[#E0D8CC] bg-[#FFFFFF] hover:border-[#D97757]/50 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#1E1D1B] font-['Outfit']">
                        {model.name}
                      </span>
                      {model.isFree && (
                        <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[10px] font-bold text-[#15803d]">
                          GRÁTIS
                        </span>
                      )}
                      {model.isVision && (
                        <span className="rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-bold text-[#B05330] flex items-center gap-1">
                          <Eye size={10} /> Visão
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6E675D]">
                      {model.description}
                    </p>
                    <code className="text-[10px] text-[#9E9487] font-mono block">
                      {model.id}
                    </code>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div
                      className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-[#D97757] bg-[#D97757] text-[#FFFFFF]'
                          : 'border-[#E0D8CC] bg-[#FFFFFF]'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                </div>
              );
            })
          ) : loadingModels ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[#6E675D]">
              <RefreshCw size={24} className="animate-spin text-[#D97757] mb-2" />
              <p className="text-xs font-semibold">Carregando lista completa de modelos da OpenRouter...</p>
            </div>
          ) : filteredAllModels.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#9E9487]">
              Nenhum modelo encontrado para o filtro digitado.
            </div>
          ) : (
            filteredAllModels.map((model) => {
              const isSelected = selectedModel === model.id;
              const isFree = model.id.endsWith(':free') || 
                (model.pricing?.prompt === 0 && model.pricing?.completion === 0);
              const isVision = 
                model.architecture?.modality?.includes('image') ||
                model.architecture?.input_modalities?.includes('image') ||
                /vision|vl|pixtral|gemini|4o|claude-3/i.test(model.id);

              return (
                <div
                  key={model.id}
                  onClick={() => handleSelectModel(model.id)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D97757] bg-[#FAF4ED] shadow-sm'
                      : 'border-[#E0D8CC] bg-[#FFFFFF] hover:border-[#D97757]/50 hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-[#1E1D1B] font-['Outfit']">
                        {model.name || model.id}
                      </span>
                      {isFree && (
                        <span className="rounded-full bg-[#22c55e]/15 px-2 py-0.5 text-[9px] font-bold text-[#15803d]">
                          GRÁTIS
                        </span>
                      )}
                      {isVision && (
                        <span className="rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[9px] font-bold text-[#B05330] flex items-center gap-1">
                          <Eye size={9} /> Visão
                        </span>
                      )}
                    </div>
                    {model.description && (
                      <p className="text-[11px] text-[#6E675D] line-clamp-1">
                        {model.description}
                      </p>
                    )}
                    <code className="text-[10px] text-[#9E9487] font-mono block">
                      {model.id}
                    </code>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div
                      className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-[#D97757] bg-[#D97757] text-[#FFFFFF]'
                          : 'border-[#E0D8CC] bg-[#FFFFFF]'
                      }`}
                    >
                      {isSelected && <Check size={12} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-[#F0E4D5] bg-[#FAF4ED] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6E675D]">Modelo Escolhido:</span>
            <code className="rounded-md bg-[#FFFFFF] border border-[#E0D8CC] px-2 py-0.5 text-xs font-mono font-bold text-[#D97757]">
              {selectedModel}
            </code>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E0D8CC] px-4 py-2 text-xs font-bold text-[#4A443B] hover:bg-[#FFFFFF] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-xl bg-[#D97757] px-5 py-2 text-xs font-bold text-[#FFFFFF] shadow-md hover:bg-[#B05330] transition-colors"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 size={14} /> Salvo com Sucesso!
                </>
              ) : (
                <>
                  <Zap size={14} /> Salvar Escolha
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
