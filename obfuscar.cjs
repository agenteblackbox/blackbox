const { minify: minifyHtml } = require('html-minifier-terser');
const Terser = require('terser');
const fs = require('fs');
const path = require('path');

const files = ['index.html', 'demo.html', 'briefing.html'];
const srcDir = __dirname;

async function obfuscar(html, filename) {
  const scriptRegex = /<script((?!src)(?:\s+[^>]*)?)>([\s\S]*?)<\/script>/gi;
  let match;
  let result = html;

  while ((match = scriptRegex.exec(html)) !== null) {
    const fullTag = match[0];
    const attrs = match[1] || '';
    const content = (match[2] || '').trim();

    if (!content) continue;
    if (attrs.includes('data-od-')) continue;

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
    const filepath = path.join(srcDir, file);
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
