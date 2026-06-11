import { minify as minifyHtml } from 'html-minifier-terser';
import Terser from 'terser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const files = ['index.html', 'demo.html', 'briefing.html'];

async function obfuscar(html, filename) {
  // Extract and obfuscate inline scripts (skip external src= and OD bridge scripts)
  const scriptRegex = /<script((?!src)(?:\s+[^>]*)?)>([\s\S]*?)<\/script>/gi;
  let match;
  let result = html;

  while ((match = scriptRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const attrs = match[1] || '';
    const content = (match[2] || '').trim();

    if (!content) continue;
    if (attrs.includes('data-od-')) continue; // skip OpenDevin bridge scripts

    try {
      const out = await Terser.minify(content, {
        compress: { passes: 2, drop_console: false, unsafe: false },
        mangle: { toplevel: true, properties: false },
        output: { beautify: false, comments: false }
      });

      if (out.code) {
        const newTag = `<script${attrs}>${out.code}</script>`;
        result = result.replace(fullTag, newTag);
      }
    } catch (e) {
      console.warn(`  ⚠️  Script ignorado (${filename}): ${e.message}`);
    }
  }

  // Minify HTML (CSS + estrutura)
  result = await minifyHtml(result, {
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: false,
    removeAttributeQuotes: false,
    removeEmptyAttributes: false,
    removeRedundantAttributes: false,
    collapseBooleanAttributes: false,
    preserveLineBreaks: false
  });

  return result;
}

async function main() {
  for (const file of files) {
    const filepath = path.join(__dirname, file);
    const original = fs.readFileSync(filepath, 'utf-8');
    const originalSize = original.length;

    console.log(`🔧 ${file} (${(originalSize / 1024).toFixed(0)}KB)...`);
    const ofuscado = await obfuscar(original, file);
    const newSize = ofuscado.length;

    fs.writeFileSync(filepath, ofuscado, 'utf-8');
    const pct = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(`  ✅ ${file} → ${(newSize / 1024).toFixed(0)}KB (${pct}% menor)`);
  }
  console.log('\n🎯 Ofuscação concluída!');
}

main().catch(e => { console.error('❌', e); process.exit(1); });
