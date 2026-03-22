import React from 'react';

const AppLayout = ({
    isSidebarCollapsed,
    SidebarComponent,
    HeaderComponent,
    children
}) => {
    return (
        <div className="flex min-h-screen bg-background font-sans text-foreground overflow-hidden">
            {SidebarComponent}

            {/* CONTEÚDO PRINCIPAL */}
            <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-200 ${!isSidebarCollapsed ? 'lg:pl-60' : 'lg:pl-0'}`}>
                {HeaderComponent}

                <div className="flex-1 overflow-hidden bg-background relative">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
