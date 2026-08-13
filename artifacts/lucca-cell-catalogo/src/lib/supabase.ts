import { createClient } from '@supabase/supabase-js';
import { Product } from '@/components/AdminPanel';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ynnxouscvrrkcwyqirdk.supabase.co';

const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_opiI8tsYSm4fPNeF4YTthw_kw7c2CTo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Carrega produtos do Supabase. Caso o banco esteja vazio ou sem a tabela,
 * retorna null para usar os dados iniciais do catálogo.
 */
export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Supabase info/aviso:', error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data as Product[];
  } catch (err) {
    console.warn('Erro ao conectar ao Supabase:', err);
    return null;
  }
}

/**
 * Salva ou atualiza lista completa no Supabase
 */
export async function syncProductsToSupabase(products: Product[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' });

    if (error) {
      console.warn('Erro ao salvar no Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro ao sincronizar com Supabase:', err);
    return false;
  }
}

/**
 * Deleta um produto do Supabase
 */
export async function deleteProductFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Erro ao deletar no Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Erro ao deletar produto do Supabase:', err);
    return false;
  }
}
