#!/usr/bin/env bash
# tools/start-file-parser-preview.sh
set -euo pipefail
parser_source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
parser_workspace_dir="$(cd -- "$parser_source_dir/../.." && pwd)"
parser_preview_port="${TOUQIAN_PREVIEW_PORT:-5174}"
parser_preview_dir="${TOUQIAN_PREVIEW_DIR:-/private/tmp/touqian-server-frontend-20261023}"
parser_config_dir="$parser_source_dir/../full-frontend"
parser_dependencies_dir="$parser_workspace_dir/energy-carbon-aigc-frontend/node_modules"
if [[ ! -x "$parser_dependencies_dir/.bin/vite" ]]; then
  echo "缺少本地前端依赖，请先在 energy-carbon-aigc-frontend 中安装依赖。" >&2
  exit 1
fi
mkdir -p "$parser_preview_dir"
cp -R "$parser_source_dir/src" "$parser_preview_dir/"
cp -R "$parser_source_dir/public" "$parser_preview_dir/"
cp "$parser_source_dir/package.json" "$parser_source_dir/tsconfig.json" "$parser_preview_dir/"
for parser_config_file in index.html vite.config.ts tsconfig.app.json tsconfig.node.json vitest.config.ts; do
  cp "$parser_config_dir/$parser_config_file" "$parser_preview_dir/"
done
if [[ ! -e "$parser_preview_dir/node_modules" ]]; then
  ln -s "$parser_dependencies_dir" "$parser_preview_dir/node_modules"
fi
printf '%s\n' "投前平台完整页面：http://127.0.0.1:${parser_preview_port}/ppt-risk-report" '后端代理：127.0.0.1:3000；请登录后选择项目并进入。'
if [[ "${TOUQIAN_PREPARE_ONLY:-0}" == "1" ]]; then exit 0; fi
cd "$parser_preview_dir"
exec ./node_modules/.bin/vite --host 127.0.0.1 --port "$parser_preview_port" --strictPort
