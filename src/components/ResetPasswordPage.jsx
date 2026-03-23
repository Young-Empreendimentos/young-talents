import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Verifica sessão imediatamente (evento pode ter sido processado antes de montar)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    // Escuta qualquer evento com sessão ativa
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && ['PASSWORD_RECOVERY', 'SIGNED_IN', 'INITIAL_SESSION', 'TOKEN_REFRESHED'].includes(event)) {
        setReady(true);
      }
    });

    // Fallback: re-verifica após 1s caso o evento tenha chegado com delay
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setReady(true);
    }, 1000);

    return () => {
      subscription?.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err?.message || 'Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
        <div className="text-center mb-8">
          <img
            src="/logo-young-empreendimentos-caixa.png"
            alt="Young"
            className="h-14 w-14 mx-auto rounded-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Young Talents</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle size={48} className="text-emerald-500" />
            <p className="text-foreground font-medium">Senha redefinida com sucesso!</p>
            <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
          </div>
        ) : !ready ? (
          <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
            <Loader2 size={32} className="animate-spin" />
            <p className="text-sm">Verificando link de redefinição...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                <AlertCircle size={18} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Nova senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              Salvar nova senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
