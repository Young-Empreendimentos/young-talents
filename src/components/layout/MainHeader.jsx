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
        <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 z-20">
            <div className="flex items-center gap-2">
                {/* Home - logo/ícone quando sidebar recolhido ou para acesso rápido */}
                {onGoHome && (
                    <button
                        type="button"
                        onClick={onGoHome}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Ir para o início"
                    >
                        <img
                            src="/logo-young-empreendimentos-caixa.png"
                            alt="Young"
                            className="h-8 w-8 rounded-lg"
                        />
                    </button>
                )}
                {/* Botão mobile */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                    <Menu size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                {/* Botão desktop - ocultar/mostrar menu */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={isSidebarCollapsed ? 'Mostrar menu' : 'Ocultar menu'}
                >
                    {isSidebarCollapsed ? <Menu size={20} className="text-gray-600 dark:text-gray-400" /> : <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />}
                </button>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white ml-2">
                    {activeTab === 'pipeline' ? 'Pipeline de Talentos' : activeTab === 'candidates' ? 'Banco de Talentos' : activeTab === 'submissions' ? 'Formulários recebidos' : ['jobs', 'companies', 'positions', 'sectors', 'cities'].includes(activeTab) ? 'Gerenciar Vagas' : activeTab === 'applications' ? 'Candidaturas' : activeTab === 'settings' ? 'Configurações' : activeTab === 'diagnostic' ? 'Diagnóstico' : activeTab === 'reports' ? 'Relatórios' : activeTab === 'help' ? 'Ajuda' : 'Dashboard'}
                </h2>
            </div>
            <div className="flex items-center gap-3">
                {onRefreshData && (
                    <button
                        type="button"
                        onClick={onRefreshData}
                        disabled={candidatesLoading}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Atualizar dados"
                    >
                        <RefreshCw size={16} className={candidatesLoading ? 'animate-spin' : ''} /> Atualizar
                    </button>
                )}
                <button onClick={() => setIsFilterSidebarOpen(true)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                    <Filter size={16} /> Filtros
                </button>
                <button onClick={toggleTheme} className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </header>
    );
};

export default MainHeader;
