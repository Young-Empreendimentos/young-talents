import React from 'react';

export default function DocMapaDoSite() {
  return (
    <>
      <h2 id="visao-geral" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Visão geral</h2>
      <p className="text-muted-foreground mb-4">
        O menu lateral dá acesso às principais áreas do sistema. Cada página tem uma função específica no processo de recrutamento.
      </p>

      <h2 id="dashboard" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Dashboard</h2>
      <p className="text-muted-foreground mb-2">
        Visão geral com KPIs (Total de Candidatos, Contratados, Vagas Abertas, Reprovados), gráficos por status, cidade, fonte, área de interesse e evolução mensal. Clique nos KPIs para filtrar candidatos relacionados.
      </p>

      <h2 id="pipeline" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Pipeline</h2>
      <p className="text-muted-foreground mb-2">
        Kanban do processo seletivo. Etapas: Inscrito → Considerado → Entrevista I → Testes → Entrevista II → Seleção → Contratado/Reprovado/Desistiu. Arraste cards entre colunas. Busca, filtros e ordenação disponíveis.
      </p>

      <h2 id="banco-talentos" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Banco de Talentos</h2>
      <p className="text-muted-foreground mb-2">
        Tabela completa de candidatos. Busca em tempo real, ordenação por coluna, filtros avançados (período, status, vaga, cidade, área, fonte, etc.) e paginação.
      </p>

      <h2 id="formularios" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Formulários Recebidos</h2>
      <p className="text-muted-foreground mb-2">
        Submissões vindas do formulário público (<code>/apply</code>). Visualização e processamento das candidaturas para incorporar ao Banco de Talentos.
      </p>

      <h2 id="vagas" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Vagas</h2>
      <p className="text-muted-foreground mb-2">
        Gerenciar Vagas (criar, editar, excluir), Candidaturas (vínculo candidato–vaga), Empresas, Cargos, Setores e Cidades. Vincule candidatos a vagas específicas.
      </p>

      <h2 id="relatorios" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Relatórios</h2>
      <p className="text-muted-foreground mb-2">
        Relatórios e análises do sistema.
      </p>

      <h2 id="configuracoes" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Configurações</h2>
      <p className="text-muted-foreground mb-2">
        Campos (visibilidade e obrigatoriedade), Pipeline (etapas, motivos de perda), Empresas/Unidades, Importar/Exportar, Histórico de Ações, Usuários.
      </p>
    </>
  );
}
