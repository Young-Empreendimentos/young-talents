import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { buscarCidades, resolverCidade, rotuloCidade } from '../../utils/cidades';

/**
 * Seletor de cidade com busca na base do IBGE (a mesma do Pilares).
 * value = código IBGE; label = "Nome/UF" para exibir sem consultar de novo.
 * textoInicial: texto livre a converter quando não há valor (ex.: a cidade do
 * candidato, que no Talents ainda é texto).
 * Vazio = "qualquer cidade" (quando allowEmpty).
 */
export default function CidadeSelect({
  value, label, onChange, textoInicial, placeholder = 'Digite a cidade...', allowEmpty = true,
  emptyLabel = 'Qualquer cidade', className = '',
}) {
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const [opcoes, setOpcoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const caixa = useRef(null);

  // Converte o texto inicial uma vez, se ainda não houver cidade escolhida.
  useEffect(() => {
    let vivo = true;
    if (!value && textoInicial) {
      resolverCidade(textoInicial).then((m) => { if (vivo && m) onChange(m.codigo_ibge, rotuloCidade(m)); });
    }
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textoInicial]);

  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    const id = setTimeout(async () => {
      setBuscando(true);
      const r = await buscarCidades(termo);
      if (vivo) { setOpcoes(r); setBuscando(false); }
    }, 200);
    return () => { vivo = false; clearTimeout(id); };
  }, [termo, aberto]);

  useEffect(() => {
    const fora = (e) => { if (caixa.current && !caixa.current.contains(e.target)) setAberto(false); };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  const escolher = (m) => { onChange(m ? m.codigo_ibge : null, m ? rotuloCidade(m) : ''); setTermo(''); setAberto(false); };

  return (
    <div ref={caixa} className={`relative ${className}`}>
      <div className="flex items-center gap-1 w-full text-xs border border-input rounded px-2 py-1.5 bg-background text-foreground focus-within:ring-1 focus-within:ring-brand-orange">
        <MapPin size={12} className="text-muted-foreground shrink-0" />
        <input
          value={aberto ? termo : (label || '')}
          onChange={(e) => { setTermo(e.target.value); setAberto(true); }}
          onFocus={() => { setTermo(''); setAberto(true); }}
          placeholder={value ? label : (allowEmpty ? emptyLabel : placeholder)}
          className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {value && allowEmpty && (
          <button type="button" onClick={() => escolher(null)} className="text-muted-foreground hover:text-foreground" title={emptyLabel}>
            <X size={12} />
          </button>
        )}
      </div>
      {aberto && (
        <div className="absolute z-[80] mt-1 w-full max-h-56 overflow-y-auto rounded border border-border bg-card shadow-lg text-xs">
          {allowEmpty && (
            <button type="button" onClick={() => escolher(null)} className="block w-full text-left px-2 py-1.5 hover:bg-muted text-muted-foreground italic">
              {emptyLabel}
            </button>
          )}
          {termo.trim().length < 2 ? (
            <p className="px-2 py-1.5 text-muted-foreground">Digite pelo menos 2 letras.</p>
          ) : buscando ? (
            <p className="px-2 py-1.5 text-muted-foreground">Buscando...</p>
          ) : opcoes.length === 0 ? (
            <p className="px-2 py-1.5 text-muted-foreground">Nenhuma cidade encontrada.</p>
          ) : opcoes.map((m) => (
            <button key={m.codigo_ibge} type="button" onClick={() => escolher(m)}
              className={`block w-full text-left px-2 py-1.5 hover:bg-muted ${m.codigo_ibge === value ? 'font-semibold' : ''}`}>
              {m.nome}<span className="text-muted-foreground">/{m.uf}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
