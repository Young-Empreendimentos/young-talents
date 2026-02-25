import React from 'react';
import { X, UserPlus, Briefcase } from 'lucide-react';

/**
 * Modal exibido quando o usuário tenta mover um candidato para "Considerado" (ou etapa posterior)
 * sem ter nenhuma candidatura vinculada. Direciona para vincular o candidato a uma vaga.
 */
export default function LinkToJobModal({ linkToJobCandidate, onClose, onVincular }) {
  if (!linkToJobCandidate?.candidate) return null;

  const candidate = linkToJobCandidate.candidate;
  const candidateName = candidate?.fullName || candidate?.email || 'Candidato';

  const handleVincular = () => {
    onVincular(candidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Briefcase size={24} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vincular a uma vaga</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mb-2">
          Para avançar <strong>{candidateName}</strong> para a etapa &quot;Considerado&quot;, é necessário vincular o candidato a pelo menos uma vaga.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Deseja abrir o perfil do candidato para vincular a uma vaga agora?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleVincular}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 transition-colors"
          >
            <UserPlus size={18} />
            Vincular a uma vaga
          </button>
        </div>
      </div>
    </div>
  );
}
