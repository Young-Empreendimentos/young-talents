# Planejamento: Templates de descrição de vaga

Página para o usuário **registrar e gerenciar templates de descrição de vaga** para uso posterior ou organização própria (consulta). Formato de **página** (não formulário compacto) para contribuir com o ATS.

## Campos do template

1. **Título da vaga**
2. **Descrição da vaga**
3. **Cargos associados** (relação com a tabela de cargos)
4. **Setores associados** (relação com a tabela de setores)
5. **Imagem de referência** (URL)

## Funcionalidades sugeridas

- Listagem de templates (cards ou lista) com título e preview.
- Criar / editar / excluir template.
- Visualização em formato de página (layout confortável para leitura e edição).
- Uso posterior: ao criar uma nova vaga, opção de “usar template” e preencher título/descrição/cargos/setores a partir do template.
- Organização: filtros ou tags para encontrar templates por cargo ou setor.

## Implementação futura

- Nova rota/aba no app (ex.: **Templates de vaga**).
- Tabela no Supabase: `young_talents.job_templates` com campos acima + `id`, `created_at`, `updated_at`, `created_by`.
- Tela de listagem + tela de edição (ou modal grande) em formato página.
- Na tela de criação/edição de vaga, botão “Usar template” que abre seletor de template e preenche os campos.
