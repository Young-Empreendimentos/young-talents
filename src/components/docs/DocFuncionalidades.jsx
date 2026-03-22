import React from 'react';

export default function DocFuncionalidades() {
  return (
    <>
      <h2 id="candidatos" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Candidatos</h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
        <li>Buscar: digite na barra de busca (nome, email, telefone, cidade, fonte, área, formação)</li>
        <li>Filtrar: Filtros Avançados – Período, Status, Vaga, Cidade, Área, Fonte, etc.</li>
        <li>Ordenar: clique no cabeçalho da coluna</li>
        <li>Adicionar: botão Adicionar → preencher abas → Salvar</li>
        <li>Avançar etapa: abra o candidato → Avançar Etapa do Processo → escolha a próxima etapa</li>
        <li>Importar CSV: Configurações → Importar/Exportar → baixe modelo → mapeie colunas → confirme</li>
      </ul>

      <h2 id="vagas" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Vagas</h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
        <li>Criar e editar vagas com empresa, cargo, setor, cidade, descrição, requisitos</li>
        <li>Visualizar por Status, Cidade, Empresa ou Período</li>
        <li>Vincular candidatos a vagas via Candidaturas</li>
      </ul>

      <h2 id="formulario-publico" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Formulário público</h2>
      <p className="text-muted-foreground mb-2">
        URL: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">/apply</code>. Candidatos não autenticados preenchem e enviam. Submissões aparecem em Formulários Recebidos e podem ser incorporadas ao Banco de Talentos.
      </p>

      <h2 id="filtros" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Filtros</h2>
      <p className="text-muted-foreground mb-2">
        Filtros avançados incluem: período (Data Cadastro Original), status, vaga, cidade, área de interesse, fonte, escolaridade, tags, etc. Persistem em localStorage.
      </p>

      <h2 id="importacao" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Importação</h2>
      <p className="text-muted-foreground mb-2">
        CSV ou XLSX. Mapeamento de colunas para campos do sistema. Opções de duplicação por email. Execute também via CLI: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npm run import-candidates</code>.
      </p>
    </>
  );
}
