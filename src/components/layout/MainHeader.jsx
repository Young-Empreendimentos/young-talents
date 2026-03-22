import React from 'react';
import { Menu, ChevronLeft, Filter, Sun, Moon, RefreshCw } from 'lucide-react';

const MainHeader = ({
    activeTab,
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setIsFilterSidebarOpen,
    onRefreshData,
    candidatesLoading,
    toggleTheme,
    isDark,
    onGoHome
}) => {
    return (
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 z-20">
            <div className="flex items-center gap-2">
                {onGoHome && (
                    <button
                        type="button"
                        onClick={onGoHome}
                        className="p-2 hover:bg-muted rounded-md transition-colors"
                        title="Ir para o início"
                    >
                        <img
                            src="/logo-young-empreendimentos-caixa.png"
                            alt="Young"
                            className="h-8 w-8 rounded"
                        />
                    </button>
                )}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-2 hover:bg-muted rounded-md transition-colors"
                >
                    <Menu size={20} className="text-muted-foreground" />
                </button>
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden lg:flex p-2 hover:bg-muted rounded-md transition-colors"
                    title={isSidebarCollapsed ? 'Mostrar menu' : 'Ocultar menu'}
                >
                    {isSidebarCollapsed ? <Menu size={20} className="text-muted-foreground" /> : <ChevronLeft size={20} className="text-muted-foreground" />}
                </button>
                <h2 className="text-lg font-bold text-foreground ml-2">
                    {activeTab === 'pipeline' ? 'Pipeline de Talentos' : activeTab === 'candidates' ? 'Banco de Talentos' : ['jobs', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'Gerenciar Vagas' : activeTab === 'applications' ? 'Candidaturas' : activeTab === 'settings' ? 'Configurações' : activeTab === 'reports' ? 'Relatórios' : 'Dashboard'}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                {onRefreshData && (
                    <button
                        type="button"
                        onClick={onRefreshData}
                        disabled={candidatesLoading}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium px-3 py-1.5 rounded-md border border-input hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Atualizar dados"
                    >
                        <RefreshCw size={14} className={candidatesLoading ? 'animate-spin' : ''} /> Atualizar
                    </button>
                )}
                <button onClick={() => setIsFilterSidebarOpen(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-medium px-3 py-1.5 rounded-md border border-input hover:border-primary transition-colors">
                    <Filter size={14} /> Filtros
                </button>
                <button onClick={toggleTheme} className="p-2 text-muted-foreground hover:text-primary rounded-md border border-input hover:border-primary transition-colors">
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>
            </div>
        </header>
    );
};

export default MainHeader;
