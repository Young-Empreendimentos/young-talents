# Projeto no GitHub (adventurelabsbrasil)

Além do **repositório** [young-talents](https://github.com/adventurelabsbrasil/young-talents), recomenda-se um **GitHub Project** no owner **adventurelabsbrasil** para roadmap, issues e entregas deste ATS.

## Criar e vincular o Project (CLI)

1. Atualizar escopos do `gh` (uma vez):

```bash
gh auth refresh -s project -s read:project
```

2. Criar o projeto:

```bash
gh project create --owner adventurelabsbrasil --title "Young Talents ATS"
```

3. Listar projetos para obter o **número**:

```bash
gh project list --owner adventurelabsbrasil
```

4. Vincular ao repositório (substitua `N` pelo número retornado):

```bash
gh project link N --owner adventurelabsbrasil --repo adventurelabsbrasil/young-talents
```

5. Abrir no navegador:

```bash
gh project view N --owner adventurelabsbrasil --web
```

## Uso sugerido

- Colunas: *Backlog*, *Em andamento*, *Revisão*, *Concluído*  
- Itens: issues do repo `young-talents` + draft issues para ideias  
- Labels no repo para *bug*, *feature*, *docs*, *cliente Young*

---

*Adventure Labs — projeto dedicado ao ATS Young Empreendimentos.*
