import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { User, X } from 'lucide-react';
import { getPhotoPublicUrl } from '../../utils/urlUtils';

/**
 * Foto do candidato, igual em todas as telas.
 *
 * - Resolve o photo_url pelo getPhotoPublicUrl. O banco guarda o CAMINHO no
 *   Storage (ex.: "abc/foto.jpg"), não uma URL; usar o valor cru no <img> era o
 *   que deixava as fotos quebradas na vaga, nas candidaturas e no dashboard.
 * - Se a imagem falhar, mostra o ícone em vez do ícone de imagem quebrada.
 * - Clique abre a foto ampliada (desligue com expandable={false}). O clique
 *   não propaga, para não disparar o clique da linha ou do card onde está.
 */
export default function CandidateAvatar({ photoUrl, name = '', size = 48, expandable = true, square = false, className = '' }) {
  const url = getPhotoPublicUrl(photoUrl);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  // Trocou de candidato (mesmo componente reaproveitado): tenta de novo.
  useEffect(() => { setFailed(false); }, [url]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open]);

  const temFoto = url && !failed;
  const podeAmpliar = expandable && temFoto;

  return (
    <>
      <div
        className={`${square ? 'rounded-lg border border-border' : 'rounded-full'} bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center ${podeAmpliar ? 'cursor-zoom-in hover:ring-2 hover:ring-young-orange/60 transition-shadow' : ''} ${className}`}
        style={{ width: size, height: size }}
        onClick={podeAmpliar ? (e) => { e.stopPropagation(); setOpen(true); } : undefined}
        title={podeAmpliar ? 'Ampliar foto' : undefined}
      >
        {temFoto ? (
          <img
            src={url}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        ) : (
          <User size={Math.round(size / 2)} className="text-muted-foreground" />
        )}
      </div>

      {/* Portal: a foto ampliada precisa ficar por cima de qualquer modal. */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Fechar foto"
          >
            <X size={20} />
          </button>
          <img
            src={url}
            alt={name}
            className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain shadow-2xl cursor-default"
            referrerPolicy="no-referrer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
