import React, { useState, useMemo } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

const MasterDataManager = ({ collection, title, fields, items, onSave, onDelete, onShowToast, options = {} }) => {
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({});
    const [search, setSearch] = useState('');

    const filteredItems = useMemo(() => {
        if (!search) return items;
        const s = search.toLowerCase();
        return items.filter(item =>
            fields.some(f => {
                const value = item[f.key] || '';
                return String(value).toLowerCase().includes(s);
            })
        );
    }, [items, search, fields]);

    const handleSave = async () => {
        if (!formData[fields[0].key]) {
            onShowToast('Preencha os campos obrigatórios', 'error');
            return;
        }
        const payload = editing?.id ? { ...formData, id: editing.id } : formData;
        await onSave(collection, payload, () => {
            setEditing(null);
            setFormData({});
        });
    };

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">{title}</h2>
                <button
                    onClick={() => { setEditing({}); setFormData({}); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={18} /> Novo
                </button>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full max-w-md bg-card border border-input rounded-lg px-4 py-2 text-foreground"
                />
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                            {fields.map(f => (
                                <th key={f.key} className="px-4 py-3 text-left font-semibold text-muted-foreground">
                                    {f.label} {f.required && <span className="text-red-500">*</span>}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                {fields.map(f => (
                                    <td key={f.key} className="px-4 py-3 text-foreground">
                                        {f.optionsKey && options[f.optionsKey]
                                            ? (options[f.optionsKey].find(o => o.id === item[f.key])?.name ?? '-')
                                            : (item[f.key] ?? '-')}
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right">
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => { setEditing(item); setFormData(item); }}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Tem certeza que deseja excluir?')) {
                                                    onDelete(collection, item.id);
                                                }
                                            }}
                                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-md border border-border">
                        <div className="p-6 border-b border-border">
                            <h3 className="text-lg font-bold text-foreground">
                                {editing.id ? 'Editar' : 'Novo'} {title}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {fields.map(f => (
                                <div key={f.key}>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        {f.label} {f.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {f.type === 'select' && f.optionsKey && options[f.optionsKey] ? (
                                        <select
                                            value={formData[f.key] || ''}
                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value || null })}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                                        >
                                            <option value="">— Selecionar —</option>
                                            {options[f.optionsKey].map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData[f.key] || ''}
                                            onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground"
                                            required={f.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-border flex justify-end gap-2">
                            <button
                                onClick={() => { setEditing(null); setFormData({}); }}
                                className="px-4 py-2 text-muted-foreground hover:text-gray-800 dark:hover:text-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterDataManager;
