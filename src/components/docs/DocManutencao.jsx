import React from 'react';

export default function DocManutencao() {
  return (
    <>
      <h2 id="scripts" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Scripts CLI</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-input rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2 text-foreground">Comando</th>
              <th className="text-left px-4 py-2 text-foreground">Descrição</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>npm run dev</code></td><td>Servidor de desenvolvimento</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>npm run build</code></td><td>Build para produção</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>npm run import-candidates</code></td><td>Importar candidatos de assets/candidates/candidates.csv</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>npm run sync-candidates-csv</code></td><td>Excluir todos os candidatos e reimportar do CSV</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>node scripts/setup-supabase-users.js</code></td><td>Criar usuários iniciais</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600"><code>node scripts/create-admin-user.js</code></td><td>Criar usuário admin</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="migrations" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Migrations Supabase</h2>
      <p className="text-muted-foreground mb-2">
        Execute os arquivos em <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">supabase/migrations/</code> na ordem numérica via SQL Editor do Supabase. Consulte docs/GUIA_SETUP_SUPABASE.md.
      </p>

      <h2 id="variaveis" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Variáveis de ambiente</h2>
      <p className="text-muted-foreground mb-2">
        Crie <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env.local</code>:
      </p>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 mb-4">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key`}
      </pre>

      <h2 id="backup" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Backup</h2>
      <p className="text-muted-foreground mb-2">
        Consulte docs/GUIA_BACKUP_SUPABASE.md. O Supabase Dashboard oferece backups automáticos conforme o plano.
      </p>
    </>
  );
}
