import React from 'react';

export default function DocVisaoGeral() {
  return (
    <>
      <h2 id="introducao" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Introdução</h2>
      <p className="text-muted-foreground mb-4">
        O <strong>Young Talents ATS</strong> é um sistema completo de gerenciamento de recrutamento (Applicant Tracking System) que permite à sua empresa gerir candidatos, vagas e todo o processo seletivo em um único lugar.
      </p>

      <h2 id="para-que-serve" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Para que serve</h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
        <li>Centralizar candidatos vindos do formulário público ou importação</li>
        <li>Visualizar o processo seletivo em um pipeline Kanban (arrastar e soltar)</li>
        <li>Criar e gerenciar vagas, empresas, cargos e setores</li>
        <li>Vincular candidatos a vagas específicas</li>
        <li>Agendar entrevistas e acompanhar etapas</li>
        <li>Gerar relatórios e métricas</li>
        <li>Importar candidatos via CSV</li>
      </ul>

      <h2 id="primeiros-passos" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Primeiros passos</h2>
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
        <li>Acesse a URL do sistema fornecida pelo administrador</li>
        <li>Clique em <strong>Entrar com Google</strong> ou use email/senha</li>
        <li>Após o login, você será redirecionado para o Dashboard</li>
        <li>Use o menu lateral para navegar entre as seções</li>
      </ol>

      <h2 id="suporte" className="text-xl font-bold text-foreground mt-8 mb-4 scroll-mt-24">Suporte</h2>
      <p className="text-muted-foreground mb-4">
        Consulte este manual completo ou entre em contato com o administrador do sistema. Para credenciais e acessos técnicos (Supabase, Vercel, GitHub), solicite ao desenvolvedor responsável.
      </p>
    </>
  );
}
