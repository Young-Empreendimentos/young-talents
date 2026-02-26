# 📦 Documentação Arquivada

Esta pasta contém documentos **obsoletos** ou **não implementados**, mantidos apenas para referência histórica. O ATS atual usa **Supabase**; não use estes guias para configuração.

## 🔴 Stack antiga (Firebase / Firestore / Google Forms)

| Documento | Motivo do arquivo |
|-----------|-------------------|
| **DELETAR_COLEÇÃO_CANDIDATES.md** | Referente à coleção Firestore `candidates`. O sistema usa Supabase (tabela `young_talents.candidates`). |
| **FIREBASE_SECURITY_FORM.md** | Regras de segurança do Firestore e Cloud Functions Firebase. Formulário público agora envia para Supabase com RLS. |
| **GUIA_APPS_SCRIPT.md** | Integração Google Forms → Firebase via Apps Script. Candidatos entram pelo formulário público `/apply` → Supabase. |
| **MAPEAMENTO_CAMPOS.md** | Mapeamento Forms → Firebase. Para mapeamento atual, ver campos em `src/constants.js` e tabela no Supabase. |
| **CORRECAO_EVENTO_ONFORMSUBMIT.md** | Correção do evento do Google Forms no Apps Script (stack antiga). |
| **CORRECOES_APLICADAS.md** | Correções baseadas em logs do fluxo Forms → Firebase (stack antiga). |

## 📋 Histórico / outros

| Documento | Motivo do arquivo |
|-----------|-------------------|
| **RESUMO_FINAL.md** | Checklist pré-deploy da migração; uso atual: ver [../CHECKLIST_PRE_DEPLOY.md](../CHECKLIST_PRE_DEPLOY.md). |
| **TESTE_COMPLETO.md** | Plano de testes (histórico). |
| **TECHNICAL_CHANGES.md** | Registro de mudanças técnicas (histórico). |

**Nota:** Planejamentos não implementados (ex.: templates de vaga) foram movidos para [../futuras-melhorias/](../futuras-melhorias/).

## ⚠️ Uso

Estes arquivos **não** devem ser usados como documentação ativa. Para setup, usuários e deploy, use os guias na raiz do projeto e em `docs/` (fora de `arquivado/`).
