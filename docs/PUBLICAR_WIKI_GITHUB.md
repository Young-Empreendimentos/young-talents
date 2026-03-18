# Publicar a Wiki no GitHub

O conteúdo da Wiki é mantido **no repositório**, na pasta **`wiki/`** (Markdown + `_Sidebar.md`).

## Por que um passo manual?

O GitHub **só cria** o repositório Git da Wiki (`.wiki.git`) depois que existe **pelo menos uma página** criada pela interface. Não há API pública para isso.

## Passo a passo

1. Abra: [Wiki do young-talents](https://github.com/adventurelabsbrasil/young-talents/wiki)
2. Se aparecer “Create the first page”, crie uma página (ex.: título **Home**, corpo `# init`) e salve.
3. Na raiz do projeto:

```bash
chmod +x scripts/publish-github-wiki.sh
./scripts/publish-github-wiki.sh
```

Requer `gh` logado com permissão de escrita no repositório (`gh auth login`).

## Atualizar a Wiki depois

Sempre que editar arquivos em `wiki/`, rode de novo:

```bash
./scripts/publish-github-wiki.sh
```

Opcional: adicionar lembrete no checklist de release.

## Projeto GitHub (board) no owner adventurelabsbrasil

Ver página da Wiki [Projeto-GitHub-Adventure-Labs](https://github.com/adventurelabsbrasil/young-talents/wiki/Projeto-GitHub-Adventure-Labs) ou o mesmo conteúdo em `wiki/Projeto-GitHub-Adventure-Labs.md`.

Resumo:

```bash
gh auth refresh -s project -s read:project
gh project create --owner adventurelabsbrasil --title "Young Talents ATS"
gh project list --owner adventurelabsbrasil
gh project link N --owner adventurelabsbrasil --repo adventurelabsbrasil/young-talents
```

Substitua `N` pelo número do projeto.
