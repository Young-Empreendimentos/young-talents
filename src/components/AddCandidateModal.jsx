import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import PhotoUpload from './ui/PhotoUpload';
import { PIPELINE_STAGES } from '../constants';

const INTEREST_AREAS_OPTIONS = [
    'Administrativo', 'Comercial', 'Financeiro', 'Jurídico', 'Logística',
    'Marketing', 'Operacional', 'Recursos Humanos', 'TI / Tecnologia', 'Outro',
];

const SCHOOLING_OPTIONS = [
    'Ensino Fundamental Incompleto', 'Ensino Fundamental Completo',
    'Ensino Médio Incompleto', 'Ensino Médio Completo',
    'Ensino Superior Incompleto', 'Ensino Superior Completo',
    'Pós-graduação', 'Mestrado', 'Doutorado',
];

export default function AddCandidateModal({ onClose, onSave, isSaving, interestAreas = [] }) {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        city: '',
        photoUrl: '',
        interestAreas: '',
        schoolingLevel: '',
        experience: '',
        status: 'Considerado',
        source: 'Cadastro Manual',
    });
    const [errors, setErrors] = useState({});

    const set = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Nome obrigatório';
        if (!form.email.trim()) e.email = 'E-mail obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'E-mail inválido';
        if (!form.phone.trim()) e.phone = 'Telefone obrigatório';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        onSave({
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            city: form.city.trim() || null,
            photoUrl: form.photoUrl || null,
            interestAreas: form.interestAreas || null,
            schoolingLevel: form.schoolingLevel || null,
            experience: form.experience.trim() || null,
            status: form.status,
            source: form.source || 'Cadastro Manual',
            createdBy: 'Cadastro Manual',
            origin: 'manual',
        });
    };

    const areaOptions = interestAreas.length > 0 ? interestAreas : INTEREST_AREAS_OPTIONS;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-border"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <UserPlus size={20} className="text-brand-orange" />
                        <h2 className="text-lg font-bold text-foreground">Adicionar Candidato</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 custom-scrollbar">
                    {/* Foto */}
                    <PhotoUpload
                        value={form.photoUrl}
                        onChange={path => set('photoUrl', path)}
                    />

                    {/* Nome / Email / Telefone */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Nome Completo <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                value={form.fullName}
                                onChange={e => set('fullName', e.target.value)}
                                className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange ${errors.fullName ? 'border-red-500' : 'border-border'}`}
                                placeholder="Nome completo"
                            />
                            {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">E-mail <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange ${errors.email ? 'border-red-500' : 'border-border'}`}
                                placeholder="email@exemplo.com"
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Telefone <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => set('phone', e.target.value)}
                                className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange ${errors.phone ? 'border-red-500' : 'border-border'}`}
                                placeholder="(51) 99999-9999"
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Cidade / Áreas de Interesse / Escolaridade */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Cidade</label>
                            <input
                                type="text"
                                value={form.city}
                                onChange={e => set('city', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                                placeholder="Porto Alegre/RS"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Áreas de Interesse</label>
                            <select
                                value={form.interestAreas}
                                onChange={e => set('interestAreas', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                            >
                                <option value="">Selecionar</option>
                                {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Escolaridade</label>
                            <select
                                value={form.schoolingLevel}
                                onChange={e => set('schoolingLevel', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                            >
                                <option value="">Selecionar</option>
                                {SCHOOLING_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Etapa / Origem */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Etapa no Pipeline</label>
                            <select
                                value={form.status}
                                onChange={e => set('status', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                            >
                                {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Origem</label>
                            <input
                                type="text"
                                value={form.source}
                                onChange={e => set('source', e.target.value)}
                                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange"
                                placeholder="Ex: LinkedIn, Indicação..."
                            />
                        </div>
                    </div>

                    {/* Experiência */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Experiência Profissional</label>
                        <textarea
                            value={form.experience}
                            onChange={e => set('experience', e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange resize-none"
                            placeholder="Descreva brevemente a experiência..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted border border-border"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-brand-orange text-white hover:bg-brand-orange/90 disabled:opacity-60"
                    >
                        <UserPlus size={15} />
                        {isSaving ? 'Salvando...' : 'Adicionar Candidato'}
                    </button>
                </div>
            </div>
        </div>
    );
}
