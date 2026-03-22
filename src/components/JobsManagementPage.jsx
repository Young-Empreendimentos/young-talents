import React, { useState, useEffect } from 'react';
import { Briefcase, Building2, MapPin, BarChart3, Users, Clock } from 'lucide-react';
import JobsList from './JobsList';
import MasterDataManager from './MasterDataManager';

const JOBS_PAGE_TAB_MAP = { jobs: 'vagas', companies: 'companies', cities: 'cities', sectors: 'sectors', positions: 'positions', job_levels: 'job_levels', activity_areas: 'activity_areas' };

const JobsManagementPage = ({
    jobs,
    candidates,
    companies,
    cities,
    sectors,
    roles,
    jobLevels = [],
    activityAreas = [],
    onOpenJobModal,
    onDeleteGeneric,
    onSaveGeneric,
    onShowToast,
    onViewCandidates,
    setFilters,
    setActiveTab,
    filters,
    routeTab,
    initialJobStatusFilter,
}) => {
    const routeTabId = JOBS_PAGE_TAB_MAP[routeTab] || 'vagas';
    const [jobsPageTab, setJobsPageTab] = useState(routeTabId);
    // Sincronizar aba quando a rota mudar (ex.: /companies)
    useEffect(() => {
        setJobsPageTab(routeTabId);
    }, [routeTabId]);
    const tabs = [
        { id: 'vagas', label: 'Vagas', icon: Briefcase },
        { id: 'companies', label: 'Empresas', icon: Building2 },
        { id: 'cities', label: 'Cidades', icon: MapPin },
        { id: 'sectors', label: 'Setores', icon: BarChart3 },
        { id: 'positions', label: 'Cargos', icon: Users },
        { id: 'job_levels', label: 'Níveis de cargo', icon: Clock },
        { id: 'activity_areas', label: 'Áreas de atuação', icon: BarChart3 },
    ];
    return (
        <div className="p-6 overflow-y-auto h-full flex flex-col">
            <div className="flex border-b border-border mb-4 gap-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setJobsPageTab(id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${jobsPageTab === id
                            ? 'bg-blue-600 text-white dark:bg-blue-500'
                            : 'text-muted-foreground hover:bg-muted hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>
            <div className="flex-1 min-h-0">
                {jobsPageTab === 'vagas' && (
                    <JobsList
                        jobs={jobs}
                        candidates={candidates}
                        companies={companies}
                        onAdd={() => onOpenJobModal({})}
                        onEdit={(j) => onOpenJobModal(j)}
                        onDelete={(id) => onDeleteGeneric('jobs', id)}
                        onToggleStatus={onSaveGeneric}
                        onFilterPipeline={() => { setFilters({ ...filters, jobId: 'mock_id' }); setActiveTab('candidates'); }}
                        onViewCandidates={onViewCandidates}
                        initialStatusFilter={initialJobStatusFilter}
                    />
                )}
                {jobsPageTab === 'companies' && (
                    <MasterDataManager
                        collection="companies"
                        title="Empresas"
                        fields={[{ key: 'name', label: 'Nome', required: true }]}
                        onSave={onSaveGeneric}
                        onDelete={onDeleteGeneric}
                        items={companies}
                        onShowToast={onShowToast}
                    />
                )}
                {jobsPageTab === 'cities' && (
                    <MasterDataManager
                        collection="cities"
                        title="Cidades"
                        fields={[{ key: 'name', label: 'Nome', required: true }]}
                        onSave={onSaveGeneric}
                        onDelete={onDeleteGeneric}
                        items={cities}
                        onShowToast={onShowToast}
                    />
                )}
                {jobsPageTab === 'sectors' && (
                    <MasterDataManager
                        collection="sectors"
                        title="Setores"
                        fields={[{ key: 'name', label: 'Nome', required: true }]}
                        onSave={onSaveGeneric}
                        onDelete={onDeleteGeneric}
                        items={sectors}
                        onShowToast={onShowToast}
                    />
                )}
                {jobsPageTab === 'positions' && (
                    <MasterDataManager
                        collection="positions"
                        title="Cargos"
                        fields={[
                            { key: 'name', label: 'Nome', required: true },
                            { key: 'levelId', label: 'Nível de cargo', type: 'select', optionsKey: 'jobLevels', required: false },
                            { key: 'activityAreaId', label: 'Área de atuação', type: 'select', optionsKey: 'activityAreas', required: false }
                        ]}
                        options={{ jobLevels, activityAreas }}
                        onSave={onSaveGeneric}
                        onDelete={onDeleteGeneric}
                        items={roles}
                        onShowToast={onShowToast}
                    />
                )}
                {jobsPageTab === 'job_levels' && (
                    <MasterDataManager
                        collection="job_levels"
                        title="Níveis de cargo"
                        fields={[{ key: 'name', label: 'Nome', required: true }]}
                        onSave={onSaveGeneric}
                        onDelete={onDeleteGeneric}
                        items={jobLevels}
                        onShowToast={onShowToast}
                    />
                )}
                {jobsPageTab === 'activity_areas' && (
                    <MasterDataManager
                        collection="activity_areas"
                        title="Áreas de atuação"
                        fields={[{ key: 'name', label: 'Nome', required: true }]}
                        onSave={onSaveGeneric}
                        onDelete={onDeleteGeneric}
                        items={activityAreas}
                        onShowToast={onShowToast}
                    />
                )}
            </div>
        </div>
    );
};

export default JobsManagementPage;
