import { createClient } from '@supabase/supabase-js';
import { Product } from '@/components/AdminPanel';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicialização segura do cliente Supabase
export const supabase = (SUPABASE_URL && SUPABASE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/**
 * Carrega produtos do Supabase. Caso o banco esteja vazio ou não configurado,
 * retorna null para usar os dados locais/iniciais do catálogo.
 */
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('[Supabase Security] Aviso ao buscar produtos:', error.message);
      return [];
    }

    if (!data) {
      return [];
    }

    return data as Product[];
  } catch (err) {
    console.warn('[Supabase Security] Erro de conexão:', err);
    return [];
  }
}

/**
 * Salva ou atualiza lista de produtos no Supabase (com tratamento de exceção seguro)
 */
export async function syncProductsToSupabase(products: Product[]): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase Security] Falha ao sincronizar produtos (RLS pode estar ativo):', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase Security] Erro de sincronização:', err);
    return false;
  }
}

/**
 * Deleta um produto do Supabase (com tratamento de exceção seguro)
 */
export async function deleteProductFromSupabase(id: number): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[Supabase Security] Falha ao deletar produto:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('[Supabase Security] Erro ao deletar produto:', err);
    return false;
  }
}

/**
 * ---------------------------------------------------------------------------
 * RBAC & MODELOS DE SEGURANÇA (SUPABASE AUTH + BANCO)
 * ---------------------------------------------------------------------------
 */

export type RoleType = 'owner' | 'admin';

export type PermissionType = 
  | 'products.read' 
  | 'products.create' 
  | 'products.update' 
  | 'products.delete' 
  | 'admins.manage' 
  | 'reports.read';

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  permissions: PermissionType[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminInvitation {
  id: string;
  email: string;
  role: RoleType;
  permissions: PermissionType[];
  invited_by: string;
  token: string;
  expires_at: string;
  created_at?: string;
}

export interface SecurityAuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  created_at: string;
}

/**
 * Registra um novo administrador via Supabase Auth.
 * Bloqueia se o e-mail já existir no banco ou no Auth.
 */
export async function signUpAdminWithSupabase(email: string, password: string, name: string) {
  if (!supabase) return { error: new Error('Supabase não configurado no .env'), data: null };
  
  const emailClean = email.trim().toLowerCase();

  // 1. Checagem prévia na tabela admin_profiles
  try {
    const { data: existingProfile } = await supabase
      .from('admin_profiles')
      .select('id')
      .ilike('email', emailClean)
      .maybeSingle();

    if (existingProfile) {
      return { 
        data: null, 
        error: new Error('Este e-mail já está cadastrado no sistema. Por favor, vá para a aba "Entrar".') 
      };
    }
  } catch {
    // Prossegue para o Auth caso RLS restrinja select anônimo
  }

  // 2. Requisição ao Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: emailClean,
    password,
    options: {
      data: {
        name
      }
    }
  });

  if (error) {
    return { data: null, error };
  }

  // 3. Supabase Auth Check: se o e-mail já existir no auth.users, identities vem como array vazio []
  if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return {
      data: null,
      error: new Error('Este e-mail já está cadastrado no sistema. Por favor, vá para a aba "Entrar".')
    };
  }

  return { data, error: null };
}

/**
 * Autentica o usuário e busca seu perfil e permissões no banco de dados.
 */
export async function signInAdminWithSupabase(email: string, password: string): Promise<{
  profile: AdminProfile | null;
  error: Error | null;
  emailUnconfirmed?: boolean;
}> {
  if (!supabase) {
    return { profile: null, error: new Error('Supabase não configurado no .env') };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed') || 
                          error.message.toLowerCase().includes('not confirmed');
    return { profile: null, error, emailUnconfirmed: isUnconfirmed };
  }

  if (!data.user) {
    return { profile: null, error: new Error('Usuário não encontrado.') };
  }

  // Buscar perfil em public.admin_profiles
  const profile = await fetchCurrentAdminProfile(data.user.id);

  if (!profile) {
    // Se o trigger ainda não rodou ou não há perfil
    await supabase.auth.signOut();
    return {
      profile: null,
      error: new Error('Seu usuário ainda não possui perfil administrativo aprovado ou ativo no sistema.')
    };
  }

  if (!profile.is_active) {
    await supabase.auth.signOut();
    return {
      profile: null,
      error: new Error('Esta conta de administrador foi desativada pelo Proprietário (Owner).')
    };
  }

  // Registrar log de login bem-sucedido
  await logSecurityAction('ADMIN_LOGIN_SUCCESS', 'auth', { email: profile.email, role: profile.role });

  return { profile, error: null };
}

/**
 * Busca o perfil do administrador atual pelo ID
 */
export async function fetchCurrentAdminProfile(userId: string): Promise<AdminProfile | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as AdminProfile;
  } catch {
    return null;
  }
}

/**
 * Recupera o perfil do usuário logado na inicialização da aplicação
 */
export async function getSupabaseUser(): Promise<AdminProfile | null> {
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const profile = await fetchCurrentAdminProfile(user.id);
    if (profile && profile.is_active) {
      return profile;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Encerra a sessão ativa do administrador no Supabase Auth
 */
export async function signOutAdminFromSupabase() {
  if (!supabase) return { error: null };
  await logSecurityAction('ADMIN_LOGOUT', 'auth');
  return await supabase.auth.signOut();
}

/**
 * Verifica se o perfil possui uma determinada permissão ou é Owner
 */
export function hasClientPermission(profile: AdminProfile | null, permission: PermissionType): boolean {
  if (!profile || !profile.is_active) return false;
  if (profile.role === 'owner') return true;
  return profile.permissions.includes(permission);
}

/**
 * ---------------------------------------------------------------------------
 * GESTÃO DO OWNER (EQUIPE, CONVITES E AUDITORIA)
 * ---------------------------------------------------------------------------
 */

/**
 * Lista todos os administradores cadastrados (Apenas Owner via RLS)
 */
export async function fetchAllAdminProfiles(): Promise<AdminProfile[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[RBAC] Falha ao buscar lista de administradores:', error?.message);
      return [];
    }

    return data as AdminProfile[];
  } catch {
    return [];
  }
}

/**
 * Atualiza status e permissões de um administrador (Apenas Owner via RLS)
 */
export async function updateAdminProfile(
  id: string, 
  updates: { is_active?: boolean; permissions?: PermissionType[] }
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('admin_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.warn('[RBAC] Falha ao atualizar administrador:', error.message);
      return false;
    }

    await logSecurityAction('ADMIN_PROFILE_UPDATED', 'admin_profiles', { target_id: id, updates });
    return true;
  } catch {
    return false;
  }
}

/**
 * Cria um convite para novo administrador com permissões configuradas (Apenas Owner via RLS)
 */
export async function createAdminInvitation(
  email: string,
  permissions: PermissionType[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sessão expirada' };

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 dias

    const { error } = await supabase
      .from('admin_invitations')
      .insert({
        email: email.trim().toLowerCase(),
        role: 'admin',
        permissions,
        invited_by: user.id,
        token,
        expires_at: expiresAt
      });

    if (error) {
      return { success: false, error: error.message };
    }

    await logSecurityAction('ADMIN_INVITED', 'admin_invitations', { email, permissions });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Busca convites pendentes (Apenas Owner via RLS)
 */
export async function fetchAdminInvitations(): Promise<AdminInvitation[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('admin_invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as AdminInvitation[];
  } catch {
    return [];
  }
}

/**
 * Deleta/Cancela um convite pendente (Apenas Owner via RLS)
 */
export async function deleteAdminInvitation(id: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('admin_invitations')
      .delete()
      .eq('id', id);

    if (error) return false;
    await logSecurityAction('ADMIN_INVITATION_CANCELLED', 'admin_invitations', { invitation_id: id });
    return true;
  } catch {
    return false;
  }
}

/**
 * Busca logs de auditoria de segurança (Apenas Owner via RLS)
 */
export async function fetchSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as SecurityAuditLog[];
  } catch {
    return [];
  }
}

/**
 * Grava um log de segurança na tabela de auditoria
 */
export async function logSecurityAction(
  action: string, 
  resource?: string, 
  details?: Record<string, any>
) {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('security_audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email || 'desconhecido',
      action,
      resource,
      details: details || {}
    });
  } catch {
    // Falhas de log não devem interromper o fluxo principal
  }
}
