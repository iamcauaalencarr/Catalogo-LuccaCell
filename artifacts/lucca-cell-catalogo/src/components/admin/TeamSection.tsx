import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Mail, 
  Trash2, 
  Check, 
  X, 
  Shield, 
  Clock, 
  Crown, 
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { 
  AdminProfile, 
  AdminInvitation, 
  PermissionType, 
  RoleType,
  fetchAllAdminProfiles,
  updateAdminProfile,
  createAdminInvitation,
  fetchAdminInvitations,
  deleteAdminInvitation,
  logSecurityAction
} from '@/lib/supabase';

interface TeamSectionProps {
  currentUser: AdminProfile;
}

export function TeamSection({ currentUser }: TeamSectionProps) {
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de Convite
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('admin');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionType[]>([
    'products.read',
    'products.create',
    'products.update'
  ]);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isOwner = currentUser.role === 'owner';

  const loadData = async () => {
    setLoading(true);
    const [profList, invList] = await Promise.all([
      fetchAllAdminProfiles(),
      fetchAdminInvitations()
    ]);
    setProfiles(profList);
    setInvitations(invList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (profile: AdminProfile) => {
    if (!isOwner || profile.id === currentUser.id) return;
    const newStatus = !profile.is_active;
    const success = await updateAdminProfile(profile.id, { is_active: newStatus });
    if (success) {
      setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, is_active: newStatus } : p));
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    setInviteFeedback(null);

    const res = await createAdminInvitation(inviteEmail.trim(), selectedPermissions);
    setSendingInvite(false);

    if (res.success) {
      setInviteFeedback({ type: 'success', message: res.message || 'Convite criado com sucesso!' });
      setInviteEmail('');
      loadData();
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteFeedback(null);
      }, 1800);
    } else {
      setInviteFeedback({ type: 'error', message: res.error || 'Erro ao enviar convite.' });
    }
  };

  const handleDeleteInvite = async (id: string) => {
    const success = await deleteAdminInvitation(id);
    if (success) {
      setInvitations(prev => prev.filter(i => i.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Controle de Acesso RBAC
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {profiles.length} administradores
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Equipe & Permissões
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Gerencie quem tem acesso ao painel da Lucca Cell e defina permissões granulares.
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#D97757] text-white px-5 py-3 text-xs font-bold shadow-xs hover:bg-[#C26243] active:scale-95 transition-all min-h-[44px]"
          >
            <UserPlus size={16} />
            <span>Convidar Administrador</span>
          </button>
        )}
      </div>

      {/* Lista de Membros */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#EFE9E0] flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#1E1D1B]">
            Membros com Acesso Ativo
          </h3>
        </div>

        <div className="divide-y divide-[#EFE9E0]">
          {profiles.map(profile => (
            <div key={profile.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2]/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-[#FAF0E8] text-[#B05330] flex items-center justify-center font-bold text-base uppercase">
                  {profile.name ? profile.name.charAt(0) : 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#1E1D1B]">{profile.name || 'Administrador'}</h4>
                    {profile.role === 'owner' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                        <Crown size={12} /> Proprietário
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7A7368] mt-0.5">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE9E0]">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  profile.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {profile.is_active ? 'Ativo' : 'Desativado'}
                </span>

                {isOwner && profile.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => handleToggleActive(profile)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors min-h-[40px] ${
                      profile.is_active
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {profile.is_active ? 'Desativar Acesso' : 'Reativar Acesso'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Convites Pendentes */}
      {invitations.length > 0 && (
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#EFE9E0]">
            <h3 className="font-serif font-bold text-base text-[#1E1D1B]">
              Convites Pendentes ({invitations.length})
            </h3>
          </div>

          <div className="divide-y divide-[#EFE9E0]">
            {invitations.map(inv => (
              <div key={inv.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#1E1D1B]">{inv.email}</p>
                  <p className="text-[11px] text-[#7A7368]">
                    Expira em: {new Date(inv.expires_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteInvite(inv.id)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                    title="Cancelar convite"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Convidar Administrador */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-[#E7E0D5] shadow-2xl space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <h3 className="text-base font-serif font-bold text-[#1E1D1B]">
                Convidar Novo Administrador
              </h3>
              <button type="button" onClick={() => setInviteModalOpen(false)} className="text-[#7A7368]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4A453E] mb-1">
                  E-mail do Convidado *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="admin@luccacell.com"
                  className="w-full h-11 px-4 rounded-xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B]"
                  required
                />
              </div>

              {inviteFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold ${
                  inviteFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                }`}>
                  {inviteFeedback.message}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#7A7368]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="px-5 py-2.5 rounded-xl bg-[#D97757] text-white text-xs font-bold"
                >
                  {sendingInvite ? 'Enviando...' : 'Gerar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
