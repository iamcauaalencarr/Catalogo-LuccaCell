import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  LogIn, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Shield, 
  MessageSquareText, 
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  SecurityAuditLog, 
  fetchSecurityAuditLogs, 
  formatAuditLogForDisplay, 
  FormattedAuditItem 
} from '@/lib/supabase';

export function AuditSection() {
  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'auth' | 'products' | 'team' | 'requests' | 'system'>('all');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const data = await fetchSecurityAuditLogs();
      setLogs(data);
      setLoading(false);
    };
    loadLogs();
  }, []);

  const formattedItems = useMemo(() => {
    return logs.map(log => ({
      ...formatAuditLogForDisplay(log),
      rawLog: log
    }));
  }, [logs]);

  const filteredItems = useMemo(() => {
    return formattedItems.filter(item => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesActor = item.actorName.toLowerCase().includes(q) || item.rawLog.actor_email.toLowerCase().includes(q);
        const matchesAction = item.actionTitle.toLowerCase().includes(q) || item.humanDescription.toLowerCase().includes(q);
        if (!matchesActor && !matchesAction) return false;
      }
      return true;
    });
  }, [formattedItems, categoryFilter, searchTerm]);

  // Exportar Logs CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;

    const headers = ['Data', 'Horario', 'Usuario', 'Email', 'Acao', 'Descricao', 'Recurso'];
    const rows = filteredItems.map(item => [
      `"${item.fullDate.split(' ')[0]}"`,
      `"${item.fullDate.split(' ')[1] || ''}"`,
      `"${item.actorName}"`,
      `"${item.rawLog.actor_email}"`,
      `"${item.actionTitle}"`,
      `"${item.humanDescription.replace(/"/g, '""')}"`,
      `"${item.rawLog.resource || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_lucca_cell_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionIcon = (type: FormattedAuditItem['iconType']) => {
    switch (type) {
      case 'plus': return <Plus size={14} className="text-emerald-700" />;
      case 'edit': return <Edit size={14} className="text-blue-700" />;
      case 'trash': return <Trash2 size={14} className="text-red-700" />;
      case 'login': return <LogIn size={14} className="text-emerald-700" />;
      case 'logout': return <LogOut size={14} className="text-amber-700" />;
      case 'mail': return <Mail size={14} className="text-purple-700" />;
      case 'message': return <MessageSquareText size={14} className="text-cyan-700" />;
      default: return <Shield size={14} className="text-stone-700" />;
    }
  };

  return (
    <div className="space-y-6 animate-rise">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-3xl border border-[#E7E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B05330]">
              Segurança & Rastreabilidade
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#D97757]" />
            <span className="text-xs text-[#7A7368] font-bold">
              {logs.length} registros
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E1D1B]">
            Auditoria de Logs
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7368]">
            Histórico completo de cadastros, edições, exclusões e acessos ao sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] px-4 py-3 text-xs font-bold text-[#4A453E] hover:bg-[#F2ECE2] min-h-[44px]"
        >
          <Download size={16} />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 rounded-3xl border border-[#E7E0D5] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="sm:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E978C]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuário, ação ou descrição..."
              className="w-full h-12 pl-11 pr-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs sm:text-sm text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="w-full h-12 px-4 rounded-2xl bg-[#FAF7F2] border border-[#E0D8CC] text-xs font-bold text-[#1E1D1B] focus:outline-none focus:border-[#D97757]"
            >
              <option value="all">🔍 Todas as Categorias</option>
              <option value="products">📦 Produtos (Cadastros/Edições)</option>
              <option value="auth">🔐 Acessos e Sessões</option>
              <option value="team">👥 Gestão de Equipe</option>
              <option value="requests">💬 Pedidos & Solicitações</option>
            </select>
          </div>

        </div>
      </div>

      {/* Timeline de Logs */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E7E0D5] shadow-xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A7368]">
            Nenhum registro de auditoria encontrado.
          </div>
        ) : (
          <div className="divide-y divide-[#EFE9E0]">
            {filteredItems.map((item, idx) => (
              <div key={item.rawLog.id || idx} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF7F2]/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-2xl border ${item.badgeStyle.bg} ${item.badgeStyle.border} shrink-0 mt-0.5`}>
                    {getActionIcon(item.iconType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-xs text-[#1E1D1B]">{item.actionTitle}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold border ${item.badgeStyle.bg} ${item.badgeStyle.border} ${item.badgeStyle.text}`}>
                        {item.actorRoleText}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A453E]">
                      <strong>{item.actorName}</strong> {item.humanDescription}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFE9E0]">
                  <span className="text-[11px] font-bold text-[#7A7368] block">
                    {item.relativeTime}
                  </span>
                  <span className="text-[10px] text-[#9E978C]">
                    {item.fullDate}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
