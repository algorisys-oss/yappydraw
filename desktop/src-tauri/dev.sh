#!/usr/bin/env bash
# Launch the Yappy desktop app in dev mode.
#
# Strips the snap-injected GTK/GDK/GIO env vars so the GTK app doesn't load
# snap's `core20` runtime and crash with:
#   symbol lookup error: .../snap/core20/.../libpthread.so.0:
#   undefined symbol: __libc_pthread_init, version GLIBC_PRIVATE
# (happens when launched from a snap-confined shell, e.g. the VS Code snap
# terminal). Harmless to run from a normal terminal too.
#
# Usage:  ./dev.sh            (from desktop/src-tauri/)
set -euo pipefail
cd "$(dirname "$0")"
exec env \
  -u GTK_PATH \
  -u GTK_EXE_PREFIX \
  -u GDK_PIXBUF_MODULE_FILE \
  -u GSETTINGS_SCHEMA_DIR \
  -u GIO_MODULE_DIR \
  -u GTK_IM_MODULE_FILE \
  -u LOCPATH \
  -u GCONV_PATH \
  cargo tauri dev "$@"
