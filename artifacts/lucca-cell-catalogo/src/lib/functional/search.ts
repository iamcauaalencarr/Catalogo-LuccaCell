import { Product } from '@/types/admin';
import { CATEGORIAS_VALIDAS } from '@/services/openrouter';

/**
 * Pipeline Funcional de Normalização de Texto
 */
export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export function tokenizeQuery(rawQuery: string): string[] {
  const normalized = normalizeText(rawQuery);
  return normalized.split(/\s+/).filter(Boolean);
}

/**
 * Dicionário Inteligente de Sinônimos e Termos Relacionados
 */
export const SMART_SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  capa: ['capinha', 'capinhas', 'case', 'cover', 'silicone', 'magsafe', 'couro'],
  capas: ['capinha', 'capinhas', 'case', 'cover', 'silicone'],
  capinha: ['capa', 'capinhas', 'case', 'cover', 'silicone', 'magsafe'],
  capinhas: ['capa', 'capinha', 'case', 'cover', 'silicone', 'magsafe'],
  case: ['capa', 'capinha', 'capinhas', 'cover'],
  cabo: ['cabos', 'carregador', 'carregadores', 'usb', 'usbc', 'lightning', 'fonte', 'tomada', 'turbo', 'tipo-c'],
  cabos: ['cabo', 'carregador', 'carregadores', 'usb', 'lightning', 'fonte', 'tomada'],
  carregador: ['cabo', 'cabos', 'fonte', 'tomada', 'turbo', 'inducao', 'magsafe', 'powerbank', 'bateria'],
  carregadores: ['cabo', 'cabos', 'fonte', 'tomada', 'turbo', 'inducao', 'powerbank'],
  fonte: ['carregador', 'carregadores', 'tomada', 'turbo', 'cabo'],
  fone: ['fones', 'audio', 'headphone', 'headset', 'earphone', 'airpod', 'airpods', 'bluetooth', 'som', 'sem fio'],
  fones: ['fone', 'audio', 'headphone', 'headset', 'airpods', 'bluetooth', 'som'],
  som: ['audio', 'fone', 'fones', 'caixa'],
  audio: ['fone', 'fones', 'headphone', 'headset', 'som'],
  pelicula: ['peliculas', 'protecao', 'vidro', '3d', 'privacidade', 'ceramica', 'camera', 'lente'],
  peliculas: ['pelicula', 'protecao', 'vidro', '3d', 'privacidade', 'ceramica'],
  protecao: ['pelicula', 'peliculas', 'vidro', 'blindagem', 'lente', 'camera'],
  tela: ['assistencia', 'display', 'touch', 'troca', 'conserto', 'reparo', 'vidro'],
  bateria: ['assistencia', 'troca', 'conserto', 'reparo', 'saude', 'carregamento', 'powerbank'],
  conserto: ['assistencia', 'reparo', 'manutencao', 'tecnica', 'troca', 'orcamento'],
  reparo: ['assistencia', 'conserto', 'manutencao', 'tecnica', 'troca'],
  assistencia: ['conserto', 'reparo', 'manutencao', 'troca', 'tela', 'bateria', 'servico'],
  iphone: ['apple', 'ios', '11', '12', '13', '14', '15', '16', '17', 'pro', 'max', 'plus'],
  samsung: ['galaxy', 'android', 'a14', 'a15', 'a54', 'a55', 's23', 's24', 'ultra'],
  xiaomi: ['redmi', 'poco', 'note', 'pro'],
};

/**
 * Função Pura: Verifica se um produto corresponde aos termos de busca
 */
export function matchesSmartQuery(product: Readonly<Product>, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;

  const productSearchCorpus = normalizeText(
    `${product.name} ${product.category} ${product.description} ${product.tag || ''} ${product.visual}`
  );

  return tokens.every((token) => {
    // 1. Verificação direta ou prefixo
    if (productSearchCorpus.includes(token)) return true;

    // 2. Sinônimos inteligentes
    const synonyms = SMART_SYNONYMS[token] || [];
    for (const syn of synonyms) {
      if (productSearchCorpus.includes(syn)) return true;
    }

    // 3. Tolerância a erros de digitação (Fuzzy match para termos >= 4 letras)
    if (token.length >= 4) {
      const wordsInProduct = productSearchCorpus.split(/\s+/);
      const isFuzzyMatch = wordsInProduct.some((w) => {
        if (Math.abs(w.length - token.length) > 2) return false;
        return w.startsWith(token.slice(0, -1)) || token.startsWith(w.slice(0, -1));
      });
      if (isFuzzyMatch) return true;
    }

    return false;
  });
}

export type SortCriteria = 'Destaques' | 'Menor preço' | 'Maior avaliação' | 'Nome (A-Z)';

export interface FilterOptions {
  category?: string;
  query?: string;
  sort?: SortCriteria | string;
}

/**
 * Função Pura: Filtra e ordena produtos de forma 100% determinística e imutável
 */
export function filterAndSortProducts(
  products: readonly Product[],
  options: FilterOptions
): Product[] {
  const { category = 'Todos', query = '', sort = 'Destaques' } = options;
  const tokens = tokenizeQuery(query);

  const filtered = products.filter((product) => {
    const matchesCategory =
      category === 'Todos' ||
      product.category?.toLowerCase() === category.toLowerCase();
    const matchesSearch = matchesSmartQuery(product, tokens);
    return matchesCategory && matchesSearch;
  });

  switch (sort) {
    case 'Menor preço':
      return [...filtered].sort((a, b) => a.price - b.price);
    case 'Maior avaliação':
      return [...filtered].sort((a, b) => b.rating - a.rating);
    case 'Nome (A-Z)':
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    default:
      return filtered;
  }
}

/**
 * Função Pura: Extrai dinamicamente todas as categorias únicas de produtos
 */
export function extractUniqueCategories(products: readonly Product[]): string[] {
  const baseNames = ['Todos', ...CATEGORIAS_VALIDAS];
  const dynamicSet = new Set<string>(baseNames);
  
  products.forEach((p) => {
    if (p.category && typeof p.category === 'string' && p.category.trim() && p.category !== 'Todos') {
      dynamicSet.add(p.category.trim());
    }
  });

  return Array.from(dynamicSet);
}
