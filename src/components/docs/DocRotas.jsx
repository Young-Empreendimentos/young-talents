import React from 'react';

export default function DocRotas() {
  return (
    <>
      <h2 id="publicas" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Rotas públicas (sem autenticação)</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-input rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2 text-foreground">Rota</th>
              <th className="text-left px-4 py-2 text-foreground">Descrição</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/apply</code></td><td>Formulário público de candidatos</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/apply/thank-you</code></td><td>Página de agradecimento após envio</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="autenticadas" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Rotas autenticadas</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-input rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2 text-foreground">Rota</th>
              <th className="text-left px-4 py-2 text-foreground">Descrição</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/</code></td><td>Redireciona para /dashboard</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/login</code></td><td>Página de login</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/dashboard</code></td><td>Dashboard com KPIs e gráficos</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/pipeline</code></td><td>Pipeline Kanban</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/candidates</code></td><td>Banco de Talentos</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/jobs</code></td><td>Gestão de Vagas</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/applications</code></td><td>Candidaturas</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/companies</code>, <code>/positions</code>, <code>/sectors</code>, <code>/cities</code></td><td>Dados mestres</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/reports</code></td><td>Relatórios</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/help</code></td><td>Documentação</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/settings</code></td><td>Configurações</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>/candidate/:id</code></td><td>Perfil do candidato</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="query-params" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Query parameters</h2>
      <p className="text-muted-foreground mb-2">
        Modais e abas são controlados via query params:
      </p>
      <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
        <li><code>modal=job</code> – Modal de vaga</li>
        <li><code>modal=job-candidates&id=xxx</code> – Candidatos da vaga</li>
        <li><code>modal=csv</code> – Importação CSV</li>
        <li><code>settingsTab=campos|pipeline|empresas|usuarios|historico|emails</code> – Aba em Configurações</li>
      </ul>
    </>
  );
}
