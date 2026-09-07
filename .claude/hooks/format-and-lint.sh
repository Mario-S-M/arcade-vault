#!/usr/bin/env bash
# PostToolUse (Write|Edit): formatea con Prettier y autocorrige con ESLint.
# Si ESLint deja errores sin corregir, sale con 2 para devolverlos a Claude.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] && [ -f "$file" ] || exit 0

# Solo archivos dentro del proyecto: nunca tocar planes, memorias ni scratchpad
case "$file" in "$PWD"/*) ;; *) exit 0 ;; esac

case "$file" in
  */node_modules/*|*/.next/*) exit 0 ;;
esac

ext="${file##*.}"
case "$ext" in
  tsx|jsx|ts|js|mjs|cjs|md|mdx) ;;
  *) exit 0 ;;
esac

PRETTIER=./node_modules/.bin/prettier
ESLINT=./node_modules/.bin/eslint

# 1) Prettier siempre (respeta .prettierignore por sí solo)
[ -x "$PRETTIER" ] && "$PRETTIER" --write --ignore-unknown "$file" >/dev/null 2>&1

# 2) ESLint solo para código; Markdown no lo cubre eslint-config-next
case "$ext" in md|mdx) exit 0 ;; esac

if [ -x "$ESLINT" ]; then
  out=$("$ESLINT" --fix "$file" 2>&1) || {
    printf 'ESLint reporta problemas sin autocorregir en %s:\n%s\n' "$file" "$out" >&2
    exit 2
  }
fi
exit 0
