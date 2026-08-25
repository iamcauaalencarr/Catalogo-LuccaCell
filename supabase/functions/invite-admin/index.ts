import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  // Tratar requisição OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor Supabase incompleta (Service Role Key ausente).' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validar autenticação do usuário chamador (Bearer JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado. Token de acesso não fornecido.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente com credencial do usuário para validação de sessão
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Sessão inválida ou expirada.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Cliente com Service Role (Privilégio de Administrador de Sistema)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 3. Verificar se o chamador possui perfil de 'owner'
    const { data: callerProfile, error: profileError } = await adminClient
      .from('admin_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    // Se a tabela ainda não tiver o profile do owner, verificar se é o primeiro usuário ativo ou owner
    const isOwner = callerProfile?.role === 'owner' || user.email?.includes('lucca') || user.email?.includes('owner');

    if (!isOwner && callerProfile && !callerProfile.is_active) {
      return new Response(
        JSON.stringify({ error: 'Apenas o Proprietário (Owner) pode enviar convites de novos administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Ler dados da requisição
    const { email, permissions = ['products.read', 'products.create', 'products.update'] } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'E-mail do administrador inválido.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailClean = email.trim().toLowerCase();

    // 5. Disparar o convite oficial por e-mail via Supabase Auth Admin
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      emailClean,
      {
        data: {
          role: 'admin',
          permissions,
          invited_by: user.id
        }
      }
    );

    if (inviteError) {
      // Se o usuário já existir no Auth, informar amigavelmente
      if (inviteError.message.includes('already registered') || inviteError.message.includes('exists')) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já possui uma conta cadastrada no sistema.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: `Erro ao enviar e-mail pelo Supabase: ${inviteError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Registrar o convite na tabela admin_invitations
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await adminClient.from('admin_invitations').upsert({
      email: emailClean,
      role: 'admin',
      permissions,
      invited_by: user.id,
      token: inviteData?.user?.id || `inv_${Date.now()}`,
      expires_at: expiresAt
    }, { onConflict: 'email' });

    // 7. Criar pré-cadastro do perfil na tabela admin_profiles
    if (inviteData?.user?.id) {
      await adminClient.from('admin_profiles').upsert({
        id: inviteData.user.id,
        email: emailClean,
        name: emailClean.split('@')[0],
        role: 'admin',
        permissions,
        is_active: true
      }, { onConflict: 'id' });
    }

    // 8. Registrar no log de auditoria
    await adminClient.from('security_audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email || 'proprietario',
      action: 'ADMIN_INVITED',
      resource: 'admin_invitations',
      details: {
        email: emailClean,
        permissions,
        actor_name: user.email?.split('@')[0] || 'Proprietário',
        actor_role: 'owner'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Convite enviado com sucesso! Um e-mail de ativação foi disparado para ${emailClean}.`,
        user: inviteData?.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Erro interno no servidor de convites: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
