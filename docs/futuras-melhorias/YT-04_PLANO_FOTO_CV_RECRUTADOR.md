# YT-04 – Foto e currículo sem depender de “autorização” do candidato (plano)

**Issue:** [#4](https://github.com/adventurelabsbrasil/young-talents/issues/4) (aberta até implementação)

## Contexto atual

- Foto e CV são **URLs** (Google Drive, etc.) em `photo_url` / `cv_url`.
- O componente **`LinkStatusBadge`** / **`useLinkStatus`** indica quando o link falha (403, CORS, expirado) com mensagem no estilo *“solicite novo envio”* — isso é confundido com “falta autorização do candidato”, mas na prática é **disponibilidade do link**, não um fluxo legal de consentimento no app.

## Plano de entrega (fases)

### 1. Jurídico / produto (obrigatório antes de mudar copy agressivo)

- Garantir nos **termos / aviso do formulário público** que o envio de foto e CV no processo seletivo autoriza **uso interno pelos recrutadores** da Young (sem depender de um segundo “ok” no app).
- Documento interno ou parecer: base legal (LGPD – execução de processo seletivo / legítimo interesse com transparência).

### 2. UX para usuários autenticados (recrutadores)

- Para **`authenticated`** (admin/editor/viewer com acesso ao ATS):
  - **Sempre mostrar** links de foto e CV como hoje (`<a href=...>`).
  - Ajustar textos do **LinkStatusBadge**: distinguir *“link indisponível / permissão do Drive”* de qualquer ideia de *“autorização do candidato”*.
  - Opcional: botão *“Abrir em nova aba”* + tooltip explicando que links do Drive podem exigir conta Google.

### 3. O que NÃO resolve só no front

- Se o arquivo está em Drive **privado**, nem recrutador verá sem acesso — soluções possíveis:
  - **Upload para storage** controlado pelo projeto (Supabase Storage / bucket com RLS por tenant), **ou**
  - Instrução no formulário: *“use link público ou anexe via …”*.

### 4. Remoção de fluxo “solicitar autorização” (se existir)

- Mapear qualquer tela ou texto que implique **pedido de autorização explícita** ao candidato para ver dados já enviados na inscrição; remover ou substituir pelo aviso legal da fase 1.

## Arquivos prováveis no código

- `src/components/ui/LinkStatusBadge.jsx`
- `src/utils/useLinkStatus.js`
- `src/components/candidate-profile/tabs/OverviewTab.jsx`, `PersonalTab.jsx`
- `src/components/PublicCandidateForm.jsx` (textos legais)

## Documentação relacionada

- `docs/futuras-melhorias/ISSUES_CARLA_ATS_2026.md` (YT-04)
