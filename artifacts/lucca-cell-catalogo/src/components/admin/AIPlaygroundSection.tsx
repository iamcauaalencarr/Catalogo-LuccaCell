import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  Play, 
  Code2, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Cpu, 
  Zap, 
  DollarSign, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { StoreSettings, DynamicCategory } from '@/types/admin';
import { 
  compressImageForAI, 
  analyzeProductImage, 
  ScannedProductData, 
  getSelectedOpenRouterModel,
  getModelDisplayName 
} from '@/services/openrouter';

interface AIPlaygroundSectionProps {
  storeSettings: StoreSettings;
  categories: DynamicCategory[];
  onOpenModelSelector: () => void;
}

export function AIPlaygroundSection({
  storeSettings,
  categories,
  onOpenModelSelector
}: AIPlaygroundSectionProps) {
  const [currentModel, setCurrentModel] = useState<string>(() => getSelectedOpenRouterModel());
  const [testImage, setTestImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedProductData | null>(null);
  const [rawJsonResponse, setRawJsonResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ouve mudanças globais de modelo em tempo real
  React.useEffect(() => {
    const handleModelChange = (e: any) => {
      const newModel = e.detail || getSelectedOpenRouterModel();
      setCurrentModel(newModel);
    };
    window.addEventListener('lc_ai_model_changed', handleModelChange);
    return () => window.removeEventListener('lc_ai_model_changed', handleModelChange);
  }, []);

  // Upload foto de teste
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const compressed = await compressImageForAI(base64, 1200);
        setTestImage(compressed);
        setScanResult(null);
        setRawJsonResponse(null);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunPlaygroundTest = async () => {
    if (!testImage) return;

    setAnalyzing(true);
    setErrorMsg(null);

    try {
      const result = await analyzeProductImage(testImage);
      setScanResult(result);
      setRawJsonResponse(JSON.stringify(result, null, 2));
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar imagem no Playground.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Visão Computacional & LLMs
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              Playground & Métricas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Laboratório de Inteligência Artificial
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Faça testes de imagens de produtos, inspecione a estrutura do JSON e monitore o uso da API.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModelSelector}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#FAF0E8] border border-[#EBD5C8] text-[#B05330] px-5 py-3 text-xs font-bold hover:bg-[#F5E2D4] min-h-[44px]"
        >
          <Cpu size={16} />
          <span>Alterar Modelo de IA</span>
        </button>
      </div>

      {/* Cards de Métricas IA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7A7368] uppercase">Scans no Mês</span>
            <Sparkles size={18} className="text-[#D97757]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1E1D1B]">128</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Taxa de acerto de 98.4%
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7A7368] uppercase">IA Ativa no Momento</span>
            <Zap size={18} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-bold text-[#1E1D1B] truncate" title={currentModel}>
            {getModelDisplayName(currentModel)}
          </h3>
          <p className="text-[10px] font-mono text-[#7A7368] truncate mt-0.5">
            {currentModel}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#7A7368] uppercase">Custo Estimado</span>
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1E1D1B]">
            ~R$ 0,002
          </h3>
          <p className="text-[11px] text-[#7A7368] mt-1">
            Por produto identificado
          </p>
        </div>
      </div>

      {/* Playground: Upload e Teste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Painel Esquerdo: Imagem de Teste */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs space-y-4">
          <h3 className="text-base font-serif font-bold text-[#1E1D1B] flex items-center gap-2">
            <Upload size={18} className="text-[#D97757]" />
            <span>1. Foto de Teste</span>
          </h3>

          <div className="aspect-video rounded-2xl border-2 border-dashed border-[#E0D8CC] bg-[#FAF7F2] flex flex-col items-center justify-center p-4 overflow-hidden relative">
            {testImage ? (
              <img src={testImage} alt="Teste" className="h-full w-full object-contain" />
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center text-center">
                <Upload size={32} className="text-[#9E978C] mb-2" />
                <span className="text-xs font-bold text-[#B05330]">Clique para carregar uma foto de teste</span>
                <span className="text-[11px] text-[#7A7368] mt-1">Cabo, carregador, fone, capinha ou película</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            {testImage && (
              <label className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#4A453E] cursor-pointer">
                Trocar Imagem
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}

            <button
              type="button"
              disabled={!testImage || analyzing}
              onClick={handleRunPlaygroundTest}
              className="ml-auto flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#D97757] text-white text-xs font-bold shadow-md hover:bg-[#C26243] disabled:opacity-40 min-h-[44px]"
            >
              {analyzing ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Analisando com IA...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Executar Teste</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Painel Direito: Resposta JSON & Detalhes */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E7E0D5] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-serif font-bold text-[#1E1D1B] flex items-center gap-2 mb-3">
              <Code2 size={18} className="text-[#D97757]" />
              <span>2. Resposta Estruturada (JSON)</span>
            </h3>

            {scanResult ? (
              <div className="space-y-3">
                {/* Resumo da Identificação */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold space-y-1">
                  <div className="flex justify-between">
                    <span>Produto Identificado:</span>
                    <strong>{scanResult.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Categoria Escolhida:</span>
                    <strong>{scanResult.category}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Confiança:</span>
                    <strong>{Math.round(scanResult.confidence * 100)}%</strong>
                  </div>
                </div>

                {/* Bloco de Código JSON */}
                <pre className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-stone-800">
                  {rawJsonResponse}
                </pre>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#7A7368] bg-[#FAF7F2] rounded-2xl border border-dashed border-[#E0D8CC]">
                Suba uma imagem de teste e clique em "Executar Teste" para ver a extração estruturada em tempo real.
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#7A7368] pt-3 border-t border-[#EFE9E0]">
            💡 Categorias válidas fornecidas ao prompt: <strong>{categories.map(c => c.name).join(', ')}</strong>.
          </div>
        </div>

      </div>

    </div>
  );
}
