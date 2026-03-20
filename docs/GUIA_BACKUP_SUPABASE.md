# Backup semanal do schema young_talents (Supabase)

O projeto tem um workflow de GitHub Actions que faz backup **apenas do schema `young_talents`** (tenant): estrutura + dados (tabela `candidates`, `user_roles`, `jobs`, `applications`, etc.).

- **Quando roda**: todo domingo às 00:00 UTC e/ou manualmente (Actions → Backup young_talents → Run workflow).
- **Onde fica o backup**:
  - Commit automático em `backups/young_talents/` no repositório.
  - **Cópia no projeto destino**: arquivos enviados para o Storage do projeto Supabase de destino (bucket `backups`, pasta `young_talents/YYYY-MM-DD/`).
- **Notificação**: email enviado a **múltiplos destinatários** (sucesso ou falha) via Resend.

## Secrets no GitHub (Settings → Secrets and variables → Actions)

| Secret | Obrigatório | Descrição |
|--------|-------------|-----------|
| `SUPABASE_DB_URL` | Sim | Connection string do banco **de origem** (projeto de onde o backup é feito). Dashboard do projeto → Settings → Database → Connection string → **URI** (ex.: `postgresql://postgres.[ref]:[SENHA]@...`). |
| `RESEND_API_KEY` | Sim | API key do [Resend](https://resend.com). **Gere uma nova** se a chave já foi exposta em algum lugar. |
| `BACKUP_NOTIFY_EMAIL` | Sim | E-mails internos que recebem notificação (lista separada por vírgula). Configure só no GitHub Secrets — **não** coloque endereços reais na documentação versionada. |
| `RESEND_FROM_EMAIL` | Não | Remetente em domínio **verificado** no Resend (ex.: `noreply@seudominio-verificado.com`). |
| `DESTINATION_SUPABASE_URL` | Sim (para cópia) | URL do projeto Supabase **destino** (`https://<ref>.supabase.co`). Valor apenas em Secrets. |
| `DESTINATION_SUPABASE_SERVICE_ROLE_KEY` | Sim (para cópia) | Chave **service_role** do projeto destino. Dashboard do projeto destino → Settings → API → service_role. Necessária para gravar no Storage. |

## Projeto destino (cópia do backup)

O workflow envia uma cópia dos arquivos de backup para o **Storage** do projeto Supabase de destino:

- **Organization / Project**: configurados via `DESTINATION_SUPABASE_URL` e `DESTINATION_SUPABASE_SERVICE_ROLE_KEY`.
- **Bucket**: `backups` (criado automaticamente se não existir).
- **Caminho**: `young_talents/YYYY-MM-DD/young_talents_schema.sql` e `young_talents_data.sql`.

Os arquivos ficam disponíveis no Dashboard do projeto destino em **Storage → backups**.

## Checklist

1. Repositório **privado**.
2. Secret **`RESEND_FROM_EMAIL`** definido (o workflow não usa mais remetente padrão versionado no YAML).
3. Resend: domínio do remetente verificado conforme o e-mail configurado em `RESEND_FROM_EMAIL`.
4. **Rotacionar** a Resend API key se ela já foi exposta (ex.: em chat).
5. Rodar o workflow manualmente uma vez e conferir: commit no repo, arquivos no Storage do destino e e-mails recebidos.

## Restauração

- **A partir do repo**: usar `backups/young_talents/young_talents_schema.sql` e `young_talents_data.sql`.
- **A partir do projeto destino**: baixar os arquivos do Storage (bucket `backups`, pasta `young_talents/YYYY-MM-DD/`) e aplicar no banco (schema depois dados).
