import React from 'react';
import { Briefcase, Award, Star } from 'lucide-react';

export default function ExperienceTab({
    candidate,
    editData,
    isEditing,
    handleFieldChange
}) {
    return (
        <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Briefcase size={20} />
                Experiência e Habilidades
            </h2>

            <div className="space-y-6">
                {/* Áreas de Interesse */}
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Star size={16} className="text-amber-500" />
                        Áreas de Interesse Profissional
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.interestAreas || ''}
                            onChange={(e) => handleFieldChange('interestAreas', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Ex: Administração, Vendas, Marketing"
                        />
                    ) : (
                        <p className="text-foreground font-medium">{candidate.interestAreas || 'Não informado'}</p>
                    )}
                </div>

                {/* Experiência Anterior */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Resumo de Experiências Anteriores
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editData.experience || ''}
                            onChange={(e) => handleFieldChange('experience', e.target.value)}
                            rows={8}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Descreva as experiências profissionais anteriores..."
                        />
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                            <p className="text-foreground whitespace-pre-wrap leading-relaxed texto-sm">
                                {candidate.experience || 'Nenhuma experiência detalhada informada.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Cursos e Certificações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Award size={16} className="text-blue-500" />
                            Cursos Extra-curriculares
                        </label>
                        {isEditing ? (
                            <textarea
                                value={editData.courses || ''}
                                onChange={(e) => handleFieldChange('courses', e.target.value)}
                                rows={4}
                                className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        ) : (
                            <p className="text-foreground whitespace-pre-wrap text-sm">
                                {candidate.courses || 'Não informado'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                            <Award size={16} className="text-purple-500" />
                            Certificações Profissionais
                        </label>
                        {isEditing ? (
                            <textarea
                                value={editData.certifications || ''}
                                onChange={(e) => handleFieldChange('certifications', e.target.value)}
                                rows={4}
                                className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        ) : (
                            <p className="text-foreground whitespace-pre-wrap text-sm">
                                {candidate.certifications || 'Não informado'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Referências */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Referências Profissionais
                    </label>
                    {isEditing ? (
                        <textarea
                            value={editData.professionalReferences || ''}
                            onChange={(e) => handleFieldChange('professionalReferences', e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Nome, contato e empresa de referências..."
                        />
                    ) : (
                        <p className="text-foreground whitespace-pre-wrap text-sm italic">
                            {candidate.professionalReferences || 'Não informado'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
