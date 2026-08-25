import { Product } from '@/types/admin';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export type ScannedProductData = {
  name: string | null;
  category: string | null;
  price: number | null;
  oldPrice?: number | null;
  installment: string | null;
  tag: string | null;
  description: string | null;
  visual: Product['visual'] | null;
  tone: string | null;
  image?: string;
  confidence: number;
  productIdentified: boolean;
  evidenciaNome: string | null;
  evidenciaMarca: string | null;
  infoObservadas: string[];
  alertas: string[];
  modelUsed?: string;
};

// ─────────────────────────────────────────────────────────────
// COMPRESSÃO DE IMAGEM — 1280px para leitura visual de alta qualidade
// ─────────────────────────────────────────────────────────────

export async function compressImageForAI(base64Str: string, maxDim = 1280): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    img.onerror = () => resolve(base64Str);
  });
}

// ==========================================================
// LISTA FECHADA DE CATEGORIAS
// Use isso também no seu código pra validar a resposta da IA
// ==========================================================
export const CATEGORIAS_VALIDAS = [
  "Cartões de Memória & Armazenamento",
  "Cabos e Carregadores",
  "Suportes",
  "Iluminação & Vídeo",
  "Smartwatches e Pulseiras",
  "Áudio",
  "Proteção",
  "Power Banks & Baterias",
  "Capinhas",
  "Outros",
] as const;

export type ValidCategory = typeof CATEGORIAS_VALIDAS[number];

// ==========================================================
// VALIDAÇÃO EXTRA NO CÓDIGO (defesa em profundidade)
// Mesmo com o prompt corrigido, IAs generativas nunca são
// 100% determinísticas. Sempre valide a categoria recebida
// antes de salvar no banco/catálogo.
// ==========================================================
export function validarRespostaIA(respostaJson: Record<string, any>): Record<string, any> {
  const cat = respostaJson.categoria ?? respostaJson.category;
  if (!CATEGORIAS_VALIDAS.includes(cat as ValidCategory)) {
    // Tenta encontrar correspondência case-insensitive ou aproximada
    const matched = CATEGORIAS_VALIDAS.find(
      c => c.toLowerCase() === String(cat || '').toLowerCase().trim()
    );

    if (matched) {
      respostaJson.categoria = matched;
    } else {
      console.warn(
        `[IA] Categoria inválida recebida: "${cat}" -> substituindo por "Outros"`
      );
      respostaJson.categoria = "Outros";
    }
  }
  return respostaJson;
}

export const VISION_PROMPT = `Você é um especialista em análise visual de produtos para e-commerce e catálogo de celulares e acessórios da Lucca Cell.

Sua tarefa tem DUAS etapas obrigatórias:
ETAPA 1 - IDENTIFICAÇÃO: analise a foto e identifique com precisão o produto (marca, modelo, especificações visíveis).
ETAPA 2 - CATEGORIZAÇÃO: escolha a categoria SOMENTE entre as 10 opções da lista fechada abaixo. Você NÃO PODE criar, inventar, traduzir ou adaptar nomes de categoria. Se o produto não se encaixar claramente em nenhuma regra, use "Outros".

LISTA FECHADA DE CATEGORIAS (use o texto EXATAMENTE como está escrito, incluindo acentos e símbolos):

1. "Cartões de Memória & Armazenamento" — Cartão MicroSD, Pendrive, Cartão de Memória, Adaptador SD, Leitor de cartão
2. "Cabos e Carregadores" — Cabo USB, Cabo Type-C, Cabo Lightning, Carregador de parede, Fonte, Plugue, Carregador veicular sem suporte
3. "Suportes" — Suporte veicular, Suporte de mesa, Tripé, Garra, Suporte articulado (função principal é SEGURAR o celular/câmera)
4. "Iluminação & Vídeo" — Painel de LED, Ring Light, Luz RGB, Iluminação para vídeo/selfie
5. "Smartwatches e Pulseiras" — Pulseira, Smartwatch, Relógio Inteligente, Pulseira/band avulsa de smartwatch
6. "Áudio" — Fone de ouvido, Headphone, Headset, Caixa de Som, TWS, Microfone
7. "Proteção" — Película de vidro, Película 3D/Privacidade, Protetor de lente/câmera (cobre uma superfície PLANA — NUNCA capinhas)
8. "Power Banks & Baterias" — Bateria portátil, Power Bank, Bateria externa
9. "Capinhas" — Capinha, Case, Bumper de proteção (envolve o CORPO do aparelho — NUNCA películas, NUNCA suportes)
10. "Outros" — use APENAS se o produto não se encaixar claramente em nenhuma categoria acima

REGRAS DE DESEMPATE (quando o produto parecer se encaixar em mais de uma categoria):
- Baseie-se na FUNÇÃO PRINCIPAL visível na imagem, não em características secundárias do produto nem em palavras soltas do nome comercial.
  Ex: suporte veicular com entrada USB para carregar -> "Suportes" (segurar é a função principal; carregar é um extra).
- Película e Capinha nunca se misturam: película cobre a tela (plana), capinha envolve o aparelho (case/corpo).
- Se o nome comercial contém uma palavra de outra categoria mas a função visível na foto é diferente, priorize sempre o que está sendo mostrado na imagem.

ANTES DE RESPONDER, faça esta verificação interna (não escreva isso na resposta):
1) O texto que vou colocar em "categoria" é IDÊNTICO, caractere por caractere, a um dos 10 itens da lista fechada acima?
2) Se não for, corrijo para a categoria certa da lista ou para "Outros".

Responda ESTRITAMENTE em formato JSON (sem bloco markdown, sem comentários, sem texto fora do JSON):
{
  "produto_identificado": true,
  "nome": "Nome comercial exato do item (ex: Cartão de Memória SanDisk Ultra MicroSD 16GB, Cabo Type-C para Type-C 65W 1m)",
  "categoria": "Uma das 10 categorias EXATAS da lista fechada acima",
  "preco": null,
  "tag": "Novo",
  "descricao": "Descrição fiel e clara do objeto visível na foto, detalhando características, capacidade (GB), potência (W), compatibilidade e acabamento.",
  "evidencia_nome": "Nome ou tipo de produto observado na imagem",
  "informacoes_observadas": ["item ou característica 1 observada", "item 2"],
  "confianca": 0.95
}`;

// ─────────────────────────────────────────────────────────────
// MAPEAMENTOS DE CATEGORIA → VISUAL / TONE
// ─────────────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, string> = {
  'cartões de memória & armazenamento': 'Cartões de Memória & Armazenamento',
  'cartao de memoria': 'Cartões de Memória & Armazenamento',
  'cabos e carregadores': 'Cabos e Carregadores',
  'cabos': 'Cabos e Carregadores',
  'carregadores': 'Cabos e Carregadores',
  'suportes': 'Suportes',
  'suporte': 'Suportes',
  'iluminação & vídeo': 'Iluminação & Vídeo',
  'iluminacao & video': 'Iluminação & Vídeo',
  'smartwatches e pulseiras': 'Smartwatches e Pulseiras',
  'áudio': 'Áudio',
  'audio': 'Áudio',
  'proteção': 'Proteção',
  'protecao': 'Proteção',
  'power banks & baterias': 'Power Banks & Baterias',
  'capinhas': 'Capinhas',
  'capa': 'Capinhas',
  'outros': 'Outros',
};

const VISUAL_MAP: Record<string, Product['visual']> = {
  'Cartões de Memória & Armazenamento': 'laptop',
  'Cabos e Carregadores': 'cable',
  'Suportes': 'phone',
  'Iluminação & Vídeo': 'repair',
  'Smartwatches e Pulseiras': 'tablet',
  'Áudio': 'audio',
  'Proteção': 'shield',
  'Power Banks & Baterias': 'battery',
  'Capinhas': 'phone',
  'Outros': 'phone',
};

const TONE_MAP: Record<string, string> = {
  'Cartões de Memória & Armazenamento': 'linear-gradient(140deg,#1c2331,#2f3b52)',
  'Cabos e Carregadores': 'linear-gradient(145deg,#e9d6a5,#fbf5df)',
  'Suportes': 'linear-gradient(135deg,#373b44,#4286f4)',
  'Iluminação & Vídeo': 'linear-gradient(135deg,#654ea3,#eaafc8)',
  'Smartwatches e Pulseiras': 'linear-gradient(135deg,#182848,#4b6cb7)',
  'Áudio': 'linear-gradient(140deg,#20201e,#5d5b55)',
  'Proteção': 'linear-gradient(140deg,#23312c,#4a6b5e)',
  'Power Banks & Baterias': 'linear-gradient(135deg,#134e5e,#71b280)',
  'Capinhas': 'linear-gradient(135deg,#29251f,#bd7824)',
  'Outros': 'linear-gradient(135deg,#2c3e50,#3498db)',
};

// ─────────────────────────────────────────────────────────────
// VALIDAÇÃO E HIGIENIZAÇÃO DE DADOS DA IA
// ─────────────────────────────────────────────────────────────

function validateAndSanitize(rawParsed: Record<string, any>, imageBase64: string, modelUsed?: string): ScannedProductData {
  const parsed = validarRespostaIA({ ...rawParsed });

  const rawName = parsed.nome ?? parsed.name ?? parsed.product_name;
  const name = (typeof rawName === 'string' && rawName.trim() && !rawName.includes('Responda apenas')) 
    ? rawName.trim() 
    : null;

  const rawMarca = parsed.marca ?? parsed.brand;
  const marca = (typeof rawMarca === 'string' && rawMarca.trim()) ? rawMarca.trim() : null;

  const rawDesc = parsed.descricao ?? parsed.description;
  const description = (typeof rawDesc === 'string' && rawDesc.trim()) ? rawDesc.trim() : null;

  const rawPrice = parsed.preco ?? parsed.price;
  const price = (rawPrice !== null && rawPrice !== undefined && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0)
    ? Number(rawPrice) : null;

  const rawOldPrice = parsed.preco_antigo ?? parsed.oldPrice;
  const oldPrice = (rawOldPrice !== null && rawOldPrice !== undefined && !isNaN(Number(rawOldPrice)) && Number(rawOldPrice) > 0)
    ? Number(rawOldPrice) : null;

  const resolvedCategory = (parsed.categoria as string) || 'Outros';
  const visual = (VISUAL_MAP[resolvedCategory] ?? 'phone') as Product['visual'];
  const tone = TONE_MAP[resolvedCategory] ?? 'linear-gradient(135deg,#29251f,#bd7824)';
  const installment = price ? `3x de R$ ${(price / 3).toFixed(2)}` : null;

  const validTags = ['Novo', 'Oferta', 'Mais pedido', 'Lucca recomenda'];
  const rawTag = parsed.tag;
  const tag = (typeof rawTag === 'string' && validTags.includes(rawTag.trim())) ? rawTag.trim() : 'Novo';

  const evidenciaNome = (typeof parsed.evidencia_nome === 'string' && parsed.evidencia_nome.trim())
    ? parsed.evidencia_nome.trim() : (name || 'Identificação por IA');

  const infoObservadas: string[] = Array.isArray(parsed.informacoes_observadas)
    ? parsed.informacoes_observadas.filter((i: any) => typeof i === 'string' && i.trim()).map((i: string) => i.trim())
    : ['Produto identificado por modelo de visão OpenRouter'];

  let confidence = Number(parsed.confianca ?? parsed.confidence ?? 0.90);
  if (isNaN(confidence) || confidence <= 0) confidence = 0.90;
  if (confidence > 1) confidence = 1;

  const finalName = name || `${resolvedCategory} Lucca Cell`;
  const actualModel = modelUsed || parsed._modelUsed || 'openrouter/free';

  return {
    name: finalName,
    category: resolvedCategory,
    price,
    oldPrice,
    installment,
    tag,
    description: description || `${finalName} de alta qualidade para o seu dispositivo.`,
    visual,
    tone,
    image: imageBase64,
    confidence,
    productIdentified: true,
    evidenciaNome,
    evidenciaMarca: marca,
    infoObservadas,
    alertas: [],
    modelUsed: actualModel,
  };
}

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DO OPENROUTER & MODELO SELECIONADO
// ─────────────────────────────────────────────────────────────

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';

export const KNOWN_AI_MODELS: Record<string, { name: string; provider: string; isFree: boolean }> = {
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free': {
    name: 'NVIDIA Nemotron 3 Nano Omni',
    provider: 'NVIDIA',
    isFree: true,
  },
  'openrouter/free': {
    name: 'OpenRouter Auto (Multimodal)',
    provider: 'OpenRouter',
    isFree: true,
  },
  'nvidia/nemotron-3.5-lightning:free': {
    name: 'NVIDIA Nemotron 3.5 Lightning',
    provider: 'NVIDIA',
    isFree: true,
  },
  'anthropic/claude-3-5-haiku': {
    name: 'Anthropic Claude 3.5 Haiku',
    provider: 'Anthropic',
    isFree: false,
  },
  'google/gemini-2.5-flash': {
    name: 'Google Gemini 2.5 Flash',
    provider: 'Google',
    isFree: false,
  },
  'openai/gpt-4o-mini': {
    name: 'OpenAI GPT-4o Mini',
    provider: 'OpenAI',
    isFree: false,
  },
};

export function getModelDisplayName(modelId: string): string {
  if (!modelId) return 'NVIDIA Nemotron 3 Nano (Grátis)';
  const cleanId = modelId.trim();
  if (KNOWN_AI_MODELS[cleanId]) {
    const info = KNOWN_AI_MODELS[cleanId];
    return `${info.name} ${info.isFree ? '(Grátis)' : ''}`.trim();
  }
  if (cleanId.toLowerCase().includes('claude')) return 'Anthropic Claude 3.5 Haiku';
  if (cleanId.toLowerCase().includes('nemotron')) return 'NVIDIA Nemotron Vision (Grátis)';
  if (cleanId.toLowerCase().includes('gemini')) return 'Google Gemini Flash Vision';
  if (cleanId.toLowerCase().includes('gpt-4o')) return 'OpenAI GPT-4o';
  
  // Extrai nome limpo se for no formato 'provider/model-name:free'
  const parts = cleanId.split('/');
  const namePart = parts[parts.length - 1].replace(/:free/gi, '');
  return namePart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function getSelectedOpenRouterModel(): string {
  const localModel = typeof window !== 'undefined' ? localStorage.getItem('OPENROUTER_SELECTED_MODEL') : '';
  if (localModel?.trim()) return localModel.trim();
  try {
    const rawSettings = typeof window !== 'undefined' 
      ? (localStorage.getItem('lucca_cell_admin_settings') || localStorage.getItem('LC_STORE_SETTINGS')) 
      : null;
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed?.aiConfig?.defaultModel?.trim() && !parsed.aiConfig.defaultModel.includes('gemini-2.0-flash-001')) {
        return parsed.aiConfig.defaultModel.trim();
      }
    }
  } catch {}
  return 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
}

export function setSelectedOpenRouterModel(modelId: string) {
  if (typeof window !== 'undefined') {
    const cleanId = modelId.trim() || 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
    localStorage.setItem('OPENROUTER_SELECTED_MODEL', cleanId);
    try {
      const rawSettings = localStorage.getItem('lucca_cell_admin_settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        if (parsed.aiConfig) {
          parsed.aiConfig.defaultModel = cleanId;
          localStorage.setItem('lucca_cell_admin_settings', JSON.stringify(parsed));
        }
      }
    } catch {}
    
    // Dispara evento global para que qualquer componente atualize em tempo real
    window.dispatchEvent(new CustomEvent('lc_ai_model_changed', { detail: cleanId }));
  }
}

function getAiSettings() {
  let temperature = 0.2;
  let customInstructions = '';
  try {
    const rawSettings = typeof window !== 'undefined' 
      ? (localStorage.getItem('lucca_cell_admin_settings') || localStorage.getItem('LC_STORE_SETTINGS')) 
      : null;
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (typeof parsed?.aiConfig?.temperature === 'number') {
        temperature = parsed.aiConfig.temperature;
      }
      if (parsed?.aiConfig?.customPromptInstructions?.trim()) {
        customInstructions = parsed.aiConfig.customPromptInstructions.trim();
      }
    }
  } catch {}
  return { temperature, customInstructions };
}

export interface OpenRouterModelItem {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string | number;
    completion?: string | number;
    image?: string | number;
  };
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

export async function fetchOpenRouterModels(): Promise<OpenRouterModelItem[]> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) return [];
    const data = await response.json();
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    return [];
  } catch (err) {
    console.warn('[OpenRouter] Falha ao carregar modelos:', err);
    return [];
  }
}

async function callOpenRouterDirect(imageBase64: string): Promise<Record<string, any>> {
  const selectedModel = getSelectedOpenRouterModel();
  const { temperature, customInstructions } = getAiSettings();

  const formattedImage = imageBase64.startsWith('data:') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;

  const effectivePrompt = customInstructions
    ? `${VISION_PROMPT}\n\n[INSTRUÇÕES ADICIONAIS DA LOJA]:\n${customInstructions}`
    : VISION_PROMPT;

  console.log(`[OpenRouter Direct] Executando modelo: ${selectedModel} (temp: ${temperature})`);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    'X-Title': 'Lucca Cell Catalogo',
  };

  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: effectivePrompt },
              { type: 'image_url', image_url: { url: formattedImage } },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: temperature,
      }),
    });
  } catch (netErr: any) {
    throw new Error(`Falha de conexão com o serviço de IA OpenRouter: ${netErr?.message || 'Sem internet ou bloqueio de rede'}`);
  }

  // Lê o corpo da resposta apenas uma vez para evitar erro "body stream already read"
  const rawResponseText = await response.text();

  if (response.ok) {
    let data: any = null;
    try {
      data = JSON.parse(rawResponseText);
    } catch {
      // Ignora erro de parse caso venha texto puro
    }

    const actualModelReturned = data?.model || selectedModel;
    let rawContent = data?.choices?.[0]?.message?.content;
    
    if (rawContent && typeof rawContent === 'string') {
      console.log(
        `%c[OpenRouter] ✅ Modelo ${actualModelReturned} respondeu com sucesso!`,
        'color: #22c55e; font-weight: bold; font-size: 13px;'
      );
      
      // Limpeza de marcações markdown
      const cleaned = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      let parsedJson: Record<string, any> | null = null;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedJson = JSON.parse(jsonMatch[0]);
          } catch {}
        }
      }

      if (parsedJson && typeof parsedJson === 'object') {
        parsedJson._modelUsed = actualModelReturned;
        return parsedJson;
      }
    }

    throw new Error(`A IA analisou a imagem, mas não gerou o formato de dados esperado. Resposta: "${rawContent || rawResponseText.slice(0, 120)}"`);
  }

  if (response.status === 402 || response.status === 404) {
    if (selectedModel !== 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free') {
      console.warn(`[OpenRouter] Modelo ${selectedModel} retornou ${response.status}. Alternando automaticamente para NVIDIA Nemotron Free Vision...`);
      setSelectedOpenRouterModel('nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free');
      return callOpenRouterDirect(imageBase64);
    }
    throw new Error(`O modelo "${selectedModel}" é pago ou indisponível (${response.status}). Escolha um modelo gratuito com ":free" no Painel.`);
  } else if (response.status === 401) {
    throw new Error('Chave de API OpenRouter inválida ou não autorizada (401 Unauthorized).');
  } else if (response.status === 429) {
    throw new Error(`Limite temporário de requisições excedido para o modelo "${selectedModel}" (429 Rate Limit). Aguarde alguns instantes.`);
  } else {
    let errMsg = rawResponseText;
    try {
      const parsedErr = JSON.parse(rawResponseText);
      errMsg = parsedErr?.error?.message || rawResponseText;
    } catch {}
    throw new Error(`Erro na análise (${response.status}): ${errMsg}`);
  }
}

async function callClaudeDirect(imageBase64: string): Promise<Record<string, any>> {
  const { customInstructions } = getAiSettings();
  const effectivePrompt = customInstructions
    ? `${VISION_PROMPT}\n\n[INSTRUÇÕES ADICIONAIS DA LOJA]:\n${customInstructions}`
    : VISION_PROMPT;

  const mimeType = imageBase64.startsWith('data:image/png')
    ? 'image/png'
    : imageBase64.startsWith('data:image/webp')
      ? 'image/webp'
      : 'image/jpeg';

  const cleanBase64 = imageBase64.includes('base64,')
    ? imageBase64.split('base64,')[1]
    : imageBase64;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: cleanBase64,
                },
              },
              {
                type: 'text',
                text: effectivePrompt,
              },
            ],
          },
        ],
      }),
    });

    const rawText = await response.text();
    if (response.ok) {
      const data = JSON.parse(rawText);
      const contentText = data?.content?.[0]?.text || '';
      const cleaned = contentText.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
      let parsedJson = null;
      try {
        parsedJson = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsedJson = JSON.parse(match[0]);
      }
      if (parsedJson && typeof parsedJson === 'object') {
        parsedJson._modelUsed = 'Anthropic Claude 3.5 Haiku';
        return parsedJson;
      }
    }
    console.warn('[Claude] API Claude retornou status ' + response.status + '. Alternando para NVIDIA Nemotron Free Vision...');
  } catch (err) {
    console.warn('[Claude] Falha na chamada Claude. Alternando para NVIDIA Nemotron Free Vision...', err);
  }

  // Fallback transparente para o NVIDIA Free
  return callOpenRouterDirect(imageBase64);
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — HÍBRIDA
// ─────────────────────────────────────────────────────────────

export async function analyzeProductImage(originalBase64: string): Promise<ScannedProductData> {
  const imageBase64 = await compressImageForAI(originalBase64, 1280);
  const selectedModel = getSelectedOpenRouterModel();

  let directResult: Record<string, any>;
  if (selectedModel.toLowerCase().includes('claude') || selectedModel.toLowerCase().includes('anthropic')) {
    directResult = await callClaudeDirect(imageBase64);
  } else {
    directResult = await callOpenRouterDirect(imageBase64);
  }

  const modelUsed = directResult._modelUsed || selectedModel;
  console.log(`[Lucca Cell Client] Análise de visão por IA realizada com o modelo: ${modelUsed}`);
  return validateAndSanitize(directResult, imageBase64, modelUsed);
}
