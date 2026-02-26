// Vite plugin for AssemblyScript compilation
// Watches assembly/**/*.ts, runs `asc` compiler, outputs .wasm to build/

import { execSync } from 'child_process';
import path from 'path';
import type { Plugin } from 'vite';

const AS_DIR = path.resolve(__dirname, 'assemblyscript');
const BUILD_DIR = path.resolve(__dirname, 'build');

function compileAssemblyScript(target: 'debug' | 'release' = 'debug'): boolean {
  try {
    execSync(`npx asc --target ${target}`, {
      cwd: AS_DIR,
      stdio: 'pipe',
    });
    return true;
  } catch (err: any) {
    const stderr = err.stderr?.toString() || err.message;
    console.error(`[assemblyscript] Compilation failed:\n${stderr}`);
    return false;
  }
}

export function assemblyScriptPlugin(): Plugin {
  let isDev = false;

  return {
    name: 'vite-plugin-assemblyscript',

    configResolved(config) {
      isDev = config.command === 'serve';
    },

    buildStart() {
      const target = isDev ? 'debug' : 'release';
      const ok = compileAssemblyScript(target);
      if (ok) {
        console.log(`[assemblyscript] Compiled (${target})`);
      }
    },

    handleHotUpdate({ file }) {
      // Recompile when any AS source file changes
      const relPath = path.relative(path.resolve(__dirname), file);
      if (relPath.startsWith('assemblyscript/assembly/')) {
        console.log(`[assemblyscript] Source changed: ${path.basename(file)}`);
        const ok = compileAssemblyScript('debug');
        if (ok) {
          console.log('[assemblyscript] Recompiled (debug)');
        }
        // Return empty array to let Vite handle the HMR
        return [];
      }
    },

    configureServer(server) {
      // Serve .wasm files from the build directory with correct MIME type
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          const wasmPath = path.join(BUILD_DIR, path.basename(req.url));
          try {
            const fs = require('fs');
            if (fs.existsSync(wasmPath)) {
              res.setHeader('Content-Type', 'application/wasm');
              fs.createReadStream(wasmPath).pipe(res);
              return;
            }
          } catch {
            // fall through to next middleware
          }
        }
        next();
      });
    },
  };
}
