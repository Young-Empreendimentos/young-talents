#!/usr/bin/env bash
# Publica a pasta wiki/ no repositório GitHub Wiki (.wiki.git).
# Pré-requisito (uma vez): criar a primeira página na Wiki no GitHub
#   https://github.com/adventurelabsbrasil/young-talents/wiki
#   (qualquer título/conteúdo mínimo — depois este script sobrescreve com os .md versionados).
set -euo pipefail

REPO_SLUG="adventurelabsbrasil/young-talents"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WIKI_SRC="$ROOT/wiki"

if [[ ! -d "$WIKI_SRC" ]] || [[ ! -f "$WIKI_SRC/Home.md" ]]; then
  echo "Erro: pasta wiki/ ou Home.md não encontrados em $WIKI_SRC"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "Instale o GitHub CLI: https://cli.github.com"
  exit 1
fi

TOKEN="$(gh auth token)"
CLONE_URL="https://x-access-token:${TOKEN}@github.com/${REPO_SLUG}.wiki.git"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! git clone --depth 1 "$CLONE_URL" "$TMP/wiki" 2>/dev/null; then
  echo ""
  echo ">>> O repositório Git da Wiki ainda não existe."
  echo "    No GitHub, abra: https://github.com/${REPO_SLUG}/wiki"
  echo "    Clique em criar a primeira página (ex.: título Home, conteúdo \"# init\"), salve."
  echo "    Em seguida rode este script de novo."
  echo ""
  exit 1
fi

cp -f "$WIKI_SRC"/*.md "$TMP/wiki/" 2>/dev/null || true
cd "$TMP/wiki"
git config user.email "wiki-bot@users.noreply.github.com"
git config user.name "young-talents wiki"
git add -A
if git diff --staged --quiet; then
  echo "Nada a publicar (já está atualizado)."
  exit 0
fi
git commit -m "docs(wiki): sync from repo wiki/ ($(date -u +%Y-%m-%d))"
git push origin HEAD:master 2>/dev/null || git push origin HEAD:main
echo "Wiki publicada: https://github.com/${REPO_SLUG}/wiki"
