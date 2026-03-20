// Arquivo arquivado - substituído por DocumentationPage.jsx
// O conteúdo foi integrado à página de Documentação (Ajuda > subpáginas)

import React from 'react';
import { HelpCircle, ExternalLink, Book, Github } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="p-6 overflow-y-auto h-full bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <HelpCircle size={32} className="text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajuda e Documentação</h1>
        </div>
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Book size={20} /> Como Funciona
            </h2>
            <div className="space-y-3 text-gray-700 dark:text-gray-300">
              <p>O <strong>Young Hunt ATS</strong> é um sistema completo de gerenciamento de recrutamento.</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Github size={20} /> Documentação no GitHub
            </h2>
            <a href="https://github.com/adventurelabsbrasil/adventure-labs" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
              <ExternalLink size={16} /> Repositório no GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
