import React from 'react';
import { GraduationCap, Building2, Calendar } from 'lucide-react';

export default function EducationTab({
    candidate,
    editData,
    isEditing,
    handleFieldChange,
    formatDate
}) {
    return (
        <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <GraduationCap size={20} />
                Formação Acadêmica
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Nível de Escolaridade
                    </label>
                    {isEditing ? (
                        <select
                            value={editData.schoolingLevel || ''}
                            onChange={(e) => handleFieldChange('schoolingLevel', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecione</option>
                            <option value="Ensino Fundamental">Ensino Fundamental</option>
                            <option value="Ensino Médio">Ensino Médio</option>
                            <option value="Técnico">Técnico</option>
                            <option value="Superior Incompleto">Superior Incompleto</option>
                            <option value="Superior Completo">Superior Completo</option>
                            <option value="Pós-graduação">Pós-graduação</option>
                            <option value="Mestrado">Mestrado</option>
                            <option value="Doutorado">Doutorado</option>
                        </select>
                    ) : (
                        <p className="text-foreground font-medium">{candidate.schoolingLevel || 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Curso / Formação
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.education || ''}
                            onChange={(e) => handleFieldChange('education', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Administração de Empresas"
                        />
                    ) : (
                        <p className="text-foreground font-medium">{candidate.education || 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Building2 size={16} className="text-gray-400" />
                        Instituição de Ensino
                    </label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editData.institution || ''}
                            onChange={(e) => handleFieldChange('institution', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ) : (
                        <p className="text-foreground">{candidate.institution || 'Não informado'}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        Data de Formatura
                    </label>
                    {isEditing ? (
                        <input
                            type="date"
                            value={editData.graduationDate || ''}
                            onChange={(e) => handleFieldChange('graduationDate', e.target.value)}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ) : (
                        <p className="text-foreground">
                            {candidate.graduationDate ? formatDate(candidate.graduationDate) : 'Não informado'}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Cursando Atualmente?
                    </label>
                    {isEditing ? (
                        <select
                            value={editData.isStudying ? 'Sim' : 'Não'}
                            onChange={(e) => handleFieldChange('isStudying', e.target.value === 'Sim')}
                            className="w-full bg-background border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                        </select>
                    ) : (
                        <p className={`font-bold ${candidate.isStudying ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                            {candidate.isStudying ? 'SIM' : 'NÃO'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
