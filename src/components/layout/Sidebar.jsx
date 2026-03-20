import React from 'react';
import {
    LayoutDashboard, Users, Briefcase, Settings, FileText,
    Kanban, BarChart3, HelpCircle, Info, AlertCircle, X, ChevronRight, ChevronLeft, Menu
} from 'lucide-react';

const Sidebar = ({
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    navigate,
    effectiveUser,
    supabase,
    user,
    setRoute,
    currentUserRole
}) => {
    const isViewer = currentUserRole === 'viewer';
    return (
        <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!isSidebarCollapsed ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => { navigate('/dashboard'); setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    title="Ir para o início"
                >
                    <img
                        src="/logo-young-empreendimentos-caixa.png"
                        alt="Young"
                        className="h-10 w-10 rounded-lg"
                    />
                    <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">Young Talents</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            ATS{isViewer ? ' · somente leitura' : ''}
                        </div>
                    </div>
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"><X /></button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {/* Dashboard */}
                <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <LayoutDashboard size={18} /> Dashboard
                </button>

                {/* Pipeline */}
                <button onClick={() => { setActiveTab('pipeline'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'pipeline' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <Kanban size={18} /> Pipeline
                </button>

                {/* Banco de Talentos */}
                <button onClick={() => { setActiveTab('candidates'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'candidates' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <Users size={18} /> Banco de Talentos
                </button>

                {/* Formulários recebidos (todos os envios) */}
                <button onClick={() => { setActiveTab('submissions'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'submissions' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <FileText size={18} /> Formulários recebidos
                </button>

                {/* Vagas - Gerenciar Vagas (página com abas) + Candidaturas */}
                <div>
                    <button onClick={() => { setActiveTab(['jobs', 'applications'].includes(activeTab) ? activeTab : 'jobs'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                        <div className="flex items-center gap-3">
                            <Briefcase size={18} /> Vagas
                        </div>
                        <ChevronRight size={16} className={`transition-transform ${['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'rotate-90' : ''}`} />
                    </button>
                    {['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) && (
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                            <button onClick={() => { setActiveTab('jobs'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${['jobs', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                Gerenciar Vagas
                            </button>
                            <button onClick={() => { setActiveTab('applications'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === 'applications' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                Candidaturas
                            </button>
                        </div>
                    )}
                </div>

                {/* Relatórios */}
                <button onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <BarChart3 size={18} /> Relatórios
                </button>

                {/* Configurações — apenas admin/editor (gestão de usuários e mestres) */}
                {!isViewer && (
                <button onClick={() => { navigate('/settings?settingsTab=campos'); setRoute(prev => ({ ...prev, page: 'settings', settingsTab: 'campos' })); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <Settings size={18} /> Configurações
                </button>
                )}

                {/* Diagnóstico — em desenvolvimento */}
                <button onClick={() => { setActiveTab('diagnostic'); setIsSidebarOpen(false); }} title="Funcionalidade em desenvolvimento" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-not-allowed opacity-70 ${activeTab === 'diagnostic' ? 'bg-gray-500 text-white dark:bg-gray-600' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <AlertCircle size={18} /> Diagnóstico <span className="text-xs ml-1">(em breve)</span>
                </button>

                {/* Sobre */}
                <button onClick={() => { setActiveTab('sobre'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sobre' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <Info size={18} /> Sobre
                </button>

                {/* Ajuda */}
                <button onClick={() => { navigate('/help?doc=visao-geral'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'help' ? 'bg-blue-600 text-white shadow-lg dark:bg-blue-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}>
                    <HelpCircle size={18} /> Ajuda
                </button>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30 space-y-2">
                <div className="text-xs text-slate-400 truncate w-32" title={effectiveUser?.email}>{effectiveUser?.email || 'Desenvolvimento'}</div>
                {supabase && user && (
                    <button
                        type="button"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/login', { replace: true });
                        }}
                        className="text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium"
                    >
                        Sair
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
