import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLinkStatus } from '../../utils/useLinkStatus';

/**
 * Indicador visual de link quebrado.
 * Exibe ícone de alerta com tooltip quando status === 'broken'.
 * Não exibe nada quando 'ok' ou 'unknown'.
 */
export function LinkStatusBadge({ status, label = 'Link' }) {
  if (status !== 'broken') return null;

  const tooltip =
    label === 'Foto'
      ? 'Link da foto indisponível ou bloqueado – verifique acesso ao Drive/link'
      : 'Link pode estar indisponível – verifique acesso ao Drive/link';

  return (
    <span
      className="inline-flex items-center text-amber-600 dark:text-amber-500"
      title={tooltip}
      role="img"
      aria-label={tooltip}
    >
      <AlertCircle size={14} className="flex-shrink-0" />
    </span>
  );
}

/**
 * Wrapper para link + badge de status.
 * Usa useLinkStatus internamente para verificar o URL.
 */
export function LinkWithStatus({ url, label, children, className, ...linkProps }) {
  const status = useLinkStatus(url);
  return (
    <span className="inline-flex items-center gap-1">
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} {...linkProps}>
        {children}
      </a>
      <LinkStatusBadge status={status} label={label} />
    </span>
  );
}
