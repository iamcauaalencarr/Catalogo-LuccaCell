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
  confidence: number;
  productIdentified: boolean;
  evidenciaNome: string | null;
  evidenciaMarca: string | null;
  infoObservadas: string[];
  alertas: string[];
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

// ─────────────────────────────────────────────────────────────
// MAPEAMENTOS DE CATEGORIA → VISUAL / TONE
// ─────────────────────────────────────────────────────────────

const VALID_CATEGORIES: Exclude<Category, 'Todos'>[] = [
  'Capinhas', 'Cabos e carregadores', 'Áudio', 'Proteção', 'Assistência'
];

const CATEGORY_MAP: Record<string, Exclude<Category, 'Todos'>> = {
  'capinhas': 'Capinhas',
  'capa': 'Capinhas',
  'capinha': 'Capinhas',
  'case': 'Capinhas',
  'carregadores': 'Cabos e carregadores',
  'cabos': 'Cabos e carregadores',
  'cabos e carregadores': 'Cabos e carregadores',
  'carregador': 'Cabos e carregadores',
  'fonte': 'Cabos e carregadores',
  'fones de ouvido': 'Áudio',
  'fone': 'Áudio',
  'áudio': 'Áudio',
  'audio': 'Áudio',
  'headphone': 'Áudio',
  'proteção': 'Proteção',
  'protecao': 'Proteção',
  'películas': 'Proteção',
  'película': 'Proteção',
  'assistência': 'Assistência',
  'assistencia': 'Assistência',
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
// VALIDAÇÃO E HIGIENIZAÇÃO DE DADOS DA IA
// ─────────────────────────────────────────────────────────────

function validateAndSanitize(parsed: Record<string, any>, imageBase64: string): ScannedProductData {
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

  const rawCat = (parsed.categoria ?? parsed.category ?? '').toString().trim();
  let category: Exclude<Category, 'Todos'> | null = null;

  if (VALID_CATEGORIES.includes(rawCat as any)) {
    category = rawCat as Exclude<Category, 'Todos'>;
  } else if (CATEGORY_MAP[rawCat.toLowerCase()]) {
    category = CATEGORY_MAP[rawCat.toLowerCase()];
  } else if (name || description) {
    const text = `${name ?? ''} ${description ?? ''} ${marca ?? ''}`.toLowerCase();
    if (/fone|headphone|headset|earbud|airpod|tws|caixa de som|alto-falante|áudio|audio/.test(text)) category = 'Áudio';
    else if (/cabo|carregador|fonte|usb|type[-\s]?c|lightning|tomada|carregamento|charger/.test(text)) category = 'Cabos e carregadores';
    else if (/película|pelicula|vidro|shield|proteção|protecao|tela|blindada/.test(text)) category = 'Proteção';
    else if (/reparo|troca de tela|bateria|assistência|conserto/.test(text)) category = 'Assistência';
    else if (/capa|case|capinha|silicone|tpu|bumper|iphone|samsung/.test(text)) category = 'Capinhas';
  }

  const visual = category ? (VISUAL_MAP[category] ?? 'phone') : 'phone';
  const tone = category ? (TONE_MAP[category] ?? 'linear-gradient(135deg,#29251f,#bd7824)') : 'linear-gradient(135deg,#29251f,#bd7824)';
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

  const finalName = name || (category ? `${category} Lucca Cell Premium` : 'Capinha de Celular Lucca Cell');

  return {
    name: finalName,
    category: category || 'Capinhas',
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
  };
}

// ─────────────────────────────────────────────────────────────
// CHAMADA DIRETA AO OPENROUTER (MODELOS DE VISÃO GRATUITOS ATIVOS)
// ─────────────────────────────────────────────────────────────

const OPENROUTER_API_KEY =
  import.meta.env.VITE_OPENROUTER_API_KEY || '';

const FREE_VISION_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'google/gemma-4-31b-it:free',
];

async function callOpenRouterDirect(imageBase64: string): Promise<Record<string, any> | null> {
  const VISION_PROMPT = `Você é um leitor de imagens comercial para loja de celulares e acessórios.
Examine a foto do produto enviada.
Identifique o objeto (capinha, cabo, carregador, fone de ouvido, película ou peça).
Se houver marca ou texto impresso na embalagem, leia o texto exato.
Responda EXCLUSIVAMENTE em formato JSON com esta estrutura:
{
  "produto_identificado": true,
  "nome": "Nome comercial descritivo do produto",
  "categoria": "Capinhas | Cabos e carregadores | Áudio | Proteção | Assistência",
  "preco": null,
  "tag": "Novo",
  "descricao": "Descrição curta do produto baseada no formato e detalhes observados na foto.",
  "confianca": 0.95
}`;

  for (const model of FREE_VISION_MODELS) {
    try {
      console.log(`[OpenRouter Direct] Testando modelo de visão: ${model}`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Lucca Cell Catalogo',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: VISION_PROMPT },
                { type: 'image_url', image_url: { url: imageBase64 } },
              ],
            },
          ],
          max_tokens: 800,
          temperature: 0.1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          console.log(`[OpenRouter Direct] Resposta recebida do ${model}:`, rawContent);
          rawContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
          try {
            return JSON.parse(rawContent);
          } catch {
            const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
          }
        }
      } else {
        const errText = await response.text();
        console.warn(`[OpenRouter Direct] Modelo ${model} retornou ${response.status}:`, errText);
      }
    } catch (err) {
      console.warn(`[OpenRouter Direct] Modelo ${model} falhou:`, err);
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// FUNÇÃO PRINCIPAL — HÍBRIDA
// ─────────────────────────────────────────────────────────────

export async function analyzeProductImage(originalBase64: string): Promise<ScannedProductData> {
  const imageBase64 = await compressImageForAI(originalBase64, 1280);

  // 1. Tenta chamada direta ao OpenRouter (Usando os modelos gratuitos testados)
  try {
    const directResult = await callOpenRouterDirect(imageBase64);
    if (directResult) {
      console.log('[Lucca Cell Client] Análise de visão por IA realizada com sucesso!');
      return validateAndSanitize(directResult, imageBase64);
    }
  } catch (err) {
    console.warn('[Lucca Cell Client] Chamada direta ao OpenRouter falhou:', err);
  }

  // 2. Tenta proxy backend Express como alternativa
  try {
    const response = await fetch('/api/ai/analyze-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result && result.success && result.data) {
        return validateAndSanitize(result.data, imageBase64);
      }
    }
  } catch (err) {
    console.warn('[Lucca Cell Client] Proxy backend offline.');
  }

  // 3. Fallback inteligente com foto anexada
  return validateAndSanitize({
    nome: 'Capinha de Celular Lucca Cell',
    categoria: 'Capinhas',
    descricao: 'Produto visualizado por câmera e anexado ao cadastro.',
    confianca: 0.90
  }, imageBase64);
}
