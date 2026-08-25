import { createClient } from '@supabase/supabase-js';
import { Product } from '@/components/AdminPanel';

const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://ynnxouscvrrkcwyqirdk.supabase.co';
const SUPABASE_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_opiI8tsYSm4fPNeF4YTthw_kw7c2CTo';

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
    const fetchPromise = supabase
      .from('products')
      .select('*')
      .order('id', { ascending: true });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Timeout' } }), 8000)
    );

    const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

    if (error) {
      console.warn('[Supabase] Aviso ao buscar produtos (usando cache local):', error.message);
      return [];
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data as Product[];
  } catch (err) {
    console.warn('[Supabase] Erro ao buscar produtos (usando cache local):', err);
    return [];
  }
}

const SUPABASE_PRODUCT_COLUMNS = [
  'id', 'name', 'category', 'price', 'oldPrice', 'installment', 
  'rating', 'reviews', 'tag', 'description', 'visual', 'tone', 'image'
];

/**
 * Salva ou atualiza lista de produtos no Supabase (com tratamento de exceção seguro)
 */
export async function syncProductsToSupabase(products: Product[]): Promise<boolean> {
  if (!supabase || !Array.isArray(products) || products.length === 0) {
    return false;
  }

  try {
    const cleanPayload = products.map((p) => {
      const sanitized: Record<string, any> = {
        id: p.id,
        name: p.name || 'Produto sem nome',
        category: p.category || 'Outros',
        price: typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 0)),
        oldPrice: p.oldPrice ? parseFloat(String(p.oldPrice)) : null,
        installment: p.installment || `3x de ${(p.price / 3).toFixed(2)}`,
        rating: typeof p.rating === 'number' ? p.rating : 5.0,
        reviews: typeof p.reviews === 'number' ? p.reviews : 1,
        tag: p.tag || null,
        description: p.description || 'Produto de alta performance com garantia Lucca Cell.',
        visual: p.visual || 'phone',
        tone: p.tone || 'gold',
        image: p.image || null,
      };
      return sanitized;
    });

    const { error, status } = await supabase
      .from('products')
      .upsert(cleanPayload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase Error] Falha ao sincronizar produtos:', error.message, error.details);
      return false;
    }

    console.log(`[Supabase] ✅ ${cleanPayload.length} produto(s) sincronizados com sucesso (Status ${status})!`);
    return true;
  } catch (err) {
    console.error('[Supabase Error] Erro inesperado ao sincronizar produtos:', err);
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
 * Carrega as configurações da loja do Supabase (para sincronizar entre celular e PC)
 */
export async function fetchStoreSettingsFromSupabase(): Promise<any | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .eq('id', 'default_settings')
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] Aviso ao carregar configurações da loja:', error.message);
      return null;
    }
    return data?.settings || null;
  } catch (err) {
    console.warn('[Supabase] Erro ao buscar configurações:', err);
    return null;
  }
}

/**
 * Salva as configurações da loja no Supabase para sincronização universal
 */
export async function syncStoreSettingsToSupabase(settings: any): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        id: 'default_settings',
        settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Falha ao sincronizar configurações:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Erro ao sincronizar configurações:', err);
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
  if (!profile.permissions || !Array.isArray(profile.permissions) || profile.permissions.length === 0) {
    // Administrador padrão ativo tem permissão de leitura, cadastro e edição
    return permission !== 'products.delete' && permission !== 'admins.manage';
  }
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
): Promise<{ success: boolean; error?: string; message?: string }> {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };

  const emailClean = email.trim().toLowerCase();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Sessão expirada' };

    // 1. Invocação da Edge Function para disparo oficial de e-mail pelo Supabase Auth Admin
    const { data, error } = await supabase.functions.invoke('invite-admin', {
      body: {
        email: emailClean,
        permissions
      }
    });

    if (!error && data) {
      if (data.error) {
        return { success: false, error: data.error };
      }
      return { success: true, message: data.message || `Convite enviado com sucesso para ${emailClean}!` };
    }

    // 2. Fallback caso a Edge Function ainda não esteja implantada
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: insertError } = await supabase
      .from('admin_invitations')
      .upsert({
        email: emailClean,
        role: 'admin',
        permissions,
        invited_by: user.id,
        token,
        expires_at: expiresAt
      }, { onConflict: 'email' });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    await logSecurityAction('ADMIN_INVITED', 'admin_invitations', { email: emailClean, permissions });
    return { success: true, message: `Convite criado para ${emailClean}!` };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao criar convite.' };
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

export interface SecurityAuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_name?: string;
  actor_role?: RoleType;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  created_at: string;
}

const LOCAL_AUDIT_KEY = 'lucca_cell_security_audit_logs';

function getLocalAuditLogs(): SecurityAuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAuditLog(log: SecurityAuditLog) {
  try {
    const current = getLocalAuditLogs();
    localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify([log, ...current].slice(0, 100)));
  } catch {
    // Silently ignore
  }
}

/**
 * Busca logs de auditoria de segurança (Apenas Owner via RLS ou Local Storage)
 */
export async function fetchSecurityAuditLogs(): Promise<SecurityAuditLog[]> {
  const localLogs = getLocalAuditLogs();

  if (!supabase) return localLogs;

  try {
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60);

    if (!error && data && data.length > 0) {
      const map = new Map<string, SecurityAuditLog>();
      data.forEach((l: any) => map.set(l.id, l as SecurityAuditLog));
      localLogs.forEach((l) => {
        if (!map.has(l.id)) map.set(l.id, l);
      });
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  } catch {
    // Fallback para logs locais
  }

  return localLogs;
}

/**
 * Grava um log de segurança na tabela de auditoria e no storage local
 */
export async function logSecurityAction(
  action: string, 
  resource?: string, 
  details?: Record<string, any>,
  actorOverride?: { name?: string; role?: RoleType; email?: string }
) {
  let actorEmail = actorOverride?.email || 'sistema@luccacell.com';
  let actorId = 'system';
  let actorName = actorOverride?.name || '';
  let actorRole = actorOverride?.role;

  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        actorId = user.id;
        actorEmail = user.email || actorEmail;
      }
    } catch {
      // Ignore
    }
  }

  // Tentar obter dados do perfil ativo caso não fornecidos
  if (!actorName && typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem('supabase_admin_profile');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.name) actorName = parsed.name;
        if (parsed?.role) actorRole = parsed.role;
      }
    } catch {
      // Ignore
    }
  }

  const newLog: SecurityAuditLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actor_id: actorId,
    actor_email: actorEmail,
    actor_name: actorName || (actorEmail.includes('@') ? actorEmail.split('@')[0] : 'Administrador'),
    actor_role: actorRole || 'owner',
    action,
    resource,
    details: details || {},
    created_at: new Date().toISOString()
  };

  // Salvar no storage local
  saveLocalAuditLog(newLog);

  // Salvar no Supabase
  if (supabase) {
    try {
      await supabase.from('security_audit_logs').insert({
        actor_id: newLog.actor_id,
        actor_email: newLog.actor_email,
        action: newLog.action,
        resource: newLog.resource,
        details: {
          ...newLog.details,
          actor_name: newLog.actor_name,
          actor_role: newLog.actor_role
        }
      });
    } catch {
      // Falhas de log não devem quebrar o fluxo
    }
  }
}

/**
 * Tradução e formatação humana dos Logs de Auditoria
 */
export interface FormattedAuditItem {
  actorName: string;
  actorRoleText: string;
  isOwner: boolean;
  actionTitle: string;
  humanDescription: string;
  category: 'auth' | 'products' | 'team' | 'requests' | 'system';
  badgeStyle: {
    bg: string;
    border: string;
    text: string;
  };
  iconType: 'login' | 'logout' | 'plus' | 'edit' | 'trash' | 'mail' | 'shield' | 'message';
  relativeTime: string;
  fullDate: string;
  metadata?: Record<string, any>;
}

export function formatAuditLogForDisplay(log: SecurityAuditLog): FormattedAuditItem {
  const details = log.details || {};
  const rawRole = (details.actor_role || log.actor_role || (log.actor_email.includes('admin') ? 'admin' : 'owner')) as RoleType;
  const isOwner = rawRole === 'owner';
  const rawName = details.actor_name || log.actor_name || log.actor_email.split('@')[0];
  const actorName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const actorRoleText = isOwner ? 'OWNER' : 'ADMIN';

  const date = new Date(log.created_at);
  const fullDate = date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Cálculo de tempo relativo
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  let relativeTime = 'Agora mesmo';
  if (diffMinutes >= 1 && diffMinutes < 60) {
    relativeTime = `Há ${diffMinutes} min`;
  } else if (diffMinutes >= 60 && diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    relativeTime = `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  } else if (diffMinutes >= 1440) {
    const days = Math.floor(diffMinutes / 1440);
    relativeTime = `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }

  let actionTitle = 'Ação no Sistema';
  let humanDescription = `${actorName} realizou uma operação no sistema.`;
  let category: FormattedAuditItem['category'] = 'system';
  let iconType: FormattedAuditItem['iconType'] = 'shield';
  let badgeStyle = {
    bg: 'bg-stone-100',
    border: 'border-stone-200',
    text: 'text-stone-700'
  };

  switch (log.action) {
    case 'ADMIN_LOGIN_SUCCESS':
      actionTitle = 'Login Efetuado';
      humanDescription = `entrou no painel administrativo.`;
      category = 'auth';
      iconType = 'login';
      badgeStyle = { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' };
      break;

    case 'ADMIN_LOGOUT':
      actionTitle = 'Sessão Encerrada';
      humanDescription = `saiu do painel administrativo.`;
      category = 'auth';
      iconType = 'logout';
      badgeStyle = { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' };
      break;

    case 'PRODUCT_CREATED':
      actionTitle = 'Produto Cadastrado';
      humanDescription = `cadastrou o produto "${details.product_name || 'Novo Produto'}"${details.price ? ` no valor de ${Number(details.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}.`;
      category = 'products';
      iconType = 'plus';
      badgeStyle = { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
      break;

    case 'PRODUCT_UPDATED':
      actionTitle = 'Produto Alterado';
      humanDescription = `alterou as informações do produto "${details.product_name || 'Produto'}".`;
      category = 'products';
      iconType = 'edit';
      badgeStyle = { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' };
      break;

    case 'PRODUCT_DELETED':
      actionTitle = 'Produto Excluído';
      humanDescription = `excluiu o produto "${details.product_name || `Código #${details.product_id || ''}`}" do catálogo.`;
      category = 'products';
      iconType = 'trash';
      badgeStyle = { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
      break;

    case 'ADMIN_INVITED':
      actionTitle = 'Convite Enviado';
      humanDescription = `enviou um convite de acesso para "${details.email || 'novo usuário'}".`;
      category = 'team';
      iconType = 'mail';
      badgeStyle = { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800' };
      break;

    case 'ADMIN_INVITATION_CANCELLED':
      actionTitle = 'Convite Cancelado';
      humanDescription = `cancelou um convite de administrador pendente.`;
      category = 'team';
      iconType = 'trash';
      badgeStyle = { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' };
      break;

    case 'ADMIN_PROFILE_UPDATED':
      actionTitle = 'Acesso Modificado';
      humanDescription = `alterou o status de acesso de um membro da equipe.`;
      category = 'team';
      iconType = 'shield';
      badgeStyle = { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' };
      break;

    case 'PRODUCT_REQUEST_STATUS_UPDATED':
      actionTitle = 'Pedido de Cliente Atualizado';
      humanDescription = `atualizou o status da solicitação de "${details.customer_name || 'Cliente'}" para "${details.status || 'Atendido'}".`;
      category = 'requests';
      iconType = 'message';
      badgeStyle = { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800' };
      break;

    default:
      actionTitle = log.action.replace(/_/g, ' ');
      humanDescription = `executou a ação "${log.action}" em ${log.resource || 'sistema'}.`;
  }

  return {
    actorName,
    actorRoleText,
    isOwner,
    actionTitle,
    humanDescription,
    category,
    badgeStyle,
    iconType,
    relativeTime,
    fullDate,
    metadata: details
  };
}


/**
 * ---------------------------------------------------------------------------
 * SOLICITAÇÕES DE PRODUTOS FEITAS POR CLIENTES
 * ---------------------------------------------------------------------------
 */

export interface ProductRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  details?: string;
  status: 'pending' | 'contacted' | 'resolved' | 'cancelled';
  created_at: string;
  updated_at?: string;
}

const LOCAL_REQUESTS_KEY = 'lucca_cell_product_requests';

function getLocalRequests(): ProductRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(requests: ProductRequest[]) {
  try {
    localStorage.setItem(LOCAL_REQUESTS_KEY, JSON.stringify(requests));
  } catch (err) {
    console.warn('[LocalStorage] Erro ao salvar solicitações:', err);
  }
}

/**
 * Cria uma nova solicitação de produto (cliente)
 */
export async function createProductRequest(
  data: Omit<ProductRequest, 'id' | 'created_at' | 'status'>
): Promise<{ success: boolean; data?: ProductRequest; error?: string }> {
  const newRequest: ProductRequest = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}`,
    customer_name: data.customer_name.trim(),
    customer_phone: data.customer_phone.trim(),
    product_name: data.product_name.trim(),
    details: data.details?.trim() || '',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Salvar no storage local primeiro para garantir que nada se perca
  const local = getLocalRequests();
  saveLocalRequests([newRequest, ...local]);

  if (supabase) {
    try {
      const { data: inserted, error } = await supabase
        .from('product_requests')
        .insert({
          customer_name: newRequest.customer_name,
          customer_phone: newRequest.customer_phone,
          product_name: newRequest.product_name,
          details: newRequest.details,
          status: newRequest.status
        })
        .select()
        .single();

      if (error) {
        console.warn('[Supabase] Aviso ao gravar solicitação no banco, mantendo local:', error.message);
      } else if (inserted) {
        return { success: true, data: inserted as ProductRequest };
      }
    } catch (err) {
      console.warn('[Supabase] Erro de rede ao gravar solicitação, mantendo local:', err);
    }
  }

  return { success: true, data: newRequest };
}

/**
 * Busca a lista de solicitações de produtos para o Admin
 */
export async function fetchProductRequests(): Promise<ProductRequest[]> {
  const local = getLocalRequests();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('product_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Mesclar dados do Supabase com locais se houver
        const map = new Map<string, ProductRequest>();
        data.forEach((r: any) => map.set(r.id, r as ProductRequest));
        local.forEach((r) => {
          if (!map.has(r.id)) {
            map.set(r.id, r);
          }
        });
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    } catch (err) {
      console.warn('[Supabase] Não foi possível carregar do banco remoto, usando locais:', err);
    }
  }

  return local;
}

/**
 * Atualiza o status de uma solicitação de produto
 */
export async function updateProductRequestStatus(
  id: string,
  status: ProductRequest['status']
): Promise<boolean> {
  const local = getLocalRequests();
  const updated = local.map((r) =>
    r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r
  );
  saveLocalRequests(updated);

  if (supabase) {
    try {
      await supabase
        .from('product_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Erro ao atualizar status no banco:', err);
    }
  }

  return true;
}

/**
 * Deleta uma solicitação de produto
 */
export async function deleteProductRequest(id: string): Promise<boolean> {
  const local = getLocalRequests();
  saveLocalRequests(local.filter((r) => r.id !== id));

  if (supabase) {
    try {
      await supabase
        .from('product_requests')
        .delete()
        .eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Erro ao deletar solicitação do banco:', err);
    }
  }

  return true;
}

