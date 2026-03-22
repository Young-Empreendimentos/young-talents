// src/components/DiagnosticPage.jsx
// Página de diagnóstico dos dados de candidatos (Supabase).

import React, { useState, useMemo } from 'react';
import { CANDIDATE_FIELDS } from '../constants';
import { getTimestampSeconds, getCandidateTimestamp } from '../utils/timestampUtils';
import { AlertCircle, Check, Database, Clock, FileText, Users, RefreshCw } from 'lucide-react';

function formatTs(ts) {
  if (ts == null) return '—';
  const d = new Date(ts * 1000);
  return d.toLocaleString('pt-BR');
}

export default function DiagnosticPage({ candidates = [] }) {
  const [refreshing, setRefreshing] = useState(false);
  const hasCandidates = (candidates || []).length > 0;

  const stats = useMemo(() => {
    const list = (candidates || []).filter(c => !c.deletedAt);
    let withOriginal = 0;
    let withCreatedAt = 0;
    let onlyCreated = 0;
    let onlyOriginal = 0;
    let both = 0;
    let invalidOriginal = 0;
    let futureOriginal = 0;

    const now = Date.now() / 1000;
    list.forEach(c => {
      const o = getTimestampSeconds(c.original_timestamp);
      const cr = getTimestampSeconds(c.createdAt);
      if (o != null) withOriginal++;
      if (cr != null) withCreatedAt++;
      if (o != null && cr != null) both++;
      else if (o != null) onlyOriginal++;
      else if (cr != null) onlyCreated++;
      if (o != null && (typeof o !== 'number' || isNaN(o) || o <= 0)) invalidOriginal++;
      if (o != null && typeof o === 'number' && o > now + 60) futureOriginal++;
    });

    return {
      total: list.length,
      withOriginal,
      withCreatedAt,
      onlyCreated,
      onlyOriginal,
      both,
      invalidOriginal,
      futureOriginal
    };
  }, [candidates]);

  const recent = useMemo(() => {
    return [...(candidates || [])]
      .filter(c => !c.deletedAt)
      .map(c => ({
        ...c,
        _ts: getTimestampSeconds(c.original_timestamp) ?? getTimestampSeconds(c.createdAt) ?? 0
      }))
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 10);
  }, [candidates]);

  const mappingOk = useMemo(() => {
    const keys = new Set((candidates || []).flatMap(c => Object.keys(c)));
    const required = CANDIDATE_FIELDS.filter(f => f.required).map(f => f.key);
    const missing = required.filter(k => !keys.has(k));
    const fromForms = ['fullName', 'email', 'phone', 'city', 'original_timestamp', 'createdAt', 'source', 'interestAreas'];
    const fromFormsMissing = fromForms.filter(k => !keys.has(k));
    return { keys: [...keys], missing, fromFormsMissing };
  }, [candidates]);

  const doRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-4 px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-input rounded-lg text-muted-foreground text-sm">
        <strong>Funcionalidade em desenvolvimento.</strong> Esta página ainda não foi totalmente implementada.
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <AlertCircle size={24} /> Diagnóstico da Integração
        </h1>
        <button
          onClick={doRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-input text-sm text-muted-foreground hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* 1. Status da conexão com o banco */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
          <Database size={18} /> Conexão com o banco (Supabase)
        </h2>
        <div className="flex items-center gap-2">
          <Check size={20} className="text-green-500" />
          <span className="text-muted-foreground">
            {hasCandidates
              ? `Dados carregados do Supabase (${candidates.length} candidato(s) nesta sessão).`
              : 'Nenhum candidato carregado. Os dados vêm do Supabase (schema young_talents).'}
          </span>
        </div>
      </section>

      {/* 2. Estatísticas de timestamps */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
          <Clock size={18} /> Timestamps (original_timestamp vs createdAt)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="text-muted-foreground">Total candidatos</div>
            <div className="font-semibold text-foreground">{stats.total}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="text-muted-foreground">Com original_timestamp</div>
            <div className="font-semibold text-foreground">{stats.withOriginal}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="text-muted-foreground">Com createdAt</div>
            <div className="font-semibold text-foreground">{stats.withCreatedAt}</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <div className="text-muted-foreground">Apenas createdAt</div>
            <div className="font-semibold text-amber-600 dark:text-amber-400">{stats.onlyCreated}</div>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          original_timestamp = data/hora do formulário de inscrição. createdAt = quando o registro foi criado/importado no banco.
          Para &quot;Data de cadastro&quot; o frontend prioriza original_timestamp.
        </p>
        {(stats.invalidOriginal > 0 || stats.futureOriginal > 0) && (
          <div className="mt-2 text-amber-600 dark:text-amber-400 text-sm">
            {stats.invalidOriginal > 0 && <span>original_timestamp inválido: {stats.invalidOriginal}. </span>}
            {stats.futureOriginal > 0 && <span>original_timestamp no futuro: {stats.futureOriginal}.</span>}
          </div>
        )}
      </section>

      {/* 3. Mapeamento de campos */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
          <FileText size={18} /> Mapeamento de campos
        </h2>
        <div className="text-sm space-y-1">
          <div>Campos obrigatórios (CANDIDATE_FIELDS) ausentes nos dados: {mappingOk.missing.length === 0 ? 'nenhum' : mappingOk.missing.join(', ')}</div>
          <div>Campos esperados (formulário/importação) ausentes: {mappingOk.fromFormsMissing.length === 0 ? 'nenhum' : mappingOk.fromFormsMissing.join(', ')}</div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Lista de campos em src/constants.js (CANDIDATE_FIELDS).
        </p>
      </section>

      {/* 4. Últimos candidatos */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3">
          <Users size={18} /> Últimos 10 candidatos (por data de cadastro)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 px-2">Nome</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">original_timestamp</th>
                <th className="text-left py-2 px-2">createdAt</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-gray-500">Nenhum candidato ou dados não carregados.</td></tr>
              )}
              {recent.map(c => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700/50">
                  <td className="py-2 px-2">{c.fullName || '—'}</td>
                  <td className="py-2 px-2">{c.email || '—'}</td>
                  <td className="py-2 px-2">{formatTs(getTimestampSeconds(c.original_timestamp))}</td>
                  <td className="py-2 px-2">{formatTs(getTimestampSeconds(c.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Os dados acima vêm do Supabase. Use o painel do Supabase (Table Editor) para verificar a conexão e o schema.
      </p>
    </div>
  );
}
