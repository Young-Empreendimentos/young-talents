// Gerador de questões das Avaliações (Talents).
// Dado um "gerador" (tipo de questão) + uma semente, produz uma questão CONCRETA:
// enunciado com números sorteados, 5 alternativas (1 certa + 4 erradas plausíveis) e o
// índice da correta. É DETERMINÍSTICO pela semente → dá pra regerar igual na hora de corrigir,
// sem guardar o gabarito. Como os números mudam por candidato, Google/ChatGPT não acham a
// resposta pronta. Este módulo é puro (sem dependências) p/ rodar no app (Vite) e na edge (Deno).

// ---------- RNG determinístico (mulberry32) ----------
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Combina dois inteiros numa semente estável (ex.: semente do convite + índice da questão)
export function mixSeed(a, b) {
  let h = (a >>> 0) ^ Math.imul((b >>> 0) + 0x9E3779B9, 0x85EBCA6B);
  h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35);
  return (h ^ (h >>> 16)) >>> 0;
}

const randint = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const roundN = (n, d) => { const f = Math.pow(10, d); return Math.round((n + Number.EPSILON) * f) / f; };

// ---------- Formatação pt-BR ----------
const fmtInt = (n) => Math.round(n).toLocaleString('pt-BR');
const fmtMoeda = (n) => 'R$ ' + round2(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 }) + '%';
const fmtNum = (n, d = 2) => roundN(n, d).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: d });

function formata(valor, formato) {
  switch (formato) {
    case 'moeda': return fmtMoeda(valor);
    case 'pct': return fmtPct(valor);
    case 'num2': return fmtNum(valor, 2);
    case 'num4': return fmtNum(valor, 4);
    default: return fmtInt(valor);
  }
}
// chave numérica p/ comparar/deduplicar alternativas (evita "R$ 10,00" ≠ "R$ 10,000")
function chave(valor, formato) {
  const d = formato === 'pct' || formato === 'num4' ? 4 : formato === 'inteiro' || !formato ? 0 : 2;
  return roundN(valor, d).toFixed(d);
}

// Monta a questão final: dedup de alternativas, embaralha e marca a correta.
function build(rng, { enunciado, correto, distratores, formato = 'inteiro', assunto, dificuldade = 1, explicacao = '' }) {
  const alt = [{ v: correto, correta: true }];
  const usados = new Set([chave(correto, formato)]);
  for (const d of distratores) {
    if (d == null || !isFinite(d)) continue;
    const k = chave(d, formato);
    if (usados.has(k)) continue;
    usados.add(k);
    alt.push({ v: d, correta: false });
    if (alt.length >= 5) break;
  }
  // completa até 5 alternativas se algum distrator colidiu (gera vizinhos da correta)
  let passo = Math.max(Math.abs(correto) * 0.07, formato === 'inteiro' ? 1 : 0.5);
  let mult = 2;
  while (alt.length < 5) {
    const cand = correto + (rng() < 0.5 ? -1 : 1) * passo * mult;
    const k = chave(cand, formato);
    if (!usados.has(k) && isFinite(cand)) { usados.add(k); alt.push({ v: cand, correta: false }); }
    mult += 1;
    if (mult > 40) break;
  }
  // embaralho determinístico (Fisher-Yates com o rng)
  for (let i = alt.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [alt[i], alt[j]] = [alt[j], alt[i]];
  }
  const opcoes = alt.map(a => formata(a.v, formato));
  const correta = alt.findIndex(a => a.correta);
  return { enunciado, opcoes, correta, assunto, dificuldade, explicacao };
}

// =====================================================================================
// GERADORES — cada função recebe o rng e devolve a questão concreta.
// =====================================================================================
export const GERADORES = {
  // ---------------- RACIOCÍNIO LÓGICO ----------------
  rl_sequencia(rng) {
    const tipo = pick(rng, ['arit', 'geo', 'arit']);
    const start = randint(rng, 2, 12);
    if (tipo === 'geo') {
      const r = pick(rng, [2, 3]);
      const seq = [start, start * r, start * r * r, start * r * r * r];
      const correto = seq[3] * r;
      return build(rng, {
        enunciado: `Qual é o próximo número da sequência: ${seq.join(', ')}, ... ?`,
        correto, distratores: [correto + start, seq[3] + r, correto - r, seq[3] * (r + 1)],
        formato: 'inteiro', assunto: 'Sequências lógicas', dificuldade: 2,
      });
    }
    const d = randint(rng, 3, 9);
    const seq = [start, start + d, start + 2 * d, start + 3 * d];
    const correto = start + 4 * d;
    return build(rng, {
      enunciado: `Qual é o próximo número da sequência: ${seq.join(', ')}, ... ?`,
      correto, distratores: [correto + d, correto - 1, start + 5 * d, correto + 2],
      formato: 'inteiro', assunto: 'Sequências lógicas', dificuldade: 1,
    });
  },
  rl_regra_tres(rng) {
    const maq = randint(rng, 2, 6);
    const horas = randint(rng, 2, 8);
    const pecasPorMaqHora = randint(rng, 3, 10);
    const pecas = maq * horas * pecasPorMaqHora;
    const novasMaq = maq + randint(rng, 1, 4);
    const correto = pecas / (novasMaq * pecasPorMaqHora); // horas necessárias
    return build(rng, {
      enunciado: `${maq} máquinas produzem ${fmtInt(pecas)} peças em ${horas} horas. Mantendo o mesmo ritmo, em quantas horas ${novasMaq} máquinas produzem as mesmas ${fmtInt(pecas)} peças?`,
      correto, distratores: [horas, correto + 1, pecas / novasMaq, horas * novasMaq / maq + 1],
      formato: 'num2', assunto: 'Raciocínio proporcional', dificuldade: 2,
    });
  },
  rl_datas(rng) {
    const dias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const hoje = randint(rng, 0, 6);
    const n = randint(rng, 10, 90);
    const correto = (hoje + n) % 7;
    const idxDistr = [(hoje + n + 1) % 7, (hoje + n - 1 + 7) % 7, (hoje - n % 7 + 70) % 7, hoje];
    // monta alternativas como texto de dia da semana
    const alt = [{ t: dias[correto], correta: true }];
    const usados = new Set([correto]);
    for (const i of idxDistr) { if (!usados.has(i)) { usados.add(i); alt.push({ t: dias[i], correta: false }); } if (alt.length >= 5) break; }
    let k = 0; while (alt.length < 5) { if (!usados.has(k)) { usados.add(k); alt.push({ t: dias[k], correta: false }); } k++; }
    for (let i = alt.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [alt[i], alt[j]] = [alt[j], alt[i]]; }
    return {
      enunciado: `Se hoje é ${dias[hoje]}, que dia da semana será daqui a ${n} dias?`,
      opcoes: alt.map(a => a.t.charAt(0).toUpperCase() + a.t.slice(1)),
      correta: alt.findIndex(a => a.correta),
      assunto: 'Raciocínio com datas', dificuldade: 2, explicacao: '',
    };
  },
  rl_idade(rng) {
    const b = randint(rng, 8, 30);
    const fator = pick(rng, [2, 3]);
    const a = b * fator;
    const daqui = randint(rng, 3, 12);
    const correto = a + daqui; // idade de A daqui a 'daqui' anos
    return build(rng, {
      enunciado: `Hoje A tem o ${fator === 2 ? 'dobro' : 'triplo'} da idade de B, que tem ${b} anos. Qual será a idade de A daqui a ${daqui} anos?`,
      correto, distratores: [b + daqui, a, a - daqui, (a + daqui) + b],
      formato: 'inteiro', assunto: 'Raciocínio matemático', dificuldade: 2,
    });
  },

  // ---------------- MATEMÁTICA BÁSICA ----------------
  mb_operacao(rng) {
    const op = pick(rng, ['+', '-', '×', '÷']);
    let a, b, correto;
    if (op === '÷') { b = randint(rng, 3, 12); correto = randint(rng, 5, 40); a = b * correto; }
    else if (op === '×') { a = randint(rng, 12, 99); b = randint(rng, 3, 19); correto = a * b; }
    else if (op === '-') { a = randint(rng, 200, 990); b = randint(rng, 20, 199); correto = a - b; }
    else { a = randint(rng, 120, 890); b = randint(rng, 110, 540); correto = a + b; }
    return build(rng, {
      enunciado: `Quanto é ${fmtInt(a)} ${op} ${fmtInt(b)}?`,
      correto, distratores: [correto + (op === '×' ? b : 10), correto - (op === '÷' ? 1 : 9), correto + 1, Math.round(correto * 1.1)],
      formato: 'inteiro', assunto: 'Operações básicas', dificuldade: 1,
    });
  },
  mb_multietapa(rng) {
    const a = randint(rng, 10, 40), b = randint(rng, 5, 30), c = randint(rng, 2, 9), d = randint(rng, 10, 60);
    const correto = (a + b) * c - d;
    return build(rng, {
      enunciado: `Calcule: (${a} + ${b}) × ${c} − ${d}`,
      correto, distratores: [a + b * c - d, (a + b) * c, (a + b) * c - d + d, a + (b * c) - d],
      formato: 'inteiro', assunto: 'Cálculo com várias etapas', dificuldade: 2,
    });
  },
  mb_porcentagem(rng) {
    const base = randint(rng, 4, 40) * 50;
    const pct = pick(rng, [5, 10, 12, 15, 20, 25, 30, 40]);
    const correto = base * pct / 100;
    return build(rng, {
      enunciado: `Quanto é ${pct}% de ${fmtInt(base)}?`,
      correto, distratores: [base * (pct + 5) / 100, base * (pct - 5) / 100, correto / 10, base / pct],
      formato: 'num2', assunto: 'Porcentagem', dificuldade: 1,
    });
  },
  mb_desconto(rng) {
    const preco = randint(rng, 6, 60) * 50;
    const pct = pick(rng, [5, 8, 10, 12, 15, 20, 25, 30]);
    const correto = preco * (1 - pct / 100);
    return build(rng, {
      enunciado: `Um produto custa ${fmtMoeda(preco)} e está com ${pct}% de desconto. Qual o valor final a pagar?`,
      correto, distratores: [preco * pct / 100, preco * (1 + pct / 100), preco - pct, preco * (1 - (pct + 5) / 100)],
      formato: 'moeda', assunto: 'Descontos', dificuldade: 2,
    });
  },
  mb_orcamento(rng) {
    const qtd = randint(rng, 3, 15), unit = randint(rng, 4, 40) * 5, frete = randint(rng, 2, 12) * 10;
    const correto = qtd * unit + frete;
    return build(rng, {
      enunciado: `Comprei ${qtd} unidades de um item a ${fmtMoeda(unit)} cada, mais ${fmtMoeda(frete)} de frete. Qual o total?`,
      correto, distratores: [qtd * unit, qtd * (unit + frete), qtd * unit - frete, (qtd + 1) * unit + frete],
      formato: 'moeda', assunto: 'Pequenos raciocínios', dificuldade: 2,
    });
  },

  // ---------------- MATEMÁTICA FINANCEIRA AVANÇADA ----------------
  mf_juros_composto(rng) {
    const pv = randint(rng, 2, 40) * 500;
    const i = pick(rng, [1, 1.5, 2, 2.5, 3]) / 100;
    const n = randint(rng, 3, 12);
    const vf = pv * Math.pow(1 + i, n);
    return build(rng, {
      enunciado: `Um capital de ${fmtMoeda(pv)} é aplicado a juros compostos de ${fmtNum(i * 100, 2)}% ao mês por ${n} meses. Qual o montante final?`,
      correto: vf,
      distratores: [pv * (1 + i * n), pv * Math.pow(1 + i, n - 1), pv * Math.pow(1 + i, n + 1), vf - pv],
      formato: 'moeda', assunto: 'Juros compostos', dificuldade: 2,
    });
  },
  mf_taxas_acumuladas(rng) {
    const taxas = [pick(rng, [1, 1.2, 1.5, 2]), pick(rng, [0.8, 1, 1.3]), pick(rng, [1, 1.5, 2])].map(x => x / 100);
    const acum = (taxas.reduce((acc, t) => acc * (1 + t), 1) - 1) * 100;
    return build(rng, {
      enunciado: `Um investimento rendeu ${taxas.map(t => fmtNum(t * 100, 2) + '%').join(', ')} em três meses consecutivos. Qual a taxa acumulada no período?`,
      correto: acum,
      distratores: [taxas.reduce((a, t) => a + t * 100, 0), acum + 0.1, acum - 0.2, taxas.reduce((a, t) => a + t * 100, 0) + 0.05],
      formato: 'num4', assunto: 'Taxas acumuladas', dificuldade: 3,
    });
  },
  mf_price(rng) {
    const pv = randint(rng, 4, 40) * 500;
    const i = pick(rng, [1, 1.5, 2, 2.5, 3]) / 100;
    const n = pick(rng, [6, 10, 12, 18, 24]);
    const pmt = pv * i / (1 - Math.pow(1 + i, -n));
    return build(rng, {
      enunciado: `Um financiamento de ${fmtMoeda(pv)} será pago em ${n} parcelas mensais iguais pela Tabela Price, a ${fmtNum(i * 100, 2)}% ao mês. Qual o valor de cada parcela?`,
      correto: pmt,
      distratores: [pv / n, pv / n * (1 + i), pv * i, pv * i / (1 - Math.pow(1 + i, -(n + 1)))],
      formato: 'moeda', assunto: 'Sistema PRICE', dificuldade: 3,
    });
  },
  mf_sac(rng) {
    const pv = randint(rng, 4, 40) * 1000;
    const i = pick(rng, [1, 1.5, 2]) / 100;
    const n = pick(rng, [10, 12, 20, 24]);
    const k = randint(rng, 1, Math.min(4, n));
    const amort = pv / n;
    const saldoAnt = pv - amort * (k - 1);
    const correto = amort + saldoAnt * i; // parcela k no SAC
    return build(rng, {
      enunciado: `Um empréstimo de ${fmtMoeda(pv)} é amortizado pelo SAC em ${n} parcelas, a ${fmtNum(i * 100, 2)}% ao mês. Qual o valor da ${k}ª parcela?`,
      correto,
      distratores: [amort, amort + pv * i, amort + (pv - amort * k) * i, amort * (1 + i)],
      formato: 'moeda', assunto: 'Sistema SAC', dificuldade: 3,
    });
  },
  mf_vpl(rng) {
    const i = pick(rng, [8, 10, 12, 15]) / 100;
    const inv = randint(rng, 2, 10) * 1000;
    const fc = [randint(rng, 1, 5) * 1000, randint(rng, 1, 5) * 1000, randint(rng, 1, 6) * 1000];
    const vpl = -inv + fc.reduce((acc, f, idx) => acc + f / Math.pow(1 + i, idx + 1), 0);
    return build(rng, {
      enunciado: `Um projeto exige investimento de ${fmtMoeda(inv)} hoje e gera fluxos de ${fc.map(f => fmtMoeda(f)).join(', ')} nos próximos 3 anos. À taxa de ${fmtNum(i * 100, 0)}% ao ano, qual o VPL?`,
      correto: vpl,
      distratores: [-inv + fc.reduce((a, f) => a + f, 0), fc.reduce((a, f, idx) => a + f / Math.pow(1 + i, idx + 1), 0), vpl + inv * i, -inv + fc.reduce((a, f, idx) => a + f / Math.pow(1 + i, idx), 0)],
      formato: 'moeda', assunto: 'VPL', dificuldade: 3,
    });
  },
  mf_vf_variavel(rng) {
    const pv = randint(rng, 2, 20) * 1000;
    const taxas = [pick(rng, [1, 2, 3]), pick(rng, [1, 1.5, 2]), pick(rng, [2, 2.5, 3])].map(x => x / 100);
    const vf = taxas.reduce((acc, t) => acc * (1 + t), pv);
    return build(rng, {
      enunciado: `${fmtMoeda(pv)} aplicados com rendimentos de ${taxas.map(t => fmtNum(t * 100, 2) + '%').join(', ')} em três meses. Qual o montante ao final?`,
      correto: vf,
      distratores: [pv * (1 + taxas.reduce((a, t) => a + t, 0)), pv * Math.pow(1 + taxas[0], 3), vf - pv, pv * (1 + taxas.reduce((a, t) => a + t, 0)) + 10],
      formato: 'moeda', assunto: 'VF com taxas variáveis', dificuldade: 3,
    });
  },
};

// Gera uma questão a partir do spec guardado no banco + semente.
// spec.fixa: { opcoes: [...], correta: idx }  (questão de texto fixo)
// spec.parametrizada: { gerador: 'mf_price' }  (usa GERADORES[gerador])
// Catálogo dos geradores (para a tela de montar avaliações escolher o tipo de questão).
export const GERADORES_INFO = [
  { key: 'rl_sequencia', label: 'Sequência numérica', assunto: 'Sequências lógicas', categoria: 'Raciocínio Lógico' },
  { key: 'rl_regra_tres', label: 'Regra de três / produção', assunto: 'Raciocínio proporcional', categoria: 'Raciocínio Lógico' },
  { key: 'rl_datas', label: 'Dia da semana (datas)', assunto: 'Raciocínio com datas', categoria: 'Raciocínio Lógico' },
  { key: 'rl_idade', label: 'Problema de idades', assunto: 'Raciocínio matemático', categoria: 'Raciocínio Lógico' },
  { key: 'mb_operacao', label: 'Operação básica (+ − × ÷)', assunto: 'Operações básicas', categoria: 'Matemática Básica' },
  { key: 'mb_multietapa', label: 'Cálculo de várias etapas', assunto: 'Cálculo com várias etapas', categoria: 'Matemática Básica' },
  { key: 'mb_porcentagem', label: 'Porcentagem de um valor', assunto: 'Porcentagem', categoria: 'Matemática Básica' },
  { key: 'mb_desconto', label: 'Preço com desconto', assunto: 'Descontos', categoria: 'Matemática Básica' },
  { key: 'mb_orcamento', label: 'Orçamento com frete', assunto: 'Pequenos raciocínios', categoria: 'Matemática Básica' },
  { key: 'mf_juros_composto', label: 'Juros compostos (montante)', assunto: 'Juros compostos', categoria: 'Matemática Financeira Avançada' },
  { key: 'mf_taxas_acumuladas', label: 'Taxas acumuladas', assunto: 'Taxas acumuladas', categoria: 'Matemática Financeira Avançada' },
  { key: 'mf_price', label: 'Parcela pela Tabela PRICE', assunto: 'Sistema PRICE', categoria: 'Matemática Financeira Avançada' },
  { key: 'mf_sac', label: 'Parcela pelo SAC', assunto: 'Sistema SAC', categoria: 'Matemática Financeira Avançada' },
  { key: 'mf_vpl', label: 'VPL (Valor Presente Líquido)', assunto: 'VPL', categoria: 'Matemática Financeira Avançada' },
  { key: 'mf_vf_variavel', label: 'VF com taxas variáveis', assunto: 'VF com taxas variáveis', categoria: 'Matemática Financeira Avançada' },
];

export function gerarQuestao(questao, seed) {
  const rng = mulberry32(seed);
  const spec = questao.spec || {};
  if (questao.tipo === 'parametrizada') {
    const fn = GERADORES[spec.gerador];
    if (!fn) throw new Error(`Gerador desconhecido: ${spec.gerador}`);
    const q = fn(rng);
    return { enunciado: q.enunciado, opcoes: q.opcoes, correta: q.correta, assunto: q.assunto || questao.assunto, dificuldade: q.dificuldade || questao.dificuldade };
  }
  // fixa: embaralha as opções pela semente, acompanhando a correta
  const base = (spec.opcoes || []).map((texto, idx) => ({ texto, correta: idx === spec.correta }));
  for (let i = base.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [base[i], base[j]] = [base[j], base[i]]; }
  return {
    enunciado: questao.enunciado,
    opcoes: base.map(b => b.texto),
    correta: base.findIndex(b => b.correta),
    assunto: questao.assunto, dificuldade: questao.dificuldade,
  };
}
