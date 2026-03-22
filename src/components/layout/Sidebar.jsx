import React from 'react';
import {
    LayoutDashboard, Users, Briefcase, Settings,
    Kanban, BarChart3, X, ChevronRight, ChevronLeft, Menu
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

    const navItem = (tab, icon, label) => (
        <button
            onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className={`fixed inset-y-0 left-0 z-30 w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${!isSidebarCollapsed ? 'lg:translate-x-0' : 'lg:-translate-x-full'}`}>
            <div className="h-16 px-4 border-b border-sidebar-border flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => { navigate('/dashboard'); setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    title="Ir para o início"
                >
                    <img
                        src="/logo-young-empreendimentos-caixa.png"
                        alt="Young"
                        className="h-8 w-8 rounded bg-accent/20"
                    />
                    <div>
                        <div className="font-bold text-sidebar-foreground text-sm">Young Talents</div>
                        <div className="text-xs text-sidebar-muted">
                            ATS{isViewer ? ' · somente leitura' : ''}
                        </div>
                    </div>
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-sidebar-muted hover:text-sidebar-foreground"><X size={18} /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItem('dashboard', <LayoutDashboard size={18} />, 'Dashboard')}
                {navItem('pipeline', <Kanban size={18} />, 'Pipeline')}
                {navItem('candidates', <Users size={18} />, 'Banco de Talentos')}

                {/* Vagas com sub-itens */}
                <div>
                    <button onClick={() => { setActiveTab(['jobs', 'applications'].includes(activeTab) ? activeTab : 'jobs'); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                        <div className="flex items-center gap-3">
                            <Briefcase size={18} /> Vagas
                        </div>
                        <ChevronRight size={14} className={`transition-transform ${['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'rotate-90' : ''}`} />
                    </button>
                    {['jobs', 'applications', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-3">
                            <button onClick={() => { setActiveTab('jobs'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${['jobs', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'bg-sidebar-accent/50 text-sidebar-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                                Gerenciar Vagas
                            </button>
                            <button onClick={() => { setActiveTab('applications'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${activeTab === 'applications' ? 'bg-sidebar-accent/50 text-sidebar-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                                Candidaturas
                            </button>
                        </div>
                    )}
                </div>

                {navItem('reports', <BarChart3 size={18} />, 'Relatórios')}

                {!isViewer && (
                    <button onClick={() => { navigate('/settings'); setRoute(prev => ({ ...prev, page: 'settings', settingsTab: null })); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
                        <Settings size={18} /> Configurações
                    </button>
                )}
            </nav>
            <div className="p-4 border-t border-sidebar-border space-y-2">
                <div className="text-xs text-sidebar-muted truncate" title={effectiveUser?.email}>{effectiveUser?.displayName || effectiveUser?.email || 'Desenvolvimento'}</div>
                {supabase && user && (
                    <button
                        type="button"
                        onClick={async () => {
                            await supabase.auth.signOut();
                            navigate('/login', { replace: true });
                        }}
                        className="text-xs text-sidebar-muted hover:text-red-400 font-medium transition-colors"
                    >
                        Sair
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
