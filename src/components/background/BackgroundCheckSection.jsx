import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldCheck, Paperclip, Download, Trash2, Loader2, Save, FileText } from 'lucide-react';
import { supabase } from '../../supabase';
import { rh, currentUserInfo } from '../../utils/tests';

const BG_STATUSES = ['Pendente', 'Nada consta', 'Encontrado algo'];
const BG_STATUS_STYLES = {
  'Pendente': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'Nada consta': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'Encontrado algo': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};
const BUCKET = 'candidate-documents';

// Seção "Pesquisa de antecedentes" dentro do candidato (perfil + modal).
// 1 registro por candidato. Anexos em bucket PRIVADO (download por signed URL).
export default function BackgroundCheckSection({ candidate, showToast, className = 'bg-card border border-border rounded-xl p-5' }) {
  const [rec, setRec] = useState(null);
  const [status, setStatus] = useState('Pendente');
  const [notes, setNotes] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    if (!supabase || !candidate?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await rh(supabase).from('talents_background_checks').select('*').eq('candidate_id', candidate.id).maybeSingle();
      setRec(data || null);
      setStatus(data?.status || 'Pendente');
      setNotes(data?.notes || '');
      setCheckDate(data?.check_date || '');
      setAttachments(Array.isArray(data?.attachments) ? data.attachments : []);
    } catch {
      setRec(null);
    } finally {
      setLoading(false);
    }
  }, [candidate?.id]);

  useEffect(() => { load(); }, [load]);

  // grava (insert ou update) e devolve o registro salvo
  const persist = async (fields) => {
    const row = {
      candidate_id: candidate.id,
      status: fields.status ?? status,
      notes: (fields.notes ?? notes) || null,
      check_date: (fields.checkDate ?? checkDate) || null,
      attachments: fields.attachments ?? attachments,
    };
    if (rec?.id) {
      const { data, error } = await rh(supabase).from('talents_background_checks')
        .update({ ...row, updated_at: new Date().toISOString() }).eq('id', rec.id).select('*').single();
      if (error) throw error;
      setRec(data);
      return data;
    }
    const me = await currentUserInfo(supabase);
    const { data, error } = await rh(supabase).from('talents_background_checks')
      .insert({ ...row, created_by: me.email, created_by_name: me.name }).select('*').single();
    if (error) throw error;
    setRec(data);
    return data;
  };

  const handleSave = async () => {
    setSaving(true);
    try { await persist({}); showToast?.('Pesquisa de antecedentes salva.', 'success'); }
    catch (e) { showToast?.(e?.message || 'Erro ao salvar.', 'error'); }
    finally { setSaving(false); }
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `antecedentes/${candidate.id}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const next = [...attachments, { name: file.name, path }];
      setAttachments(next);
      await persist({ attachments: next });
      showToast?.('Anexo adicionado.', 'success');
    } catch (e) {
      showToast?.(e?.message || 'Erro ao enviar o anexo.', 'error');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDownload = async (att) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(att.path, 120);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener');
    } catch (e) {
      showToast?.(e?.message || 'Erro ao abrir o anexo.', 'error');
    }
  };

  const handleRemoveAtt = async (att) => {
    if (!window.confirm(`Remover o anexo "${att.name}"?`)) return;
    try {
      await supabase.storage.from(BUCKET).remove([att.path]);
      const next = attachments.filter(a => a.path !== att.path);
      setAttachments(next);
      await persist({ attachments: next });
      showToast?.('Anexo removido.', 'success');
    } catch (e) {
      showToast?.(e?.message || 'Erro ao remover o anexo.', 'error');
    }
  };

  const inputCls = 'w-full text-sm border border-input rounded px-2.5 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-brand-orange';

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={13} /> Pesquisa de antecedentes
        </p>
        {!loading && status && <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${BG_STATUS_STYLES[status] || ''}`}>{status}</span>}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 size={14} className="animate-spin" /> Carregando…</div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
              <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
                {BG_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Data da pesquisa</label>
              <input type="date" className={inputCls} value={checkDate} onChange={e => setCheckDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Observações / o que foi encontrado</label>
            <textarea className={inputCls + ' h-20'} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex.: Nada consta nas certidões; ou descreva o que foi encontrado..." />
          </div>

          {/* Anexos */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Anexos ({attachments.length})</label>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs text-young-orange hover:underline flex items-center gap-1 disabled:opacity-50">
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={12} />} Adicionar anexo
              </button>
              <input ref={fileRef} type="file" className="hidden" onChange={e => handleUpload(e.target.files?.[0])} />
            </div>
            {attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum anexo.</p>
            ) : (
              <div className="space-y-1">
                {attachments.map(att => (
                  <div key={att.path} className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-border bg-background group">
                    <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                    <button onClick={() => handleDownload(att)} className="text-xs text-foreground hover:text-brand-orange truncate flex-1 text-left" title="Baixar">{att.name}</button>
                    <button onClick={() => handleDownload(att)} className="p-1 text-muted-foreground hover:text-brand-orange" title="Baixar"><Download size={13} /></button>
                    <button onClick={() => handleRemoveAtt(att)} className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">{rec?.createdByName ? `Registrado por ${rec.createdByName}` : ''}</span>
            <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-brand-orange rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1.5">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
