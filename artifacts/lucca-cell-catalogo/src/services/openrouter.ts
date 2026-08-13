import { Category, Product } from '@/components/AdminPanel';

// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────

export type ScannedProductData = {
  name: string | null;
  category: Exclude<Category, 'Todos'> | null;
  price: number | null;
  oldPrice?: number | null;
  installment: string | null;
  tag: string | null;
  description: string | null;
  visual: Product['visual'] | null;
  tone: string | null;
  image?: string;
  // Campos de confiança e evidência
  confidence: number;
  productIdentified: boolean;
  evidenciaNome: string | null;
  evidenciaMarca: string | null;
  infoObservadas: string[];
  alertas: string[];
};

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO — API KEY SOMENTE VIA VARIÁVEL DE AMBIENTE
// ─────────────────────────────────────────────────────────────

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

if (!OPENROUTER_API_KEY) {
  console.warn(
    '[Lucca Cell] VITE_OPENROUTER_API_KEY não definida. ' +
    'Crie um arquivo .env com VITE_OPENROUTER_API_KEY=sua_chave'
  );
}

// ─────────────────────────────────────────────────────────────
// MODELOS — Modelo Principal + Fallback Gratuito e Pago
// ─────────────────────────────────────────────────────────────

const VISION_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'google/gemini-2.5-flash',
  'openai/gpt-4o-mini',
];

// ─────────────────────────────────────────────────────────────
// COMPRESSÃO DE IMAGEM — 1280px para OCR de alta qualidade
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

// ─────────────────────────────────────────────────────────────
// PROMPT ANTI-ALUCINAÇÃO + RECONHECIMENTO VISUAL DE PRODUTOS
// ─────────────────────────────────────────────────────────────

const VISION_PROMPT = `Você é um sistema especializado em leitura visual e identificação de produtos comerciais de telefonia e acessórios.

Sua função é ANALISAR A IMAGEM FORNECIDA.

A imagem é a fonte primária de verdade.

INSTRUÇÕES DE IDENTIFICAÇÃO:
1. Se houver textos/etiquetas/embalagem visíveis, LEIA os textos exatamente como aparecem (OCR).
2. Se o produto for um OBJETO FÍSICO sem texto impresso (ex: uma capinha de celular, um cabo USB, uma fonte de carregador, um fone de ouvido, uma película de vidro), IDENTIFIQUE O PRODUTO PELA SUA APARÊNCIA FÍSICA e tipo de objeto.
3. Defina a categoria e dê um nome descritivo adequado ao produto comercial (ex: "Capinha de Silicone Transparente", "Cabo USB-C de Carregamento", "Fone de Ouvido Bluetooth TWS", "Fonte Carregador USB 20W", "Película de Vidro Temperado").

NUNCA invente informações técnicas não visíveis.
NUNCA estime preços se não houver etiqueta de preço na foto.

CATEGORIAS VÁLIDAS (use exatamente uma):
- "Capinhas" → capas, cases, capinhas de celular
- "Cabos e carregadores" → cabos, carregadores, fontes, tomadas, adaptadores
- "Áudio" → fones de ouvido, caixas de som, headsets, earbuds
- "Proteção" → películas, proteção de tela, vidros temperados
- "Assistência" → peças, baterias, conserto, ferramentas

CAMPOS DE EVIDÊNCIA:
- "evidencia_nome": texto exato lido na embalagem ou descrição visual do objeto
- "evidencia_marca": marca ou logotipo lido (ou null se não visível)

CONFIANÇA (0.0 a 1.0):
- 0.90-1.00 = produto claramente identificado (por texto ou por formato visual nítido)
- 0.70-0.89 = produto identificado com boa certeza visual
- 0.50-0.69 = dúvida parcial sobre o tipo de produto
- 0.00-0.49 = imagem muito borrada ou produto não identificável

Retorne EXCLUSIVAMENTE este JSON (sem texto promocional e sem blocos markdown):
{
  "produto_identificado": true,
  "nome": "Nome do produto lido ou identificado visualmente",
  "marca": "Marca lida ou null",
  "categoria": "Capinhas | Cabos e carregadores | Áudio | Proteção | Assistência",
  "subcategoria": null,
  "modelo": null,
  "cor": null,
  "capacidade": null,
  "potencia": null,
  "voltagem": null,
  "compatibilidade": null,
  "tipo_conexao": null,
  "codigo_barras": null,
  "preco": null,
  "preco_antigo": null,
  "tag": "Novo",
  "descricao": "Descrição curta do produto baseada no que foi observado.",
  "evidencia_nome": "Texto lido na embalagem ou formato visual observado",
  "evidencia_marca": null,
  "informacoes_observadas": ["formato do produto", "detalhes observados"],
  "nivel_identificacao": "alto",
  "confianca": 0.95,
  "alertas": []
}`;

// ─────────────────────────────────────────────────────────────
// MAPEAMENTOS DE CATEGORIA → VISUAL / TONE
// ─────────────────────────────────────────────────────────────

const VALID_CATEGORIES: Exclude<Category, 'Todos'>[] = [
  'Capinhas', 'Cabos e carregadores', 'Áudio', 'Proteção', 'Assistência'
];

const CATEGORY_MAP: Record<string, Exclude<Category, 'Todos'>> = {
  'capinhas': 'Capinhas',
  'carregadores': 'Cabos e carregadores',
  'cabos': 'Cabos e carregadores',
  'cabos e carregadores': 'Cabos e carregadores',
  'fones de ouvido': 'Áudio',
  'áudio': 'Áudio',
  'audio': 'Áudio',
  'proteção': 'Proteção',
  'películas': 'Proteção',
  'assistência': 'Assistência',
  'acessórios': 'Capinhas',
  'eletrônicos': 'Capinhas',
};

const VISUAL_MAP: Record<string, Product['visual']> = {
  'Áudio': 'audio',
  'Cabos e carregadores': 'cable',
  'Proteção': 'shield',
  'Assistência': 'repair',
  'Capinhas': 'phone',
};

const TONE_MAP: Record<string, string> = {
  'Áudio': 'linear-gradient(140deg,#20201e,#5d5b55)',
  'Cabos e carregadores': 'linear-gradient(145deg,#e9d6a5,#fbf5df)',
  'Proteção': 'linear-gradient(140deg,#23312c,#4a6b5e)',
  'Assistência': 'linear-gradient(135deg,#1e1e2e,#4a4a6a)',
  'Capinhas': 'linear-gradient(135deg,#29251f,#bd7824)',
};

// ─────────────────────────────────────────────────────────────
// VALIDAÇÃO LOCAL — Higienização e Confirmação de Dados
// ─────────────────────────────────────────────────────────────

function validateAndSanitize(parsed: Record<string, any>, imageBase64: string): ScannedProductData {
  // ── Nome ──
  const rawName = parsed.nome ?? parsed.name;
  const name = (typeof rawName === 'string' && rawName.trim()) ? rawName.trim() : null;

  // ── Marca ──
  const rawMarca = parsed.marca ?? parsed.brand;
  const marca = (typeof rawMarca === 'string' && rawMarca.trim()) ? rawMarca.trim() : null;

  // ── Descrição ──
  const rawDesc = parsed.descricao ?? parsed.description;
  const description = (typeof rawDesc === 'string' && rawDesc.trim()) ? rawDesc.trim() : null;

  // ── Preço (somente número positivo) ──
  const rawPrice = parsed.preco ?? parsed.price;
  const price = (rawPrice !== null && rawPrice !== undefined && !isNaN(Number(rawPrice)) && Number(rawPrice) > 0)
    ? Number(rawPrice) : null;

  // ── Preço antigo ──
  const rawOldPrice = parsed.preco_antigo ?? parsed.oldPrice;
  const oldPrice = (rawOldPrice !== null && rawOldPrice !== undefined && !isNaN(Number(rawOldPrice)) && Number(rawOldPrice) > 0)
    ? Number(rawOldPrice) : null;

  // ── Categoria ──
  const rawCat = (parsed.categoria ?? parsed.category ?? '').toString().trim();
  let category: Exclude<Category, 'Todos'> | null = null;

  if (VALID_CATEGORIES.includes(rawCat as any)) {
    category = rawCat as Exclude<Category, 'Todos'>;
  } else if (CATEGORY_MAP[rawCat.toLowerCase()]) {
    category = CATEGORY_MAP[rawCat.toLowerCase()];
  } else if (name) {
    const text = `${name} ${description ?? ''} ${marca ?? ''}`.toLowerCase();
    if (/fone|headphone|headset|earbud|airpod|tws|caixa de som|alto-falante|áudio|audio/.test(text)) category = 'Áudio';
    else if (/cabo|carregador|fonte|usb|type[-\s]?c|lightning|tomada|carregamento|charger/.test(text)) category = 'Cabos e carregadores';
    else if (/película|pelicula|vidro|shield|proteção|protecao|tela|blindada/.test(text)) category = 'Proteção';
    else if (/reparo|troca de tela|bateria|assistência|conserto/.test(text)) category = 'Assistência';
    else if (/capa|case|capinha|silicone|tpu|bumper/.test(text)) category = 'Capinhas';
  }

  // ── Visual e Tone ──
  const visual = category ? (VISUAL_MAP[category] ?? null) : null;
  const tone = category ? (TONE_MAP[category] ?? null) : null;

  // ── Installment ──
  const installment = price ? `3x de R$ ${(price / 3).toFixed(2)}` : null;

  // ── Tag ──
  const validTags = ['Novo', 'Oferta', 'Mais pedido', 'Lucca recomenda'];
  const rawTag = parsed.tag;
  const tag = (typeof rawTag === 'string' && validTags.includes(rawTag.trim())) ? rawTag.trim() : 'Novo';

  // ── Evidência visual ──
  const evidenciaNome = (typeof parsed.evidencia_nome === 'string' && parsed.evidencia_nome.trim())
    ? parsed.evidencia_nome.trim() : null;
  const evidenciaMarca = (typeof parsed.evidencia_marca === 'string' && parsed.evidencia_marca.trim())
    ? parsed.evidencia_marca.trim() : null;

  // ── Informações observadas ──
  const infoObservadas: string[] = Array.isArray(parsed.informacoes_observadas)
    ? parsed.informacoes_observadas.filter((i: any) => typeof i === 'string' && i.trim()).map((i: string) => i.trim())
    : [];

  // ── Alertas ──
  const alertas: string[] = Array.isArray(parsed.alertas)
    ? parsed.alertas.filter((a: any) => typeof a === 'string' && a.trim()).map((a: string) => a.trim())
    : [];

  // ── Confiança (0..1) ──
  let confidence = Number(parsed.confianca ?? parsed.confidence ?? 0);
  if (isNaN(confidence) || confidence <= 0) {
    confidence = name ? 0.85 : 0;
  }
  if (confidence > 1) confidence = 1;

  // ── REGRA DE IDENTIFICAÇÃO DE PRODUTO ──
  // Se o nome foi identificado (seja por texto ou por reconhecimento visual), considera produto identificado!
  const productIdentified = (parsed.produto_identificado !== false) && (name !== null || category !== null) && confidence >= 0.50;

  return {
    name: name || (category ? `${category} Lucca Cell` : 'Produto Identificado'),
    category: category || 'Capinhas',
    price,
    oldPrice,
    installment,
    tag,
    description: description || `Produto da categoria ${category || 'acessórios'} identificado por IA.`,
    visual,
    tone,
    image: imageBase64,
    confidence,
    productIdentified,
    evidenciaNome: evidenciaNome || 'Identificação visual de formato do produto',
    evidenciaMarca,
    infoObservadas: infoObservadas.length > 0 ? infoObservadas : ['Produto identificado por modelo de visão'],
    alertas,
  };
}

// ─────────────────────────────────────────────────────────────
// CHAMADA AO MODELO — Execução com tratamento de erros
// ─────────────────────────────────────────────────────────────

async function callVisionModel(model: string, imageBase64: string, timeoutMs = 25000): Promise<ScannedProductData> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('API key não configurada. Defina VITE_OPENROUTER_API_KEY no arquivo .env');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: Record<string, any> = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    };

    // Apenas adicionar response_format se não for modelo free com restrição
    if (!model.includes(':free')) {
      payload.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'Lucca Cell Catálogo',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`[${model}] HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error(`[${model}] Resposta vazia do modelo.`);
    }

    // Remover delimitadores de código markdown (```json ... ```) se existirem
    rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

    // Parsear JSON
    let parsed: Record<string, any>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`[${model}] Resposta não contém JSON válido.`);
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    return validateAndSanitize(parsed, imageBase64);
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — Iterar sobre modelos até obter sucesso
// ─────────────────────────────────────────────────────────────

export async function analyzeProductImage(originalBase64: string): Promise<ScannedProductData> {
  const imageBase64 = await compressImageForAI(originalBase64, 1280);

  const errors: string[] = [];

  for (const model of VISION_MODELS) {
    try {
      console.log(`[Lucca Cell IA] Consultando modelo de visão: ${model}`);
      const result = await callVisionModel(model, imageBase64, 25000);
      if (result && result.productIdentified) {
        console.log(`[Lucca Cell IA] Sucesso com o modelo: ${model}`);
        return result;
      }
    } catch (err: any) {
      console.warn(`[Lucca Cell IA] Falha no modelo ${model}:`, err?.message || err);
      errors.push(`${model}: ${err?.message || err}`);
    }
  }

  // Se nenhum modelo conseguiu identificar com sucesso, tenta uma última chamada com gemma-4-26b-a4b-it:free sem travar
  try {
    return await callVisionModel('google/gemma-4-26b-a4b-it:free', imageBase64, 25000);
  } catch (e) {
    // Fallback final seguro
  }

  return {
    name: null,
    category: null,
    price: null,
    oldPrice: null,
    installment: null,
    tag: null,
    description: null,
    visual: null,
    tone: null,
    image: imageBase64,
    confidence: 0,
    productIdentified: false,
    evidenciaNome: null,
    evidenciaMarca: null,
    infoObservadas: [],
    alertas: ['Não foi possível identificar o produto na imagem. Tente tirar uma foto mais aproximada e iluminada.'],
  };
}

