import React, { useState } from 'react';
import { Clock, ShieldX, LogOut, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

/**
 * 2ª validação (padrão Paver): usuário autenticado no Google mas sem acesso ATIVO
 * ao Talents (sem papel em talents_user_roles ou com ativo=false).
 * O pedido em talents_solicitacao_acesso já foi registrado/reaberto no App.
 *
 * status: 'pending' | 'rejected' | null
 */
export default function AccessPendingPage({ user, status }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const rejected = status === 'rejected';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase?.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  };

  const handleRecheck = () => window.location.reload();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border text-center">
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${rejected ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          {rejected
            ? <ShieldX size={32} className="text-red-600 dark:text-red-400" />
            : <Clock size={32} className="text-amber-600 dark:text-amber-400" />}
        </div>

        <h1 className="text-xl font-bold text-foreground">
          {rejected ? 'Acesso não autorizado' : 'Acesso pendente'}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {rejected ? (
            <>
              Seu pedido de acesso ao <strong>Young Talents</strong> foi recusado.
              Se acredita que isso é um engano, fale com um administrador.
            </>
          ) : (
            <>
              Você entrou com sucesso, mas sua conta ainda <strong>não tem acesso liberado</strong> ao
              Young Talents. Registramos sua solicitação — um administrador precisa aprová-la.
              Você receberá acesso assim que for aprovado.
            </>
          )}
        </p>

        {user?.email && (
          <div className="mt-5 rounded-lg border border-border bg-background px-4 py-3 text-sm">
            <span className="text-muted-foreground">Conta: </span>
            <span className="font-medium text-foreground">{user.email}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {!rejected && (
            <button
              type="button"
              onClick={handleRecheck}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Já fui aprovado — verificar novamente
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2.5 px-4 rounded-lg border border-input bg-background text-muted-foreground font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            Sair
          </button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          É candidato? Use o <a href="/apply" className="text-blue-600 dark:text-blue-400 hover:underline">formulário de inscrição</a>.
        </p>
      </div>
    </div>
  );
}
