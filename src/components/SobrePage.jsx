import React from 'react';
import { Info, BookOpen, ExternalLink, Sparkles } from 'lucide-react';

export default function SobrePage() {
  return (
    <div className="p-6 overflow-y-auto h-full bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src="/logo-young-empreendimentos-caixa.png"
            alt="Young"
            className="h-16 w-16 rounded-lg"
          />
          <div className="flex items-center gap-3">
            <Info size={28} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sobre o Young Talents ATS</h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Visão Geral</h2>
            <p className="text-gray-700 dark:text-gray-300">
              O <strong>Young Talents ATS</strong> é um sistema completo de gerenciamento de recrutamento (Applicant Tracking System) 
              que permite gerenciar candidatos, vagas e todo o processo seletivo em um único lugar. Com pipeline visual (Kanban), 
              banco de talentos, formulário público de candidatura e relatórios integrados.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={20} /> Guia de Uso
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Principais funcionalidades e como utilizá-las:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 list-disc list-inside">
              <li><strong>Dashboard</strong> — Métricas e gráficos do processo de recrutamento</li>
              <li><strong>Pipeline</strong> — Visualização Kanban com arrastar e soltar entre etapas</li>
              <li><strong>Banco de Talentos</strong> — Tabela completa com busca, filtros e ordenação</li>
              <li><strong>Formulários Recebidos</strong> — Submissões via formulário público</li>
              <li><strong>Vagas</strong> — Cadastro e gestão de vagas e empresas</li>
              <li><strong>Relatórios</strong> — Exportação e análises</li>
              <li><strong>Configurações</strong> — Campos, pipeline, importação/exportação</li>
            </ul>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Para o guia completo, consulte o arquivo <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">GUIA_USO_APP.md</code> no repositório.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800/50">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles size={20} /> Melhorias Futuras
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li>
                <strong>Disparos de email na pipeline</strong> — Ao mover o card do candidato entre etapas, disparar emails automáticos 
                (ex.: confirmação de candidatura, agendamento de entrevista, resultado)
              </li>
              <li>
                <strong>Modelos de email</strong> — Templates configuráveis em Configurações, com variáveis (nome, vaga, data)
              </li>
              <li>
                <strong>Módulo Diagnóstico</strong> — Em desenvolvimento
              </li>
              <li>
                <strong>Histórico de ações</strong> — Registro detalhado de alterações por usuário
              </li>
              <li>
                <strong>Notificações in-app</strong> — Alertas quando houver novas candidaturas ou mudanças relevantes
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-blue-50 dark:bg-blue-900/20">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Documentação</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              Documentação técnica e guias completos estão disponíveis no repositório do projeto:
            </p>
            <a
              href="https://github.com/adventurelabsbrasil/adventure-labs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              <ExternalLink size={16} /> Repositório no GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
