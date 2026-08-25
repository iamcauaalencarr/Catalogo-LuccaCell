import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Camera, X, CheckCircle2, AlertCircle, RefreshCw, Zap, AlertTriangle, Eye, ShieldAlert, Cpu } from 'lucide-react';
import { analyzeProductImage, ScannedProductData, getSelectedOpenRouterModel, getModelDisplayName } from '@/services/openrouter';

interface AIVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyAIData: (data: ScannedProductData) => void;
}

export function AIVisionModal({ isOpen, onClose, onApplyAIData }: AIVisionModalProps) {
  const [activeModel, setActiveModel] = useState<string>(() => getSelectedOpenRouterModel());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedProductData | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveModel(getSelectedOpenRouterModel());
    }
    const handleModelChange = (e: any) => {
      setActiveModel(e.detail || getSelectedOpenRouterModel());
    };
    window.addEventListener('lc_ai_model_changed', handleModelChange);
    return () => window.removeEventListener('lc_ai_model_changed', handleModelChange);
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).');
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      setError('A imagem é muito pesada (máximo 10MB). Por favor, selecione uma foto menor.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setError(null);
      setScannedResult(null);
      startAIScan(base64);
    };
    reader.readAsDataURL(file);
  };

  const startAIScan = async (base64Image: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeProductImage(base64Image);
      setScannedResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao analisar a foto. Verifique a imagem e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setScannedResult(null);
    setError(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  const handleConfirmAndApply = () => {
    if (scannedResult) {
      onApplyAIData({
        ...scannedResult,
        image: selectedImage || scannedResult.image
      });
      handleModalClose();
    }
  };

  // Helpers de UI
  const confidencePercent = scannedResult ? Math.round(scannedResult.confidence * 100) : 85;
  const isLowConfidence = scannedResult ? scannedResult.confidence < 0.50 : false;
  const canApply = Boolean(scannedResult);

  const confidenceColor = confidencePercent >= 80
    ? '#22c55e'
    : confidencePercent >= 70
      ? '#f4b52e'
      : '#ef4444';

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-[#171411]/80 backdrop-blur-md transition-opacity"
        onClick={handleModalClose}
      />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="relative w-full max-w-lg overflow-hidden rounded-t-[24px] sm:rounded-[24px] border border-[#4b3927] bg-[#211b17] text-[#fff7e6] shadow-[0_25px_60px_rgba(0,0,0,0.6)] animate-rise max-h-[92vh] sm:max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Gold Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#d97621] via-[#f4b52e] to-[#e99c28]" />

          {/* Mobile Drag Indicator */}
          <div className="sm:hidden pt-2 flex justify-center">
            <div className="w-12 h-1 rounded-full bg-[#45382c]" />
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleModalClose}
            className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-[#45382c] text-[#bcae98] hover:bg-[#2b241e] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="p-6 sm:p-7 flex-1 overflow-y-auto">
            
            {/* Header Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#67502d] bg-[#2b231c] text-[#f4b52e]">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#d7ad55]">
                    IA Multimodal
                  </span>
                  <span className="rounded-full bg-[#171411] border border-[#67502d] px-2 py-0.5 text-[10px] font-bold text-[#f4b52e] flex items-center gap-1.5 shadow-2xs" title={activeModel}>
                    <Cpu size={11} className="text-[#d7ad55]" /> {getModelDisplayName(activeModel)}
                  </span>
                </div>
                <h2 className="display text-[22px] font-semibold leading-tight text-[#fff4dc]">
                  Cadastrar Produto por Foto
                </h2>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            {/* Step 1: Upload Dropzone if no image is selected */}
            {!selectedImage && (
              <div className="space-y-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#67502d] bg-[#171411]/60 p-6 text-center cursor-pointer hover:border-[#f4b52e] hover:bg-[#2b231c]/50 transition-all group"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#2b231c] text-[#f4b52e] group-hover:scale-110 transition-transform">
                    <Camera size={26} />
                  </div>
                  <strong className="text-sm text-[#fff4dc]">Tire uma foto ou selecione uma imagem</strong>
                  <p className="mt-1 text-xs text-[#8d7e6d]">
                    Suporta imagens de acessórios, capinhas, cabos e fones (PNG, JPG)
                  </p>
                  <button 
                    type="button"
                    className="mt-4 flex items-center gap-2 rounded-full bg-[#f4b52e] px-5 py-2 text-xs font-extrabold text-[#261c14] shadow-sm"
                  >
                    <Upload size={14} /> Selecionar Foto
                  </button>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                />
              </div>
            )}

            {/* Step 2: Image Preview with AI Scanning Effect */}
            {selectedImage && (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-[#4b3927] bg-[#171411] flex items-center justify-center min-h-[220px] max-h-[300px]">
                  <img 
                    src={selectedImage} 
                    alt="Produto para escaneamento" 
                    className="max-h-[280px] w-full object-contain p-2"
                  />

                  {/* Laser Scanning line animation when analyzing */}
                  {loading && <div className="ai-scan-line" />}

                  {/* Overlay text when loading */}
                  {loading && (
                    <div className="absolute inset-0 bg-[#171411]/70 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
                      <RefreshCw size={32} className="animate-spin text-[#f4b52e] mb-3" />
                      <strong className="text-sm text-[#fff4dc]">Analisando com IA da Lucca Cell...</strong>
                      <p className="text-xs text-[#bcae98] mt-1">Lendo textos, etiquetas e identificando o produto</p>
                    </div>
                  )}
                </div>

                {/* Scanned Result */}
                {scannedResult && !loading && (
                  <div className="rounded-2xl border border-[#67502d] bg-[#2b231c] p-4 space-y-3 animate-rise">
                    
                    {/* Header: Identificação + Confiança */}
                    <div className="flex items-center justify-between border-b border-[#45382c] pb-2">
                      <span className={`flex items-center gap-1.5 text-xs font-extrabold ${scannedResult.productIdentified ? 'text-[#f4b52e]' : 'text-red-400'}`}>
                        {scannedResult.productIdentified ? (
                          <><CheckCircle2 size={16} /> Produto Reconhecido</>
                        ) : (
                          <><ShieldAlert size={16} /> Produto não identificado</>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {scannedResult.category && (
                          <span className="rounded-full bg-[#f4b52e] text-[#211b17] px-2.5 py-0.5 text-[10px] font-bold uppercase">
                            {scannedResult.category}
                          </span>
                        )}
                        {/* Confiança */}
                        <span
                          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: confidenceColor + '22', color: confidenceColor, border: `1px solid ${confidenceColor}44` }}
                        >
                          {confidencePercent}%
                        </span>
                      </div>
                    </div>

                    {/* Nome e Descrição */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-base text-[#fff4dc] font-['Outfit']">
                        {scannedResult.name ?? 'Produto não identificado'}
                      </h4>
                      {scannedResult.description && (
                        <p className="text-xs text-[#bcae98]">
                          {scannedResult.description}
                        </p>
                      )}
                    </div>

                    {/* Preço */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div>
                        {scannedResult.price !== null ? (
                          <>
                            <span className="text-[#8d7e6d]">Preço lido: </span>
                            <strong className="text-[#f4b52e] font-extrabold text-sm">
                              R$ {scannedResult.price.toFixed(2)}
                            </strong>
                          </>
                        ) : (
                          <span className="text-[#8d7e6d] italic">Preço não identificado na imagem</span>
                        )}
                      </div>
                      {scannedResult.tag && (
                        <span className="rounded-full bg-[#f5e1a9] px-2 py-0.5 text-[10px] font-bold text-[#74501b]">
                          {scannedResult.tag}
                        </span>
                      )}
                    </div>

                    {/* Evidência Visual */}
                    {(scannedResult.evidenciaNome || scannedResult.evidenciaMarca || scannedResult.infoObservadas.length > 0) && (
                      <div className="border-t border-[#45382c] pt-2 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8d7e6d] uppercase tracking-wider mb-1.5">
                          <Eye size={12} /> Evidência Visual (textos lidos)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {scannedResult.infoObservadas.map((info, i) => (
                            <span key={i} className="rounded-md bg-[#171411] border border-[#45382c] px-2 py-0.5 text-[10px] text-[#bcae98] font-mono">
                              {info}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modelo Real Utilizado (Comprovação) */}
                    {scannedResult.modelUsed && (
                      <div className="border-t border-[#45382c] pt-2 mt-1 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#8d7e6d] flex items-center gap-1">
                            <Cpu size={12} className="text-[#f4b52e]" /> Modelo que processou:
                          </span>
                          <code className={`rounded bg-[#171411] border px-2 py-0.5 text-[10px] font-mono flex items-center gap-1 ${
                            scannedResult.isFallback 
                              ? 'border-amber-500/40 text-amber-300' 
                              : 'border-[#22c55e]/40 text-[#4ade80]'
                          }`}>
                            <CheckCircle2 size={10} /> {scannedResult.modelUsed}
                          </code>
                        </div>

                        {scannedResult.isFallback && (
                          <div className="rounded-lg bg-amber-950/40 border border-amber-500/30 p-2 text-[10px] text-amber-200/90 flex items-center gap-1.5">
                            <Sparkles size={13} className="text-amber-400 shrink-0" />
                            <span>
                              <strong>Contingência Automática:</strong> A IA principal ({getModelDisplayName(scannedResult.primaryFailedModel || '')}) oscilou e o sistema usou a IA reserva para não interromper seu cadastro.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Alertas */}
                    {scannedResult.alertas.length > 0 && (
                      <div className="border-t border-[#45382c] pt-2 mt-1 space-y-1">
                        {scannedResult.alertas.map((alerta, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-400/80">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            {alerta}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Aviso de baixa confiança */}
                    {isLowConfidence && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        <div>
                          <strong>Confiança insuficiente ({confidencePercent}%).</strong>{' '}
                          O produto não foi identificado com segurança. Tire uma foto mais nítida ou preencha manualmente.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="border-t border-[#3e3226] bg-[#1a1512] px-6 py-4 flex items-center justify-between">
            {selectedImage ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs font-bold text-[#bcae98] hover:text-white disabled:opacity-50"
              >
                <RefreshCw size={14} /> Trocar Foto
              </button>
            ) : (
              <span className="text-[11px] text-[#8d7e6d]">IA Vision v3.0 · OpenRouter</span>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleModalClose}
                className="rounded-full border border-[#69543c] px-4 py-2 text-xs font-bold text-[#e8d9bf] hover:border-[#eab23d]"
              >
                Cancelar
              </button>

              {scannedResult && (
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  disabled={!canApply}
                  className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-extrabold shadow-md transition-all ${
                    canApply
                      ? 'bg-[#f4b52e] text-[#261c14] hover:bg-[#ffce57]'
                      : 'bg-[#3e3226] text-[#8d7e6d] cursor-not-allowed'
                  }`}
                >
                  <Zap size={14} /> {canApply ? 'Usar no Cadastro' : 'Confiança insuficiente'}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
