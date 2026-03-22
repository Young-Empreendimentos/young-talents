import React, { useState, useMemo } from 'react';
import { X, Save, AlertTriangle, Briefcase, Plus } from 'lucide-react';
import { normalizeCity, getMainCitiesOptions } from '../../utils/cityNormalizer';
import { normalizeSource, getMainSourcesOptions } from '../../utils/sourceNormalizer';
import { normalizeInterestArea, normalizeInterestAreasString, getMainInterestAreasOptions } from '../../utils/interestAreaNormalizer';
import { REJECTION_REASONS, STAGES_REQUIRING_APPLICATION } from '../../constants';

export default function TransitionModal({ transition, onClose, onConfirm, cities, interestAreas, schooling, marital, origins, jobs = [], applications = [], onCreateApplication, onOpenCreateJob }) {
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [linkedSuccess, setLinkedSuccess] = useState(false);

  const needsApplication = transition?.toStage && STAGES_REQUIRING_APPLICATION.includes(transition.toStage);
  const candidateApps = useMemo(() => (applications || []).filter(a => a.candidateId === transition?.candidate?.id), [applications, transition?.candidate?.id]);
  const hasApplication = candidateApps.length > 0;

  const filteredJobs = useMemo(() => {
    const list = (jobs || []).filter(j => (j.status === 'Aberta' || !j.status));
    if (!jobSearch.trim()) return list;
    const q = jobSearch.trim().toLowerCase();
    return list.filter(j => (j.title || '').toLowerCase().includes(q) || (j.company || '').toLowerCase().includes(q));
  }, [jobs, jobSearch]);

  const [data, setData] = useState(() => {
    const base = {
      feedback: '',
      returnSent: false,
    };
    // Pré-preenche campos obrigatórios com o que já existe no candidato (quando houver)
    (transition?.missingFields || []).forEach(field => {
      base[field] = transition?.candidate?.[field] || '';
    });
    return base;
  });

  const fieldLabels = {
    city: 'Cidade',
    hasLicense: 'Possui CNH',
    interestAreas: 'Áreas de Interesse',
    education: 'Formação',
    experience: 'Experiência Anterior',
    maritalStatus: 'Estado Civil',
    source: 'Onde encontrou',
    interview1Date: 'Data 1ª Entrevista',
    interview1Notes: 'Observações 1ª Entrevista',
    testResults: 'Resultado dos Testes',
    testNotes: 'Observações dos Testes',
    interview2Date: 'Data 2ª Entrevista',
    interview2Notes: 'Observações 2ª Entrevista',
    managerFeedback: 'Feedback do Gestor',
    returnSent: 'Retorno Dado ao Candidato',
    returnDate: 'Data do Retorno',
    returnNotes: 'Observações do Retorno',
    rejectionReason: 'Motivo da Rejeição'
  };

  const handleSave = () => {
    if (needsApplication && !hasApplication) {
      alert('Vincule o candidato a uma vaga antes de confirmar a mudança de etapa.');
      return;
    }
    for (let field of transition.missingFields) {
        if (!data[field] || data[field] === '') {
            alert(`O campo ${fieldLabels[field] || field} é obrigatório para esta etapa.`);
            return;
        }
    }

    if (transition.isConclusion && !data.feedback) {
      alert("O feedback/observação é obrigatório para encerrar o processo.");
      return;
    }

    if (transition.isConclusion && transition.toStage !== 'Desistiu da vaga' && !data.returnSent) {
       if(!confirm("Você não marcou que o retorno foi enviado. Deseja continuar mesmo assim?")) {
         return;
       }
    }
    
    // Normaliza campos antes de salvar
    const dataToSave = { ...data };
    if (dataToSave.city) {
      dataToSave.city = normalizeCity(dataToSave.city);
    }
    if (dataToSave.source) {
      dataToSave.source = normalizeSource(dataToSave.source);
    }
    if (dataToSave.interestAreas) {
      dataToSave.interestAreas = normalizeInterestAreasString(dataToSave.interestAreas);
    }
    
    onConfirm(dataToSave);
  };

  const renderInput = (field) => {
    const commonClass = "w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm focus:border-brand-orange outline-none";

    switch(field) {
        case 'city':
            return (
                <select className={commonClass} value={data.city} onChange={e => {
                  const value = normalizeCity(e.target.value);
                  setData({...data, city: value});
                }}>
                    <option value="">Selecione...</option>
                    <optgroup label="Cidades Principais">
                      {getMainCitiesOptions().map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                    {cities && cities.length > 0 && (
                      <optgroup label="Outras Cidades">
                        {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </optgroup>
                    )}
                </select>
            );
        case 'hasLicense':
            return (
                <select className={commonClass} value={data.hasLicense} onChange={e => setData({...data, hasLicense: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                </select>
            );
        case 'interestAreas':
             return (
                <select className={commonClass} value={data.interestAreas} onChange={e => {
                  const value = normalizeInterestAreasString(e.target.value);
                  setData({...data, interestAreas: value});
                }}>
                    <option value="">Selecione...</option>
                    <optgroup label="Áreas Principais">
                      {getMainInterestAreasOptions().map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                    </optgroup>
                    {interestAreas && interestAreas.length > 0 && (
                      <optgroup label="Outras Áreas">
                        {interestAreas.map(i => <option key={i.id} value={i.name}>{i.name}</option>)}
                      </optgroup>
                    )}
                </select>
            );
        case 'maritalStatus':
             return (
                <select className={commonClass} value={data.maritalStatus} onChange={e => setData({...data, maritalStatus: e.target.value})}>
                    <option value="">Selecione...</option>
                    {marital && marital.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
            );
        case 'source':
             return (
                <select className={commonClass} value={data.source} onChange={e => {
                  const value = normalizeSource(e.target.value);
                  setData({...data, source: value});
                }}>
                    <option value="">Selecione...</option>
                    <optgroup label="Origens Principais">
                      {getMainSourcesOptions().map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                    </optgroup>
                    {origins && origins.length > 0 && (
                      <optgroup label="Outras Origens">
                        {origins.map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                      </optgroup>
                    )}
                </select>
            );
        case 'experience':
        case 'interview1Notes':
        case 'interview2Notes':
        case 'testNotes':
        case 'returnNotes':
            return (
                <textarea 
                  className={commonClass + " h-20"} 
                  value={data[field] || ''} 
                  onChange={e => setData({...data, [field]: e.target.value})}
                  placeholder={field.includes('Notes') ? 'Descreva observações importantes...' : ''}
                />
            );
        case 'interview1Date':
        case 'interview2Date':
            return (
                <input 
                  type="datetime-local" 
                  className={commonClass} 
                  value={data[field] || ''} 
                  onChange={e => setData({...data, [field]: e.target.value})}
                />
            );
        case 'returnDate':
            return (
                <input 
                  type="date" 
                  className={commonClass} 
                  value={data[field] || ''} 
                  onChange={e => setData({...data, [field]: e.target.value})}
                />
            );
        case 'testResults':
            return (
                <select className={commonClass} value={data.testResults || ''} onChange={e => setData({...data, testResults: e.target.value})}>
                    <option value="">Selecione o resultado...</option>
                    <option value="Aprovado">✅ Aprovado</option>
                    <option value="Aprovado com ressalvas">⚠️ Aprovado com ressalvas</option>
                    <option value="Reprovado">❌ Reprovado</option>
                    <option value="Não aplicável">➖ Não aplicável</option>
                </select>
            );
        case 'returnSent':
            return (
                <select className={commonClass} value={data.returnSent || ''} onChange={e => setData({...data, returnSent: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="Sim">✅ Sim, retorno dado</option>
                    <option value="Não">❌ Não, ainda não dado</option>
                    <option value="Pendente">⏳ Pendente</option>
                </select>
            );
        case 'managerFeedback':
            // Campo obrigatório para Entrevista II
            return (
                <div>
                    <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">
                        Feedback do Gestor *
                    </label>
                    <textarea 
                        required
                        className="w-full bg-background border-2 border-blue-300 dark:border-blue-700 rounded p-3 text-sm text-foreground outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-32" 
                        placeholder="Digite o feedback do gestor sobre a primeira entrevista..."
                        value={data.managerFeedback || ''} 
                        onChange={e => setData({...data, managerFeedback: e.target.value})}
                    />
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Campo obrigatório para avançar para Entrevista II</p>
                </div>
            );
        case 'rejectionReason':
            // Campo obrigatório para Reprovado
            if (transition.toStage === 'Reprovado') {
                return (
                    <div>
                        <label className="block text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-1.5">
                            Motivo da Rejeição *
                        </label>
                        <select
                            required
                            className="w-full bg-background border-2 border-red-300 dark:border-red-700 rounded p-3 text-sm text-foreground outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            value={data.rejectionReason || ''}
                            onChange={e => setData({...data, rejectionReason: e.target.value})}
                        >
                            <option value="">Selecione o motivo...</option>
                            {REJECTION_REASONS.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">Campo obrigatório para reprovar candidato</p>
                    </div>
                );
            }
            return null;
        default:
            return (
                <input className={commonClass} value={data[field] || ''} onChange={e => setData({...data, [field]: e.target.value})} />
            );
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-brand-card rounded-lg shadow-2xl w-full max-w-md border border-brand-orange animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-brand-border flex justify-between items-center bg-brand-orange/10">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-brand-orange" />
            Requisitos da Etapa
          </h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white" /></button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Primeiro: vincular/criar vaga quando a etapa exige — em destaque no topo */}
          {needsApplication && !hasApplication && (
            <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <Briefcase size={18} /> Vincule a uma vaga (ou crie uma nova)
              </p>
              <p className="text-xs text-slate-300">Esta etapa exige vaga vinculada. Selecione abaixo e clique em Vincular, ou crie uma nova vaga.</p>
              <input
                type="text"
                placeholder="Buscar vaga por título ou empresa..."
                value={jobSearch}
                onChange={e => setJobSearch(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm placeholder-slate-400"
              />
              <select
                value={selectedJobId}
                onChange={e => setSelectedJobId(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm"
              >
                <option value="">Selecione uma vaga...</option>
                {filteredJobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title} – {j.company}</option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  disabled={!selectedJobId || !onCreateApplication}
                  onClick={async () => {
                    if (!selectedJobId || !onCreateApplication || !transition?.candidate?.id) return;
                    const ok = await onCreateApplication(transition.candidate.id, selectedJobId);
                    if (ok) {
                      setLinkedSuccess(true);
                      setSelectedJobId('');
                    }
                  }}
                  className="px-3 py-1.5 bg-brand-orange text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600"
                >
                  Vincular
                </button>
                {onOpenCreateJob && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateJob()}
                    className="px-3 py-1.5 bg-brand-dark border border-brand-cyan text-brand-cyan rounded text-sm font-medium hover:bg-brand-cyan/10 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Criar nova vaga
                  </button>
                )}
              </div>
              {linkedSuccess && <p className="text-xs text-green-400">Vaga vinculada. Você pode confirmar a mudança de etapa abaixo.</p>}
            </div>
          )}

          <p className="text-sm text-slate-300">
            Movendo <strong>{transition.candidate.fullName}</strong> para <strong className="text-brand-cyan">{transition.toStage}</strong>.
          </p>

          {/* Mostrar dados relevantes do candidato */}
          {transition.candidate.city && (
            <div className="bg-brand-dark/50 border border-brand-border p-3 rounded text-xs">
              <p className="text-slate-400">📍 Cidade: <span className="text-brand-cyan font-bold">{transition.candidate.city}</span></p>
            </div>
          )}

          {transition.missingFields.length > 0 && (
             <div className="bg-red-500/10 border border-red-500/30 p-3 rounded text-xs text-red-200 mb-2">
                Preencha os dados obrigatórios abaixo para continuar.
             </div>
          )}

          {transition.missingFields.map(field => (
            <div key={field}>
              <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">{fieldLabels[field] || field} *</label>
              {renderInput(field)}
            </div>
          ))}

          {transition.isConclusion && (
            <div className="space-y-4 pt-4 border-t border-brand-border mt-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded text-xs text-yellow-200">
                <strong>⚠️ Fechamento do Processo:</strong> Preencha os dados abaixo para concluir o processo seletivo.
              </div>
              
              {/* Campo específico por tipo de fechamento */}
              {transition.toStage === 'Contratado' && (
                <div>
                  <label className="block text-xs font-bold text-green-400 uppercase mb-1.5">
                    ✅ Motivo da Contratação / Observações *
                  </label>
                  <textarea 
                    className="w-full bg-brand-dark border border-green-500/50 p-2 rounded text-white text-sm h-24 focus:border-green-500 outline-none"
                    placeholder="Descreva o motivo da contratação, pontos fortes do candidato, salário acordado, data de início, etc..."
                    value={data.feedback}
                    onChange={e => setData({...data, feedback: e.target.value})}
                  />
                </div>
              )}
              
              {transition.toStage === 'Reprovado' && (
                <div>
                  <label className="block text-xs font-bold text-red-400 uppercase mb-1.5">
                    ❌ Motivo da Reprovação *
                  </label>
                  <textarea 
                    className="w-full bg-brand-dark border border-red-500/50 p-2 rounded text-white text-sm h-24 focus:border-red-500 outline-none"
                    placeholder="Descreva o motivo da reprovação (ex: não atendeu requisitos técnicos, perfil não adequado, etc.)..."
                    value={data.feedback}
                    onChange={e => setData({...data, feedback: e.target.value})}
                  />
                </div>
              )}
              
              {transition.toStage === 'Desistiu da vaga' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">
                    ⏸️ Motivo da Desistência *
                  </label>
                  <textarea 
                    className="w-full bg-brand-dark border border-gray-500/50 p-2 rounded text-white text-sm h-24 focus:border-gray-500 outline-none"
                    placeholder="Descreva o motivo da desistência (ex: candidato desistiu, não respondeu contatos, etc.)..."
                    value={data.feedback}
                    onChange={e => setData({...data, feedback: e.target.value})}
                  />
                </div>
              )}
              
              {/* Campo genérico se não for um dos três acima */}
              {!['Contratado', 'Reprovado', 'Desistiu da vaga'].includes(transition.toStage) && (
                <div>
                  <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Feedback / Observação *</label>
                  <textarea 
                    className="w-full bg-brand-dark border border-brand-border p-2 rounded text-white text-sm h-24 focus:border-brand-orange outline-none"
                    placeholder="Descreva o motivo do fechamento..."
                    value={data.feedback}
                    onChange={e => setData({...data, feedback: e.target.value})}
                  />
                </div>
              )}
              
              {/* Desistência: apenas motivo (feedback acima); sem retorno obrigatório */}
              {transition.toStage !== 'Desistiu da vaga' && (
              <>
              <div>
                <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Retorno Dado ao Candidato *</label>
                {renderInput('returnSent')}
                <p className="text-xs text-slate-400 mt-1">
                  Confirme se o candidato foi informado sobre o resultado do processo
                </p>
              </div>
              
              {data.returnSent === 'Sim' && (
                <div>
                  <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Data do Retorno</label>
                  {renderInput('returnDate')}
                </div>
              )}
              
              {data.returnSent && (
                <div>
                  <label className="block text-xs font-bold text-brand-cyan uppercase mb-1.5">Observações do Retorno</label>
                  {renderInput('returnNotes')}
                </div>
              )}
              </>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-brand-dark/50 flex justify-end gap-2 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white rounded text-sm">Cancelar</button>
          <button onClick={handleSave} className="bg-brand-orange text-white px-4 py-2 rounded text-sm font-bold hover:bg-orange-600 flex items-center gap-2">
            <Save size={16} /> Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}