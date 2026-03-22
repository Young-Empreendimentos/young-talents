import React from 'react';

export default function DocAcessos() {
  return (
    <>
      <h2 id="obter-credenciais" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Como obter credenciais</h2>
      <p className="text-muted-foreground mb-4">
        Todas as chaves, senhas e URLs de acesso devem ser obtidas com o <strong>Desenvolvedor responsável</strong>. Não armazene credenciais sensíveis em documentos públicos.
      </p>

      <h2 id="vercel" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Vercel</h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
        <li>Dashboard: <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">vercel.com/dashboard</a></li>
        <li>URL do app em produção (domínio customizado ou *.vercel.app)</li>
        <li>Variáveis de ambiente (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)</li>
        <li>Login: [OBTER COM DESENVOLVEDOR]</li>
      </ul>

      <h2 id="supabase" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Supabase</h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
        <li>Dashboard: <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">app.supabase.com</a></li>
        <li>Project URL (VITE_SUPABASE_URL)</li>
        <li>Anon key (VITE_SUPABASE_ANON_KEY) – pública, usada no frontend</li>
        <li>Service role key – uso restrito em scripts; nunca expor no frontend</li>
        <li>Login: [OBTER COM DESENVOLVEDOR]</li>
      </ul>

      <h2 id="github" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">GitHub</h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
        <li>Repositório do projeto</li>
        <li>Acesso para deploys automáticos (Vercel integra com GitHub)</li>
        <li>URL e permissões: [OBTER COM DESENVOLVEDOR]</li>
      </ul>

      <h2 id="contato" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Contato</h2>
      <p className="text-muted-foreground mb-4">
        Para obter credenciais, links de acesso, senhas provisórias de admin ou service role, entre em contato com o desenvolvedor responsável pelo projeto.
      </p>
    </>
  );
}
