import React from 'react';
import { User, Phone, MapPin, Calendar, Heart, Users, Camera, Copy, Check, ExternalLink, AlertCircle, Car } from 'lucide-react';
import { CHILDREN_OPTIONS, formatChildrenForDisplay, normalizeChildrenForStorage } from '../../../utils/childrenNormalizer';
import { copyToClipboard } from '../../../utils/urlUtils';

export default function PersonalTab({
    candidate,
    editData,
    isEditing,
    handleFieldChange,
    formatDate,
    photoLoadError = false
}) {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = async (text) => {
        const success = await copyToClipboard(text);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    return (
        <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <User size={20} />
                Informações Pessoais
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        Data de Nascimento
                    </label>
                    {isEditing ? (
                        <input
                            type="date"
                            value={editData.birthDate || ''}
                            onChange={(e) => handleFieldChange('birthDate', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    ) : (
                        <p className="text-foreground">{candidate.birthDate ? formatDate(candidate.birthDate) : 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Idade
                    </label>
                    {isEditing ? (
                        <input
                            type="number"
                            value={editData.age || ''}
                            onChange={(e) => handleFieldChange('age', e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            min="0"
                            max="120"
                        />
                    ) : (
                        <p className="text-foreground">{candidate.age ? `${candidate.age} anos` : 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Car size={16} className="text-gray-400" />
                        CNH (tipo B) <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                        <select
                            value={editData.hasLicense || ''}
                            onChange={(e) => handleFieldChange('hasLicense', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                        </select>
                    ) : (
                        <p className={`font-medium ${candidate.hasLicense === 'Sim' ? 'text-green-600 dark:text-green-400' : candidate.hasLicense === 'Não' ? 'text-foreground' : 'text-amber-600 dark:text-amber-400'}`}>
                            {candidate.hasLicense === 'Sim' ? 'Sim' : candidate.hasLicense === 'Não' ? 'Não' : 'Não informado — preencha na edição'}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Heart size={16} className="text-gray-400" />
                        Estado Civil
                    </label>
                    {isEditing ? (
                        <select
                            value={editData.maritalStatus || ''}
                            onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione</option>
                            <option value="Solteiro(a)">Solteiro(a)</option>
                            <option value="Casado(a)">Casado(a)</option>
                            <option value="Divorciado(a)">Divorciado(a)</option>
                            <option value="Viúvo(a)">Viúvo(a)</option>
                            <option value="União Estável">União Estável</option>
                            <option value="Namorando">Namorando</option>
                        </select>
                    ) : (
                        <p className="text-foreground">{candidate.maritalStatus || 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        Número de Filhos
                    </label>
                    {isEditing ? (
                        <select
                            value={editData.childrenCount != null && editData.childrenCount !== '' ? normalizeChildrenForStorage(editData.childrenCount) : ''}
                            onChange={(e) => handleFieldChange('childrenCount', e.target.value === '' ? '' : normalizeChildrenForStorage(e.target.value))}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">Selecione</option>
                            {CHILDREN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                        <p className="text-foreground">{formatChildrenForDisplay(candidate.childrenCount) || 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Camera size={16} className="text-gray-400" />
                        URL da Foto
                    </label>
                    {isEditing ? (
                        <input
                            type="url"
                            value={editData.photoUrl || ''}
                            onChange={(e) => handleFieldChange('photoUrl', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="https://..."
                        />
                    ) : (
                        candidate.photoUrl ? (
                            <div className="flex items-center gap-2">
                                <a
                                    href={candidate.photoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px] flex items-center gap-1"
                                >
                                    Abrir Link <ExternalLink size={12} />
                                </a>
                                {photoLoadError && (
                                    <span
                                        className="inline-flex text-amber-600 dark:text-amber-500"
                                        title="Link da foto indisponível ou bloqueado – verifique acesso ao Drive/link"
                                    >
                                        <AlertCircle size={14} />
                                    </span>
                                )}
                                <button
                                    onClick={() => handleCopy(candidate.photoUrl)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Copiar URL"
                                >
                                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">Não informado</p>
                        )
                    )}
                </div>

                <div className="md:col-span-2 pt-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Informações Adicionais / Bio
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editData.freeField || ''}
                            onChange={(e) => handleFieldChange('freeField', e.target.value)}
                            rows={4}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Conte mais sobre o candidato..."
                        />
                    ) : (
                        <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
                            {candidate.freeField || 'Não informado.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
