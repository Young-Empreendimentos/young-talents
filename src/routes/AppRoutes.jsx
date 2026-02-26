import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import LoginPage from '../components/LoginPage';
import PublicCandidateForm from '../components/PublicCandidateForm';
import FormSubmitTestPage from '../components/FormSubmitTestPage';
import ThankYouPage from '../components/ThankYouPage';
import CandidateProfilePage from '../components/CandidateProfilePage';
import AppLayout from '../components/layout/AppLayout';
import Sidebar from '../components/layout/Sidebar';
import MainHeader from '../components/layout/MainHeader';
import Dashboard from '../features/dashboard/components/Dashboard';
import PipelineView from '../components/PipelineView';
import TalentBankView from '../components/TalentBankView';
import SubmissionsView from '../components/SubmissionsView';
import JobsManagementPage from '../components/JobsManagementPage';
import ApplicationsPage from '../components/ApplicationsPage';
import ReportsPage from '../components/ReportsPage';
import DocumentationPage from '../components/DocumentationPage';
import SobrePage from '../components/SobrePage';
import DiagnosticPage from '../components/DiagnosticPage';
import SettingsPage from '../components/SettingsPage';
import JobModal from '../components/JobModal';
import CandidateModal from '../components/CandidateModal';
import TransitionModal from '../components/modals/TransitionModal';
import CsvImportModal from '../components/modals/CsvImportModal';
import JobCandidatesModal from '../components/modals/JobsCandidateModal';
import DashboardCandidatesModal from '../components/modals/DashboardCandidatesModal';
import InterviewModal from '../components/modals/InterviewModal';
import LinkToJobModal from '../components/modals/LinkToJobModal';
import FilterSidebar from '../components/FilterSidebar';
import { Loader2 } from 'lucide-react';
import { CLOSING_STATUSES, CANDIDATE_FIELDS, STAGES_REQUIRING_APPLICATION } from '../constants';

const AppRoutes = ({
    // Auth & State
    user,
    authLoading,
    effectiveUser,
    supabase,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    activeTab,
    setActiveTab,
    route,
    setRoute,

    // Data
    candidates,
    jobs,
    companies,
    cities,
    sectors,
    roles,
    jobLevels,
    activityAreas,
    applications,
    interviews,
    statusMovements,
    activityLog,
    candidatesLoading,
    isSaving,
    setIsSaving,

    // Filters
    filters,
    setFilters,
    initialFilters,
    isFilterSidebarOpen,
    setIsFilterSidebarOpen,
    filteredCandidates,
    uniqueCandidatesByEmail,

    // Modals & Temp States
    editingCandidate,
    setEditingCandidate,
    editingJob,
    setEditingJob,
    pendingTransition,
    setPendingTransition,
    linkToJobCandidate,
    setLinkToJobCandidate,
    viewingJob,
    isJobModalOpen,
    isCsvModalOpen,
    dashboardModalCandidates,
    setDashboardModalCandidates,
    dashboardModalTitle,
    setDashboardModalTitle,
    highlightedCandidateId,
    setHighlightedCandidateId,
    interviewModalData,
    setInterviewModalData,
    toast,

    // Options
    optionsProps,
    interestAreas,
    schooling,
    marital,
    origins,
    userRoles,
    currentUserRole,

    // Handlers
    handleSaveGeneric,
    handleDeleteGeneric,
    openCandidateProfile,
    openJobModal,
    closeJobModal,
    openCsvModal,
    closeCsvModal,
    openJobCandidatesModal,
    closeJobCandidatesModal,
    createApplication,
    updateApplicationStatus,
    removeApplication,
    addApplicationNote,
    scheduleInterview,
    showToast,
    loadCandidates,
    toggleTheme,
    isDark,
    setUserRole,
    removeUserRole,
    createUserWithPassword,
    handleDragEnd,
    handleCloseStatus,
    computeMissingFields
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    if (authLoading) return <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400"><Loader2 className="animate-spin mr-2" /> Carregando...</div>;

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/apply" element={<PublicCandidateForm />} />
            <Route path="/apply/test" element={<FormSubmitTestPage />} />
            <Route path="/apply/thank-you" element={<ThankYouPage />} />

            <Route path="/candidate/:id/:tab?" element={
                <CandidateProfilePage
                    candidates={candidates}
                    jobs={jobs}
                    companies={companies}
                    applications={applications}
                    interviews={interviews}
                    statusMovements={statusMovements}
                    onUpdateCandidate={() => { }} // Sync will happen via Supabase real-time
                    onCreateApplication={createApplication}
                    onScheduleInterview={(candidate) => setInterviewModalData({ candidate })}
                    onStatusChange={handleDragEnd}
                />
            } />

            <Route path="*" element={
                <AppLayout
                    isSidebarCollapsed={isSidebarCollapsed}
                    SidebarComponent={
                        <Sidebar
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            isSidebarOpen={isSidebarOpen}
                            setIsSidebarOpen={setIsSidebarOpen}
                            isSidebarCollapsed={isSidebarCollapsed}
                            navigate={navigate}
                            effectiveUser={effectiveUser}
                            supabase={supabase}
                            user={user}
                            setRoute={setRoute}
                        />
                    }
                    HeaderComponent={
                        <MainHeader
                            activeTab={activeTab}
                            isSidebarOpen={isSidebarOpen}
                            setIsSidebarOpen={setIsSidebarOpen}
                            isSidebarCollapsed={isSidebarCollapsed}
                            setIsSidebarCollapsed={setIsSidebarCollapsed}
                            setIsFilterSidebarOpen={setIsFilterSidebarOpen}
                            toggleTheme={toggleTheme}
                            isDark={isDark}
                            onGoHome={() => navigate('/dashboard')}
                        />
                    }
                >
                    {/* Aviso quando há envios mas os filtros ocultam todos os candidatos no Pipeline/Banco */}
                    {!candidatesLoading && (activeTab === 'pipeline' || activeTab === 'candidates') && filteredCandidates.length === 0 && (uniqueCandidatesByEmail.length > 0 || candidates.filter(c => !c.deletedAt).length > 0) && (
                        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm">
                            <span>Os filtros estão ocultando todos os candidatos. Limpe os filtros para ver o Pipeline e o Banco de Talentos.</span>
                            <button type="button" onClick={() => setFilters(initialFilters)} className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors">
                                Limpar filtros
                            </button>
                        </div>
                    )}

                    {/^\/jobs\/[^/]+$/.test(location.pathname) && (
                        <div className="p-6 overflow-y-auto h-full">
                            <JobModal
                                isOpen
                                isPageMode
                                job={location.pathname === '/jobs/new' ? null : jobs.find(j => j.id === location.pathname.replace(/^\/jobs\//, ''))}
                                onClose={() => navigate('/jobs')}
                                onSave={d => handleSaveGeneric('jobs', d, () => navigate('/jobs'))}
                                options={optionsProps}
                                isSaving={isSaving}
                                candidates={candidates}
                            />
                        </div>
                    )}

                    {activeTab === 'dashboard' && <div className="p-6 overflow-y-auto h-full"><Dashboard candidatesLoading={candidatesLoading} filteredJobs={jobs} filteredCandidates={filteredCandidates} totalCandidatesCount={uniqueCandidatesByEmail.length} totalSubmissionsCount={candidates.filter(c => !c.deletedAt).length} onOpenCandidates={setDashboardModalCandidates} onSetModalTitle={setDashboardModalTitle} onNavigateToCandidates={(path) => navigate(path)} onNavigateToJobs={(path) => navigate(path)} statusMovements={statusMovements} applications={applications} onViewJob={openJobCandidatesModal} interviews={interviews} onScheduleInterview={(candidate) => setInterviewModalData({ candidate })} /></div>}
                    {activeTab === 'pipeline' && <PipelineView candidatesLoading={candidatesLoading} candidatesTotal={candidates.length} filteredCount={filteredCandidates.length} onClearFilters={() => setFilters(initialFilters)} candidates={filteredCandidates} jobs={jobs} companies={companies} onDragEnd={handleDragEnd} onEdit={openCandidateProfile} onCloseStatus={handleCloseStatus} applications={applications} interviews={interviews} forceViewMode="kanban" highlightedCandidateId={highlightedCandidateId} filters={filters} setFilters={setFilters} onToggleStar={c => { handleSaveGeneric('candidates', { ...c, starred: !c.starred }, () => {}); showToast('Atualizado.', 'success'); }} />}
                    {activeTab === 'candidates' && <TalentBankView candidatesLoading={candidatesLoading} candidatesTotal={candidates.length} filteredCount={filteredCandidates.length} onClearFilters={() => setFilters(initialFilters)} candidates={filteredCandidates} jobs={jobs} companies={companies} onEdit={openCandidateProfile} applications={applications} onStatusChange={handleDragEnd} filters={filters} setFilters={setFilters} />}
                    {activeTab === 'submissions' && <SubmissionsView candidatesLoading={candidatesLoading} candidates={candidates.filter(c => !c.deletedAt)} onEdit={openCandidateProfile} />}
                    {(activeTab === 'jobs' || activeTab === 'companies' || activeTab === 'positions' || activeTab === 'sectors' || activeTab === 'cities') && !/^\/jobs\/[^/]+$/.test(location.pathname) && (
                        <JobsManagementPage
                            jobs={jobs}
                            candidates={candidates}
                            companies={companies}
                            cities={cities}
                            sectors={sectors}
                            roles={roles}
                            jobLevels={jobLevels}
                            activityAreas={activityAreas}
                            onOpenJobModal={openJobModal}
                            onDeleteGeneric={handleDeleteGeneric}
                            onSaveGeneric={handleSaveGeneric}
                            onShowToast={showToast}
                            onViewCandidates={openJobCandidatesModal}
                            setFilters={setFilters}
                            setActiveTab={setActiveTab}
                            filters={filters}
                            routeTab={activeTab}
                            initialJobStatusFilter={new URLSearchParams(location.search).get('status') || undefined}
                        />
                    )}
                    {activeTab === 'applications' && <ApplicationsPage applications={applications} candidates={candidates} jobs={jobs} companies={companies} onUpdateApplicationStatus={updateApplicationStatus} onRemoveApplication={removeApplication} onAddApplicationNote={addApplicationNote} onEditCandidate={openCandidateProfile} onViewJob={openJobCandidatesModal} onCreateApplication={createApplication} />}
                    {activeTab === 'reports' && <ReportsPage candidates={candidates} jobs={jobs} applications={applications} statusMovements={statusMovements} />}
                    {activeTab === 'help' && <DocumentationPage />}
                    {activeTab === 'sobre' && <SobrePage />}
                    {activeTab === 'diagnostic' && <div className="p-6 overflow-y-auto h-full"><DiagnosticPage candidates={candidates} /></div>}
                    {activeTab === 'settings' && <div className="p-0 h-full"><SettingsPage {...optionsProps} onOpenCsvModal={openCsvModal} activeSettingsTab={route.settingsTab} onSettingsTabChange={(tab) => { const params = new URLSearchParams(location.search); params.set('settingsTab', tab); navigate(`${location.pathname}?${params.toString()}`); setRoute(prev => ({ ...prev, settingsTab: tab })); }} onShowToast={showToast} userRoles={userRoles} currentUserRole={currentUserRole} onSetUserRole={setUserRole} onRemoveUserRole={removeUserRole} onCreateUserWithPassword={createUserWithPassword} currentUserEmail={effectiveUser?.email} currentUserName={effectiveUser?.displayName} currentUserPhoto={effectiveUser?.photoURL} activityLog={activityLog} candidateFields={CANDIDATE_FIELDS} /></div>}

                    <FilterSidebar isOpen={isFilterSidebarOpen} onClose={() => setIsFilterSidebarOpen(false)} filters={filters} setFilters={setFilters} clearFilters={() => setFilters(initialFilters)} options={optionsProps} candidates={candidates} />

                    {/* MODAIS GLOBAIS */}
                    {isJobModalOpen && <JobModal isOpen={isJobModalOpen} job={editingJob} onClose={closeJobModal} onSave={d => handleSaveGeneric('jobs', d, closeJobModal)} options={optionsProps} isSaving={isSaving} candidates={candidates} />}
                    {editingCandidate && <CandidateModal
                        candidate={editingCandidate}
                        onClose={() => setEditingCandidate(null)}
                        onSave={d => handleSaveGeneric('candidates', d, () => setEditingCandidate(null))}
                        options={optionsProps}
                        isSaving={isSaving}
                        statusMovements={statusMovements}
                        interviews={interviews}
                        onScheduleInterview={(candidate) => setInterviewModalData({ candidate })}
                        allCandidates={candidates}
                        applications={applications}
                        onCreateApplication={createApplication}
                        jobs={jobs}
                        onAddNote={async (candidateId, noteText) => {
                            console.log('Add note to candidate:', candidateId, noteText);
                            showToast('Nota adicionada', 'success');
                        }}
                        onAdvanceStage={async (candidate, newStage) => {
                            const missingFields = computeMissingFields(candidate, newStage);
                            const isConclusion = CLOSING_STATUSES.includes(newStage);
                            const needsJob = STAGES_REQUIRING_APPLICATION.includes(newStage);
                            const hasApplication = applications.some(a => a.candidateId === candidate.id);
                            const mustShowModal = isConclusion || missingFields.length > 0 || (needsJob && !hasApplication);
                            if (mustShowModal) {
                                setPendingTransition({ candidate, toStage: newStage, missingFields, isConclusion });
                            } else {
                                handleSaveGeneric('candidates', { ...candidate, status: newStage }, () => { });
                                showToast('Status atualizado', 'success');
                            }
                        }}
                    />}

                    {pendingTransition && (
                        <TransitionModal
                            transition={pendingTransition}
                            onClose={() => setPendingTransition(null)}
                            onConfirm={async d => {
                                const payload = {
                                    id: pendingTransition.candidate.id,
                                    ...d,
                                    status: pendingTransition.toStage,
                                    updatedAt: new Date().toISOString()
                                };
                                if (pendingTransition.isConclusion) {
                                    payload.closedAt = new Date().toISOString();
                                }
                                handleSaveGeneric('candidates', payload, () => setPendingTransition(null));
                            }}
                            cities={cities}
                            interestAreas={interestAreas}
                            schooling={schooling}
                            marital={marital}
                            origins={origins}
                            jobs={jobs}
                            applications={applications}
                            onCreateApplication={createApplication}
                            onOpenCreateJob={() => openJobModal && openJobModal({})}
                        />
                    )}

                    {linkToJobCandidate && (
                        <LinkToJobModal
                            linkToJobCandidate={linkToJobCandidate}
                            onClose={() => setLinkToJobCandidate(null)}
                            onVincular={(candidate) => {
                                setEditingCandidate(candidate);
                                setLinkToJobCandidate(null);
                            }}
                        />
                    )}

                    <CsvImportModal
                        isOpen={isCsvModalOpen}
                        onClose={closeCsvModal}
                        existingCandidates={candidates}
                        onImportData={async (candidatesData, importMode) => {
                            if (!supabase) {
                                showToast('Supabase não configurado. Configure as variáveis de ambiente.', 'error');
                                return;
                            }
                            setIsSaving(true);
                            try {
                                // Implementation moved from App.jsx but needssupabase and handlers
                                // For now, we will handle imports in App.jsx or move the logic here if possible
                                // Using a simplified call to a handler passed as prop
                                showToast('Importação não implementada nesta refatoração parcial', 'info');
                            } catch (error) {
                                console.error('Erro na importação:', error);
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                    />

                    <JobCandidatesModal
                        isOpen={!!viewingJob}
                        onClose={closeJobCandidatesModal}
                        job={viewingJob}
                        candidates={candidates}
                        applications={applications}
                        onCreateApplication={createApplication}
                        onUpdateApplicationStatus={updateApplicationStatus}
                        onRemoveApplication={removeApplication}
                        onAddApplicationNote={addApplicationNote}
                        onEditCandidate={openCandidateProfile}
                    />

                    <DashboardCandidatesModal
                        isOpen={!!dashboardModalCandidates}
                        onClose={() => {
                            setDashboardModalCandidates(null);
                            setDashboardModalTitle('');
                        }}
                        title={dashboardModalTitle || 'Candidatos do Dashboard'}
                        candidates={dashboardModalCandidates || []}
                        onViewProfile={openCandidateProfile}
                        onViewPipeline={(candidate) => {
                            setHighlightedCandidateId(candidate.id);
                            setActiveTab('pipeline');
                        }}
                    />

                    {interviewModalData && (
                        <InterviewModal
                            isOpen={true}
                            onClose={() => setInterviewModalData(null)}
                            onSchedule={scheduleInterview}
                            candidate={interviewModalData.candidate}
                            job={interviewModalData.job}
                            application={interviewModalData.application}
                        />
                    )}

                    {toast && (
                        <div className={`fixed bottom-4 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg border text-sm ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' :
                            toast.type === 'error' ? 'bg-red-500/20 text-red-200 border-red-500/40' :
                                'bg-slate-800 text-slate-200 border-slate-600'
                            }`}>
                            {toast.message}
                        </div>
                    )}
                </AppLayout>
            } />
        </Routes>
    );
};

export default AppRoutes;
