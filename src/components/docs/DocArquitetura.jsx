import React from 'react';

export default function DocArquitetura() {
  return (
    <>
      <h2 id="stack" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Stack tecnológica</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border border-input rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2 text-foreground">Tecnologia</th>
              <th className="text-left px-4 py-2 text-foreground">Versão</th>
              <th className="text-left px-4 py-2 text-foreground">Uso</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr><td className="px-4 py-2 border-t dark:border-gray-600">React</td><td>18</td><td>Frontend UI</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600">Vite</td><td>5</td><td>Build e dev server</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600">Supabase</td><td>-</td><td>Backend (PostgreSQL, Auth, RLS)</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600">Tailwind CSS</td><td>3</td><td>Estilos</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600">Recharts</td><td>2</td><td>Gráficos do dashboard</td></tr>
            <tr><td className="px-4 py-2 border-t dark:border-gray-600">Lucide React</td><td>-</td><td>Ícones</td></tr>
          </tbody>
        </table>
      </div>

      <h2 id="estrutura" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Estrutura do projeto</h2>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`young-talents/
├── src/                    # Código frontend
│   ├── App.jsx             # App principal e estado global
│   ├── main.jsx            # Entry point
│   ├── supabase.js         # Cliente Supabase
│   ├── constants.js        # Constantes (Pipeline, campos, cores)
│   ├── components/         # Componentes React
│   ├── features/           # Módulos (Dashboard)
│   ├── routes/             # Rotas e layout
│   ├── utils/              # Utilitários e normalizadores
│   └── index.css           # Estilos globais e tema
├── supabase/
│   ├── migrations/         # SQL do schema (young_talents)
│   └── functions/          # Edge Functions
├── scripts/                # Scripts CLI
├── docs/                   # Documentação
└── assets/                 # Arquivos estáticos`}
      </pre>

      <h2 id="fluxo-dados" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Fluxo de dados</h2>
      <p className="text-muted-foreground mb-4">
        O app consome dados do Supabase (PostgreSQL) via cliente JavaScript. O schema principal é <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">young_talents</code>. Autenticação via Supabase Auth (Google OAuth e email/senha). RLS (Row Level Security) controla o acesso aos dados por usuário/role.
      </p>
    </>
  );
}
