# Bot: Resumo semanal de novos candidatos (n8n)

Agente que, **toda segunda às 08:00 (America/Sao_Paulo)**, analisa com IA (Gemini) os
candidatos cadastrados nos **últimos 7 dias** no Young Talents e manda um resumo por
e-mail para **eduardo@ e suelen@youngempreendimentos.com.br**.
(Para testar, envie só para o seu e-mail trocando o campo *To* do nó Gmail.)

Agora ele **tenta ler o arquivo do currículo** (não só os campos de texto): baixa o PDF/imagem
do Google Drive quando o link é público e manda pro Gemini analisar de verdade; quando não
consegue, cai no texto do formulário + link. Cada candidato sai marcado no e-mail com
**📄 CV lido** ou **🔗 só link**.

Também **lê o arquivo do currículo** (PDF ou foto) quando o link do Drive é público, e mostra a
**foto do candidato** (storage do Supabase) no e-mail. Agrupa por **vaga que a pessoa escolheu**
(`area_interesse`, normalizado) e, quando há mais de um por vaga, faz **ranking**.

- Workflow: [`resumo-semanal-novos-candidatos.json`](./resumo-semanal-novos-candidatos.json)
- Fonte de dados: migrations `047`–`050` em [`supabase/migrations`](../supabase/migrations/) (já aplicadas em produção)

## Como funciona

```
Schedule (seg 08:00) → Buscar candidatos → Tem candidato?
   ├─ sim → Separar → Extrair Drive ID → Baixar CV (Drive, best-effort)
   │        → Montar prompt (JSON, texto + CVs) → Gemini (retorna JSON)
   │        → Montar e-mail (HTML bonito + foto) → Gmail
   └─ não → (não envia)
```

- **Buscar candidatos**: RPC `talents_resumo_candidatos_semana(p_dias)` → candidatos do período
  (dedup por e-mail), campos do currículo, `foto` (URL pública) e a vaga escolhida (`area_interesse`).
- **Baixar CV (Drive)** (*Continue on Error*): baixa o PDF/imagem do Drive; se restrito/não-Drive, segue sem o arquivo.
- **Montar prompt (Gemini)**: normaliza as vagas, anexa os CVs e pede ao Gemini **JSON estruturado**
  (por vaga: ranking + `perfil` + `onde_agrega`). Marca `cv_lido` por candidato.
- **Gerar resumo (Gemini)**: `gemini-2.5-flash`, `responseMimeType: application/json`.
- **Montar e-mail (HTML)**: renderiza o e-mail (cabeçalho laranja, cards, foto redonda/iniciais,
  selos de ranking e CV) — layout controlado por código, não pela IA.

## Instalação

### 1. Importar o workflow
No n8n: **Workflows → ⋯ → Import from File** e selecione o `.json`.

### 2. Criar/atacar 4 credenciais (os nós vêm com placeholders)

| Nó | Credencial | Como preencher |
|---|---|---|
| Buscar candidatos (7 dias) | **Supabase API** | Host `https://vvtympzatclvjaqucebr.supabase.co` + **Service Role Secret** (Supabase → Settings → API → `service_role`). |
| Baixar CV (Drive) | **Google Drive OAuth2** | Conta Google Young (pode ser a mesma do Gmail; é só autorizar o escopo do Drive). |
| Gerar resumo (Gemini) | **Query Auth** (genérica) | Name = `key`, Value = sua **API key do Gemini** (Google AI Studio). |
| Enviar e-mail (Gmail) | **Gmail OAuth2** | Conta Google Young que vai enviar. |

> Se a chamada ao Supabase voltar **401**, troque a credencial dos nós HTTP por uma
> **Header Auth** com dois headers: `apikey` e `Authorization: Bearer <service_role>`.

### 3. Testar
Abra o workflow e clique em **Execute Workflow**. O e-mail de teste chega em
`elen@youngempreendimentos.com.br`. Como a janela é fixa (7 dias), pode rodar quantas vezes quiser.

> **Se não houver candidatos nos últimos 7 dias**, o fluxo não envia e-mail (é o esperado).
> Para um teste com dados reais agora, cadastre 1 candidato em `/apply` **ou** peça para
> ampliar temporariamente a janela da RPC (ex.: 30 dias) e depois voltar para 7.

### 4. Produção (depois do teste)
1. Nó **Enviar e-mail (Gmail)** → *To*: `eduardo@youngempreendimentos.com.br, suelen@youngempreendimentos.com.br`.
2. Tire o `[TESTE]` do *Subject*.
3. Ligue o **Active**. (Fuso e cron `0 8 * * 1` já vêm configurados.)

## O que esperar da leitura do CV

- **Lê:** currículos no Google Drive compartilhados como "qualquer pessoa com o link" (o caso comum).
- **Não lê (cai no texto + link):** links restritos, pastas do Drive, Google Docs nativos, e
  provedores fora do Drive (iCloud, Dropbox, WeTransfer, MediaFire).
- O e-mail sempre mostra **quantos CVs foram lidos** e marca cada candidato, pra você saber
  em quais confiar na análise do arquivo e em quais abrir o link na mão.

## Ajustes comuns

- **Destinatários / horário / modelo / prompt:** nós *Enviar e-mail*, *Toda segunda 08:00*,
  *Gerar resumo (Gemini)* (troque `gemini-2.5-flash` na URL; ou use o alias `gemini-flash-latest`) e *Montar prompt (Gemini + CVs)*.
- **Janela (quantos dias olhar):** nó *Buscar candidatos* → Body (JSON). `{}` = 7 dias (padrão).
  Para testar com mais tempo use `{ "p_dias": 60 }`; volte para `{}` na produção.
- **Limite de CVs anexados por e-mail:** constante `MAX_CV` no nó *Montar prompt* (padrão 25).

## Solução definitiva (fase 2, opcional)

Para ler **100%** dos currículos, o certo é o formulário `/apply` **subir o arquivo** para o
Supabase Storage em vez de pedir um link. Aí o CV fica sob controle de vocês e a IA lê sempre.
É uma mudança no app (front + bucket), fora do escopo deste bot.
