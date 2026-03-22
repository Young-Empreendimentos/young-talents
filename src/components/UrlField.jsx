import React, { useState, useEffect } from 'react';
import { Check, X, ExternalLink, Edit3, FileText } from 'lucide-react';

const UrlField = ({ label, field, value, onChange, placeholder = "Cole a URL aqui..." }) => {
    const [isEditing, setIsEditing] = useState(!value);
    const [editValue, setEditValue] = useState(value || '');

    useEffect(() => {
        setEditValue(value || '');
        setIsEditing(!value);
    }, [value]);

    const handleSave = () => {
        onChange(field, editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(value || '');
        setIsEditing(false);
    };

    const isValidUrl = (url) => {
        if (!url) return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    if (isEditing) {
        return (
            <div className="mb-3">
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{label}</label>
                <div className="flex gap-2">
                    <input
                        type="url"
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-input p-2.5 rounded-lg text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        placeholder={placeholder}
                        onKeyPress={e => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                    />
                    <button
                        onClick={handleSave}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
                        title="Salvar"
                    >
                        <Check size={16} />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-muted-foreground rounded-lg text-sm font-medium transition-colors"
                        title="Cancelar"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mb-3">
            <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                {value && isValidUrl(value) ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:underline truncate transition-colors"
                        title={`Clique para abrir | Botão direito para copiar: ${value}`}
                        onContextMenu={(e) => {
                            // Permite copiar URL com botão direito (comportamento nativo do navegador)
                            // O usuário pode clicar com botão direito e escolher "Copiar endereço do link"
                        }}
                    >
                        <span className="flex items-center gap-2">
                            <ExternalLink size={14} className="flex-shrink-0" />
                            <span className="truncate">{value.length > 50 ? value.substring(0, 50) + '...' : value}</span>
                        </span>
                    </a>
                ) : value ? (
                    <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-input rounded-lg text-sm text-muted-foreground truncate">
                        {value.length > 50 ? value.substring(0, 50) + '...' : value}
                    </div>
                ) : (
                    <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-input rounded-lg text-sm text-gray-400 dark:text-gray-500 italic">
                        Nenhum link cadastrado
                    </div>
                )}
                <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-muted-foreground rounded-lg text-sm font-medium transition-colors"
                    title="Editar URL"
                >
                    <Edit3 size={16} />
                </button>
                {value && (
                    <button
                        onClick={async (e) => {
                            e.stopPropagation();
                            try {
                                await navigator.clipboard.writeText(value);
                                // Feedback visual temporário
                                const btn = e.currentTarget;
                                const originalText = btn.title;
                                btn.title = 'URL copiada!';
                                btn.className = btn.className.replace('bg-gray-200 dark:bg-gray-700', 'bg-green-500 dark:bg-green-600').replace('text-muted-foreground', 'text-white');
                                setTimeout(() => {
                                    btn.title = originalText;
                                    btn.className = btn.className.replace('bg-green-500 dark:bg-green-600', 'bg-gray-200 dark:bg-gray-700').replace('text-white', 'text-muted-foreground');
                                }, 2000);
                            } catch (err) {
                                alert('Erro ao copiar URL. Use o botão direito do mouse no link.');
                            }
                        }}
                        className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-muted-foreground rounded-lg text-sm font-medium transition-colors"
                        title="Copiar URL"
                    >
                        <FileText size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default UrlField;
