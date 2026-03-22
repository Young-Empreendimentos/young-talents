import React, { useState, useMemo } from 'react';
import { X, User, MapPin, Mail, Phone, Search, ExternalLink, GitBranch, Eye } from 'lucide-react';
import { STATUS_COLORS } from '../../constants';

export default function DashboardCandidatesModal({ 
  isOpen, 
  onClose, 
  candidates = [],
  title = 'Candidatos',
  onViewProfile,
  onViewPipeline
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  if (!isOpen) return null;

  // Filtrar candidatos
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.fullName?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term)
      );
    }
    
    // Filtro por status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(c => (c.status || 'Inscrito') === selectedStatus);
    }
    
    return filtered;
  }, [candidates, searchTerm, selectedStatus]);

  // Estatísticas
  const stats = useMemo(() => {
    const byStatus = {};
    candidates.forEach(c => {
      const status = c.status || 'Inscrito';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    return byStatus;
  }, [candidates]);

  const handleViewProfile = (candidate) => {
    if (onViewProfile) {
      onViewProfile(candidate);
      onClose();
    }
  };

  const handleViewPipeline = (candidate) => {
    if (onViewPipeline) {
      onViewPipeline(candidate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h3 className="font-bold text-xl text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">
              {filteredCandidates.length} de {candidates.length} candidatos
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="text-muted-foreground" size={20}/>
          </button>
        </div>

        {/* Filtros e Busca */}
        <div className="p-4 border-b border-border bg-gray-50 dark:bg-gray-900/30 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card border border-input rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Filtrar por status:</span>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Todos ({candidates.length})
            </button>
            {Object.entries(stats).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-muted-foreground hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {status} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Candidatos */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCandidates.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <User size={48} className="mx-auto mb-4 opacity-30"/>
              <p>Nenhum candidato encontrado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCandidates.map(candidate => (
                <div
                  key={candidate.id}
                  className="bg-card rounded-lg border border-border p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        {candidate.photoUrl ? (
                          <img src={candidate.photoUrl} className="w-full h-full object-cover rounded-full" alt={candidate.fullName} />
                        ) : (
                          <User size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground text-sm truncate">
                          {candidate.fullName || 'Sem nome'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[candidate.status] || 'bg-slate-600 text-white'}`}>
                            {candidate.status || 'Inscrito'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {candidate.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail size={14} />
                        <span className="truncate">{candidate.email}</span>
                      </div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone size={14} />
                        <span>{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.city && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin size={14} />
                        <span>{candidate.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => handleViewProfile(candidate)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                    >
                      <Eye size={14} />
                      Ver Perfil
                    </button>
                    <button
                      onClick={() => handleViewPipeline(candidate)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium"
                    >
                      <GitBranch size={14} />
                      Ver na Pipeline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
