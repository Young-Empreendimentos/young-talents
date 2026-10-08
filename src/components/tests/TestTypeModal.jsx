import React, { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { rh, currentUserInfo } from '../../utils/tests';

// Modal para a Carla cadastrar/editar um TIPO de teste.
export default function TestTypeModal({ supabase, initial = null, onSaved, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [active, setActive] = useState(initial?.active !== false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    if (!name.trim()) { setError('Dê um nome ao tipo de teste.'); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), category: category.trim() || null, description: description.trim() || null, active };
      let saved;
      if (initial?.id) {
        const { data, error } = await rh(supabase).from('talents_test_types').update(payload).eq('id', initial.id).select('*').single();
        if (error) throw error;
        saved = data;
      } else {
        const me = await currentUserInfo(supabase);
        const { data, error } = await rh(supabase).from('talents_test_types').insert({ ...payload, created_by: me.email }).select('*').single();
        if (error) throw error;
        saved = data;
      }
      onSaved?.(saved);
    } catch (e) {
      setError(e?.message || 'Erro ao salvar.');
      setSaving(false);
    }
  };

  const inputCls = 'w-full text-sm border border-input rounded px-2.5 py-2 bg-background text-foreground outline-none focus:ring-1 focus:ring-brand-orange';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md border border-border">
        <div className="px-5 py-4 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-foreground">{initial?.id ? 'Editar tipo de teste' : 'Novo tipo de teste'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded"><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Nome *</label>
            <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Teste de Lógica, Excel, DISC..." autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Categoria</label>
            <input className={inputCls} value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex.: Técnico, Comportamental (opcional)" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Descrição</label>
            <textarea className={inputCls + ' h-20'} value={description} onChange={e => setDescription(e.target.value)} placeholder="O que esse teste avalia (opcional)..." />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            Ativo (aparece na lista ao registrar)
          </label>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-brand-orange rounded hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
