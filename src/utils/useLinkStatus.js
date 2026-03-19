/**
 * Hook para verificar se um link está acessível (ok) ou quebrado (4xx/5xx).
 * Usado para CV, portfólio e outros links no perfil do candidato.
 *
 * Limitação: Links externos (Google Drive, etc.) podem falhar por CORS;
 * nesses casos retorna 'unknown'.
 */
import { useState, useEffect } from 'react';

const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function useLinkStatus(url) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    if (!isValidUrl(url)) {
      setStatus('unknown');
      return;
    }

    const trimmed = url.trim();

    // Google Drive / Docs frequentemente bloqueiam `HEAD` por CORS/privacidade,
    // mas o link pode funcionar ao abrir em nova aba. Para não sugerir "solicite novo envio",
    // tratamos como `unknown` e omitimos o badge.
    const isGoogleDriveLink =
      trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com');
    if (isGoogleDriveLink) {
      setStatus('unknown');
      return;
    }

    const cached = cache.get(trimmed);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setStatus(cached.status);
      return;
    }

    let cancelled = false;

    async function check() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(trimmed, {
          method: 'HEAD',
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (cancelled) return;

        const s = res.status;
        if (s >= 200 && s < 400) {
          cache.set(trimmed, { status: 'ok', timestamp: Date.now() });
          setStatus('ok');
        } else {
          cache.set(trimmed, { status: 'broken', timestamp: Date.now() });
          setStatus('broken');
        }
      } catch {
        if (cancelled) return;
        setStatus('unknown');
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return status;
}
