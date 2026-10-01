import React, { useMemo, useState } from 'react';
import { MapPin, Plus, Trash2, Pencil, Loader2, ShieldCheck, Clock } from 'lucide-react';
import {
  NIVEIS, MAPPING_STATUSES, nivelEfetivo, niveisDisponiveis, mappingLabel, agruparPorTrilha, ORDEM_NIVEL,
} from '../../utils/mappings';
import CidadeSelect from '../ui/CidadeSelect';

const inputCls = 'w-full text-xs border border-input rounded px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-brand-orange';

// city = rótulo "Nome/UF"; cidadeIbge = código (vazio = qualquer cidade);
// cidadeTexto = texto livre a converter (ex.: a cidade do candidato).
const VAZIO = { funcaoId: '', equipeId: '', especificacao: '', city: '', cidadeIbge: null, cidadeTexto: '', nivel: 'interessante', notes: '' };

// Aprovação da alternativa externa vale 6 meses (mesma regra do Pilares).
const venceEm = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 6);
  d.setDate(Math.min(dia, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
};
const fmt = (d) => d.toLocaleDateString('pt-BR');

export function NivelBadge({ nivel, className = '' }) {
  const n = NIVEIS[nivel] || NIVEIS.interessante;
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${n.badge} ${className}`} title={n.hint}>
      {n.label}
    </span>
  );
}

/** Situação da alternativa externa (só chega aqui para o admin da sucessão). */
export function AlternativaInfo({ alternativa }) {
  if (!alternativa) return null;
  const venc = venceEm(alternativa.aprovadoEm);
  if (!venc) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-violet-700 dark:text-violet-300">
        <Clock size={11} /> aguardando aprovação no plano de sucessão
      </span>
    );
  }
  const valida = venc >= new Date();
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${valida ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      <ShieldCheck size={11} />
      {valida ? `aprovada até ${fmt(venc)}` : `aprovação vencida em ${fmt(venc)} — revalidar no Pilares`}
    </span>
  );
}

export const mappingVazio = (extra = {}) => ({ ...VAZIO, ...extra });

/** Mensagem do que falta, ou '' se o mapeamento pode ser salvo. */
export function problemaMapeamento(f) {
  if (!f.funcaoId && !f.especificacao?.trim()) return 'Escolha a função ou descreva no texto livre.';
  if (f.nivel === 'alternativa' && !f.funcaoId) return 'Alternativa externa exige função.';
  return '';
}

/** Campos do mapeamento, controlados — o formulário e o arquivamento usam. */
export function MappingFields({ value: f, onChange, mapeamento, compact = false }) {
  const { funcoes = [], equipes = [], adminSucessao } = mapeamento || {};
  const set = (k, v) => onChange({ ...f, [k]: v });
  const grupos = useMemo(() => agruparPorTrilha(funcoes), [funcoes]);
  const niveis = niveisDisponiveis(adminSucessao);

  return (
    <>
      <div className={`grid grid-cols-1 ${compact ? '' : 'sm:grid-cols-2'} gap-2`}>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Função</label>
          <select value={f.funcaoId} onChange={e => set('funcaoId', e.target.value)} className={inputCls}>
            <option value="">— Sem função (só texto livre) —</option>
            {grupos.map(([trilha, itens]) => (
              <optgroup key={trilha} label={trilha}>
                {itens.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Equipe / área <span className="opacity-60">(opcional)</span></label>
          <select value={f.equipeId} onChange={e => set('equipeId', e.target.value)} className={inputCls}>
            <option value="">Qualquer equipe</option>
            {equipes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <div className={compact ? '' : 'sm:col-span-2'}>
          <label className="block text-xs text-muted-foreground mb-1">Especificação <span className="opacity-60">(texto livre)</span></label>
          <input
            value={f.especificacao}
            onChange={e => set('especificacao', e.target.value)}
            placeholder="Ex.: Assistente de compras, foco em obra"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Cidade <span className="opacity-60">(vazia = qualquer)</span></label>
          {/* Atualização funcional: a conversão do texto inicial chega depois, e
              não pode apagar o que a pessoa já digitou nos outros campos. */}
          <CidadeSelect
            value={f.cidadeIbge}
            label={f.city}
            textoInicial={f.cidadeTexto}
            onChange={(codigo, rotulo) => onChange(prev => ({ ...prev, cidadeIbge: codigo, city: rotulo }))}
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nível de interesse</label>
          <select value={f.nivel} onChange={e => set('nivel', e.target.value)} className={inputCls}>
            {niveis.map(n => <option key={n} value={n}>{NIVEIS[n].label} — {NIVEIS[n].hint}</option>)}
          </select>
        </div>
      </div>

      {f.nivel === 'alternativa' && (
        <p className="text-[11px] text-violet-700 dark:text-violet-300">
          Visível só para admin do Pilares. Entra no plano de sucessão da função e conta como cobertura
          parcial depois de aprovada lá. Para os demais usuários, aparece como "Forte".
        </p>
      )}

      <textarea
        value={f.notes}
        onChange={e => set('notes', e.target.value)}
        placeholder="Observações (ex.: excelente perfil técnico, aguardar vaga no Q3...)"
        rows={2}
        className={`${inputCls} py-2 resize-none`}
      />
    </>
  );
}

/**
 * Formulário de mapeamento: função + equipe + texto livre, cidade, nível e
 * observações. Usado no modal e no perfil.
 */
export function MappingForm({ mapeamento, initial, onSubmit, onCancel, saving, submitLabel = 'Mapear', compact = false }) {
  const [f, setF] = useState(() => mappingVazio(initial));
  const problema = problemaMapeamento(f);

  return (
    <div className="p-3 bg-muted rounded-lg space-y-3 border border-border">
      <MappingFields value={f} onChange={setF} mapeamento={mapeamento} compact={compact} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-amber-700 dark:text-amber-400">{problema}</p>
        <div className="flex gap-2">
          {onCancel && <button onClick={onCancel} className="text-xs px-3 py-1.5 text-muted-foreground hover:text-foreground">Cancelar</button>}
          <button
            onClick={() => onSubmit(f)}
            disabled={saving || !!problema}
            className="text-xs px-4 py-1.5 bg-brand-orange text-white rounded disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Bloco "Mapeamento de interesse" do candidato: lista + formulário.
 * `formOpen`/`onFormOpenChange` são opcionais — o perfil abre o formulário por
 * um botão do cabeçalho.
 */
export default function MappingSection({ candidate, mapeamento, formOpen, onFormOpenChange, className = '' }) {
  const [openLocal, setOpenLocal] = useState(false);
  const aberto = formOpen ?? openLocal;
  const setAberto = onFormOpenChange ?? setOpenLocal;
  const [editando, setEditando] = useState(null); // id do mapeamento em edição
  const [saving, setSaving] = useState(false);

  const { mappings = [], add, update, updateStatus, remove } = mapeamento || {};
  const doCandidato = useMemo(() =>
    mappings
      .filter(m => m.candidateId === candidate.id)
      .sort((a, b) =>
        (a.status === 'Ativo' ? 0 : 1) - (b.status === 'Ativo' ? 0 : 1)
        || ORDEM_NIVEL[nivelEfetivo(a)] - ORDEM_NIVEL[nivelEfetivo(b)]
        || new Date(b.createdAt) - new Date(a.createdAt)),
    [mappings, candidate.id],
  );
  const ativos = doCandidato.filter(m => m.status === 'Ativo').length;

  const salvarNovo = async (f) => {
    setSaving(true);
    const ok = await add({ ...f, candidateId: candidate.id });
    setSaving(false);
    if (ok) setAberto(false);
  };

  const salvarEdicao = async (m, f) => {
    // Rebaixar uma alternativa tira a pessoa do plano de sucessão — confirmar.
    if (m.alternativa && f.nivel !== 'alternativa'
      && !window.confirm('Isso tira a pessoa do plano de sucessão da função (e descarta a aprovação). Continuar?')) return;
    setSaving(true);
    const ok = await update(m.id, {
      funcaoId: f.funcaoId, equipeId: f.equipeId, especificacao: f.especificacao,
      city: f.city, cidadeIbge: f.cidadeIbge, notes: f.notes, nivel: f.nivel,
    });
    setSaving(false);
    if (ok) setEditando(null);
  };

  return (
    <div className={`border border-brand-orange/25 rounded-lg p-4 bg-brand-orange/[0.03] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={13} className="text-brand-orange" /> Mapeamento de interesse
          {ativos > 0 && (
            <span className="bg-brand-orange/10 text-brand-orange px-1.5 py-0.5 rounded-full text-[10px] font-bold">
              {ativos} ativo{ativos !== 1 ? 's' : ''}
            </span>
          )}
        </p>
        {add && !aberto && (
          <button onClick={() => { setEditando(null); setAberto(true); }} className="text-xs text-brand-orange hover:underline flex items-center gap-1 font-medium">
            <Plus size={12} /> Mapear
          </button>
        )}
      </div>

      {aberto && (
        <div className="mb-3">
          <MappingForm
            mapeamento={mapeamento}
            initial={{ cidadeTexto: candidate.city || '' }}
            onSubmit={salvarNovo}
            onCancel={() => setAberto(false)}
            saving={saving}
          />
        </div>
      )}

      {doCandidato.length === 0 ? (
        !aberto && (
          <p className="text-sm text-muted-foreground italic">
            Nenhum mapeamento. Use "Mapear" para guardar este candidato para futuras vagas.
          </p>
        )
      ) : (
        <div className="space-y-1.5">
          {doCandidato.map(m => {
            const nivel = nivelEfetivo(m);
            const label = mappingLabel(m, mapeamento);
            if (editando === m.id) {
              return (
                <MappingForm
                  key={m.id}
                  mapeamento={mapeamento}
                  initial={{
                    funcaoId: m.funcaoId || '', equipeId: m.equipeId || '', especificacao: m.especificacao || '',
                    city: m.cidadeIbge ? (m.city || '') : '', cidadeIbge: m.cidadeIbge || null,
                    cidadeTexto: m.cidadeIbge ? '' : (m.city || ''), nivel, notes: m.notes || '',
                  }}
                  onSubmit={f => salvarEdicao(m, f)}
                  onCancel={() => setEditando(null)}
                  saving={saving}
                  submitLabel="Salvar"
                />
              );
            }
            return (
              <div key={m.id} className={`flex gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-background group ${m.status !== 'Ativo' ? 'opacity-60' : ''}`}>
                <MapPin size={13} className="text-brand-orange mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className={`text-sm font-medium ${m.funcaoId ? 'text-foreground' : 'text-amber-700 dark:text-amber-400'}`}>
                        {label || 'Função não definida'}
                      </span>
                      {!m.funcaoId && label && <span className="text-[10px] text-amber-700 dark:text-amber-400">(sem função)</span>}
                      {m.city && <span className="text-xs text-muted-foreground">— {m.city}</span>}
                      <NivelBadge nivel={nivel} />
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {updateStatus ? (
                        <select
                          value={m.status}
                          onChange={e => updateStatus(m.id, e.target.value)}
                          className="text-[10px] bg-muted text-foreground rounded px-1.5 py-0.5 border-0 outline-none cursor-pointer"
                        >
                          {MAPPING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted">{m.status}</span>
                      )}
                      {update && (
                        <button onClick={() => { setAberto(false); setEditando(m.id); }} className="p-1 text-muted-foreground hover:text-foreground" title="Editar">
                          <Pencil size={12} />
                        </button>
                      )}
                      {remove && (
                        <button
                          onClick={() => {
                            const aviso = m.alternativa ? '\n\nEle também sai do plano de sucessão da função.' : '';
                            if (window.confirm(`Remover este mapeamento?${aviso}`)) remove(m.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-red-500"
                          title="Remover"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  {m.alternativa && <div className="mt-0.5"><AlternativaInfo alternativa={m.alternativa} /></div>}
                  {m.notes && <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">{m.notes}</p>}
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {m.mappedByName ? `por ${m.mappedByName} · ` : ''}{m.createdAt ? new Date(m.createdAt).toLocaleDateString('pt-BR') : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
