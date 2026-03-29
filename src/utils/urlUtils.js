import { supabase } from '../supabase';

/**
 * Resolve um photo_url para uma URL exibível.
 * - Se for um path do Supabase Storage (sem http), constrói a URL pública.
 * - Se for uma URL externa (http/https), usa a conversão de Google Drive existente.
 * - Se for null/vazio, retorna null.
 */
export const getPhotoPublicUrl = (photoUrl) => {
    if (!photoUrl || typeof photoUrl !== 'string') return null;
    const clean = photoUrl.trim();
    if (!clean) return null;

    // URL externa (legado) — usa conversão Google Drive
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return photoDisplayUrl(clean);
    }

    // Path do Supabase Storage
    const { data } = supabase.storage.from('candidate-photos').getPublicUrl(clean);
    return data?.publicUrl || null;
};

/**
 * Converte um link de compartilhamento do Google Drive para um link de visualização direta (UC).
 * Suporta formatos:
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/uc?id=FILE_ID
 */
export const photoDisplayUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    // Limpar espaços e extras
    const cleanUrl = url.trim();

    // Se já for um link de visualização direta corrigido, retorna ele
    if (cleanUrl.includes('drive.google.com/uc?export=view&id=')) return cleanUrl;

    const m = cleanUrl.match(/drive\.google\.com\/open\?id=([^&\s]+)/i) ||
        cleanUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/i) ||
        cleanUrl.match(/drive\.google\.com\/uc\?id=([^&\s]+)/i);

    if (m && m[1]) {
        return `https://drive.google.com/uc?export=view&id=${m[1]}`;
    }

    return cleanUrl;
};

/**
 * Divide uma string que pode conter múltiplas URLs separadas por vírgula.
 */
export const parseCandidateUrls = (urlStr) => {
    if (!urlStr || typeof urlStr !== 'string') return [];
    return urlStr
        .split(',')
        .map(u => u.trim())
        .filter(u => u.length > 0 && u.startsWith('http'));
};

/**
 * Utilitário para copiar texto para o clipboard.
 */
export const copyToClipboard = async (text) => {
    if (!text) return false;
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Falha ao copiar:', err);
        return false;
    }
};
