/**
 * Formatação de candidatos para exibição no frontend.
 * Trata dados históricos (CSV/Google Forms) e novos (formulário) de forma consistente.
 * Os dados no Supabase podem vir em formatos diversos; este módulo normaliza para display.
 */

import { formatChildrenForDisplay } from './childrenNormalizer';

/**
 * Formata data para exibição (dd/mm/yyyy).
 * Aceita: string ISO (YYYY-MM-DD), string DD/MM/YYYY, Date, Firestore timestamp.
 */
export function formatCandidateDate(value) {
  if (value == null || value === '') return null;
  let date;
  if (typeof value === 'object' && (value.seconds || value._seconds)) {
    date = new Date((value.seconds || value._seconds) * 1000);
  } else if (typeof value === 'object' && typeof value.toDate === 'function') {
    date = value.toDate();
  } else if (typeof value === 'string') {
    // ISO (1993-05-26) ou DD/MM/YYYY
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      date = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    } else {
      const dmMatch = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
      if (dmMatch) {
        const day = parseInt(dmMatch[1], 10);
        const month = parseInt(dmMatch[2], 10) - 1;
        let year = parseInt(dmMatch[3], 10);
        if (year < 100) year += 2000;
        date = new Date(year, month, day);
      } else {
        date = new Date(value);
      }
    }
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata timestamp (data + hora) para exibição.
 */
export function formatCandidateTimestamp(value) {
  if (value == null || value === '') return null;
  let date;
  if (typeof value === 'object' && (value.seconds || value._seconds)) {
    date = new Date((value.seconds || value._seconds) * 1000);
  } else if (typeof value === 'object' && typeof value.toDate === 'function') {
    date = value.toDate();
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formata filhos para exibição.
 * Compatível com dados legados ("Não tenho filhos.", "0", 0, "5 ou mais").
 */
export function formatCandidateChildren(value) {
  return formatChildrenForDisplay(value) || null;
}

/**
 * Calcula idade a partir da data de nascimento.
 * Usado como fallback quando age está vazio.
 * Aceita os mesmos formatos que formatCandidateDate.
 */
export function computeAgeFromBirthDate(birthDate) {
  if (!birthDate || birthDate === '') return null;
  let date;
  if (typeof birthDate === 'object' && (birthDate.seconds || birthDate._seconds)) {
    date = new Date((birthDate.seconds || birthDate._seconds) * 1000);
  } else if (typeof birthDate === 'object' && typeof birthDate.toDate === 'function') {
    date = birthDate.toDate();
  } else if (typeof birthDate === 'string') {
    const isoMatch = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      date = new Date(parseInt(isoMatch[1], 10), parseInt(isoMatch[2], 10) - 1, parseInt(isoMatch[3], 10));
    } else {
      const dmMatch = birthDate.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
      if (dmMatch) {
        const day = parseInt(dmMatch[1], 10);
        const month = parseInt(dmMatch[2], 10) - 1;
        let year = parseInt(dmMatch[3], 10);
        if (year < 100) year += 2000;
        date = new Date(year, month, day);
      } else {
        date = new Date(birthDate);
      }
    }
  } else {
    date = new Date(birthDate);
  }
  if (!date || isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age--;
  if (age < 0 || age > 120) return null;
  return age;
}

/** Idade numérica para filtros e listagens (usa age ou data de nascimento). */
export function getCandidateAge(c) {
  if (!c) return null;
  const n = Number(c.age);
  if (c.age != null && c.age !== '' && !Number.isNaN(n) && n >= 0 && n <= 120) return n;
  return computeAgeFromBirthDate(c.birthDate);
}

/**
 * Prepara candidato para exibição no frontend.
 * Adiciona campos _display que podem ser usados nos componentes.
 * Não altera os dados originais; retorna cópia enriquecida.
 *
 * @param {object} candidate - Candidato após mapCandidateFromSupabase
 * @returns {object} - Candidato com campos _display
 */
export function prepareCandidateForDisplay(candidate) {
  if (!candidate) return null;
  const hasAge = candidate.age != null && candidate.age !== '';
  const computedAge = !hasAge ? computeAgeFromBirthDate(candidate.birthDate) : null;
  const ageToUse = hasAge ? candidate.age : (computedAge ?? candidate.age);
  return {
    ...candidate,
    ...(computedAge != null && !hasAge && { age: computedAge }),
    _display: {
      birthDate: formatCandidateDate(candidate.birthDate),
      graduationDate: formatCandidateDate(candidate.graduationDate),
      childrenCount: formatCandidateChildren(candidate.childrenCount),
      originalTimestamp: formatCandidateTimestamp(candidate.original_timestamp || candidate.originalTimestamp),
      createdAt: formatCandidateTimestamp(candidate.createdAt),
      updatedAt: formatCandidateTimestamp(candidate.updatedAt),
      age: ageToUse
    }
  };
}
