import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { normalizeCity } from '../utils/cityNormalizer';
import { normalizeSource } from '../utils/sourceNormalizer';
import { normalizeInterestAreasString } from '../utils/interestAreaNormalizer';
import { normalizeChildrenForStorage } from '../utils/childrenNormalizer';
import { Loader2, CheckCircle, AlertCircle, Send, ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react';

/**
 * Gera um payload realista de candidato (mesmo formato que o PublicCandidateForm envia ao Supabase).
 * Email único para evitar conflito de UNIQUE.
 */
function buildTestPayload() {
  const ts = Date.now();
  const email = `teste.cadastro.${ts}@exemplo.com.br`;

  const normalizedData = {
    full_name: 'Maria Fernanda Silva Santos',
    email,
    email_secondary: 'maria.fernanda.pessoal@gmail.com',
    phone: '(51) 99876-5432',
    birth_date: '1992-05-15',
    age: 32,
    marital_status: 'Casado(a)',
    children_count: normalizeChildrenForStorage('2'),
    has_license: 'Sim',
    city: normalizeCity('Porto Alegre/RS'),
    photo_url: null,
    education: 'Engenharia Civil',
    schooling_level: 'Superior Completo',
    institution: 'Universidade Federal do Rio Grande do Sul',
    graduation_date: '2015-12-20',
    is_studying: 'Não',
    experience: '5 anos em obras de infraestrutura. Atuação em coordenação de equipe e acompanhamento de cronograma. Experiência com obras públicas e privadas.',
    courses: 'Gestão de Projetos (FGV), BIM Básico (SENAC)',
    certifications: 'CREA-RS ativo, PMP em andamento',
    interest_areas: normalizeInterestAreasString('Engenharia, Gestão de Projetos, Obras'),
    cv_url: 'https://drive.google.com/exemplo-curriculo-maria',
    portfolio_url: null,
    source: normalizeSource('LinkedIn'),
    referral: 'João da Silva (colaborador Young)',
    salary_expectation: 'R$ 12.000,00',
    can_relocate: 'Sim',
    professional_references: 'Carlos Mendes - Eng. Coordenador - Construtora XYZ - (51) 3333-4444. Ana Costa - Diretora - Empresa ABC.',
    type_of_app: 'Banco de Talentos',
    free_field: 'Busco oportunidade de atuar em projetos de grande porte. Tenho disponibilidade para viagens e grande interesse em desenvolvimento na área de gestão.',
    status: 'Inscrito',
    tags: ['Novo Inscrito', 'Formulário Público'],
    origin: 'public_form',
    created_by: 'Formulário Público',
    original_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  // Remover campos null/undefined (como no form)
  Object.keys(normalizedData).forEach(key => {
    if (normalizedData[key] === '' || normalizedData[key] === null || normalizedData[key] === undefined) {
      delete normalizedData[key];
    }
  });

  return normalizedData;
}

export default function FormSubmitTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, payload, data, error }
  const [copied, setCopied] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = buildTestPayload();
      const { data, error } = await supabase
        .from('talents_candidates')
        .insert([payload])
        .select();

      if (error) throw error;
      setResult({
        success: true,
        payload,
        data: data && data[0] ? data[0] : data,
        error: null
      });
    } catch (err) {
      setResult({
        success: false,
        payload: buildTestPayload(),
        data: null,
        error: err?.message || String(err)
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-sm p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Supabase não configurado</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</p>
          <Link to="/apply" className="inline-flex items-center gap-2 mt-6 text-young-orange hover:underline">
            <ArrowLeft size={18} /> Voltar ao formulário
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 font-young">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-center mb-6">
          <img src="/logo-young-empreendimentos.png" alt="Young Empreendimentos" className="h-12 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
          Teste de envio do formulário
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8 text-sm">
          Envia um cadastro realista para o Supabase e mostra o payload e a resposta. Use para validar se os dados chegam ao banco e se aparecem corretamente no frontend.
        </p>

        <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
          <button
            type="button"
            onClick={runTest}
            disabled={loading}
            className="w-full py-3 px-4 bg-young-orange hover:bg-young-orange-hover text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar candidato de teste (dados realistas)
              </>
            )}
          </button>
        </div>

        {result && (
          <div className="space-y-6">
            {/* Resultado geral */}
            <div className={`rounded-lg shadow-sm p-6 ${result.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-3 mb-2">
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {result.success ? 'Enviado com sucesso' : 'Erro no envio'}
                  </h2>
                  {result.success && result.data?.id && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ID no Supabase: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{result.data.id}</code>
                      {' · '}
                      <Link to={`/candidate/${result.data.id}`} className="text-young-orange hover:underline inline-flex items-center gap-1">
                        Ver perfil (após login) <ExternalLink size={14} />
                      </Link>
                    </p>
                  )}
                  {!result.success && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">{result.error}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payload enviado */}
            <div className="bg-card rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-muted-foreground">Payload enviado ao Supabase</h3>
                <button
                  type="button"
                  onClick={() => copyToClipboard(JSON.stringify(result.payload, null, 2))}
                  className="text-xs flex items-center gap-1 text-young-orange hover:underline"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-64 text-gray-800 dark:text-gray-200">
                {JSON.stringify(result.payload, null, 2)}
              </pre>
            </div>

            {/* Resposta do Supabase (quando sucesso) */}
            {result.success && result.data && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-bold text-muted-foreground mb-3">Registro retornado pelo Supabase</h3>
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-64 text-gray-800 dark:text-gray-200">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
                <p className="text-xs text-muted-foreground mt-3">
                  Se o app carregar candidatos do Supabase, este registro deve aparecer no Banco de Talentos e no Pipeline. Verifique também no painel do Supabase (Table Editor → candidates).
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/apply" className="inline-flex items-center gap-2 text-muted-foreground hover:text-young-orange">
            <ArrowLeft size={18} /> Formulário público
          </Link>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-muted-foreground hover:text-young-orange">
            Supabase Dashboard <ExternalLink size={16} />
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-6 text-center">© 2025 Young Empreendimentos</p>
      </div>
    </div>
  );
}
