const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = __dirname;
const DIST = path.join(ROOT, 'dist');

// Read source files
const template = fs.readFileSync(path.join(SRC, 'template.html'), 'utf-8');
const content = JSON.parse(fs.readFileSync(path.join(SRC, 'content.json'), 'utf-8'));

// Resolve a dot-separated path against an object: "hero.headline" -> content.hero.headline
function resolve(obj, dotPath) {
  return dotPath.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

// Process {{#each path}} ... {{/each}} blocks (supports nesting)
function processEachBlocks(html, data) {
  const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
  let result = html;
  let safety = 0;

  // Repeat until no more #each blocks (handles nested blocks inside-out)
  while (eachRegex.test(result) && safety < 20) {
    safety++;
    result = result.replace(eachRegex, (_, arrayPath, inner) => {
      const items = resolve(data, arrayPath);
      if (!Array.isArray(items)) return '';

      return items.map((item, index) => {
        let rendered = inner;

        // Replace {{this}} for simple values (strings, numbers)
        if (typeof item !== 'object' || item === null) {
          rendered = rendered.replace(/\{\{this\}\}/g, String(item));
        }

        // Replace {{this.property}} with item values
        rendered = rendered.replace(/\{\{this\.([\w.]+)\}\}/g, (__, prop) => {
          const val = resolve(item, prop);
          return val != null ? String(val) : '';
        });

        // Replace {{@index}} with the current index
        rendered = rendered.replace(/\{\{@index\}\}/g, String(index));

        return rendered;
      }).join('');
    });

    eachRegex.lastIndex = 0;
  }

  return result;
}

// Replace simple {{path.to.value}} placeholders
function processPlaceholders(html, data) {
  return html.replace(/\{\{([\w.]+)\}\}/g, (_, dotPath) => {
    const val = resolve(data, dotPath);
    return val != null ? String(val) : '';
  });
}

// Generate structured data JSON-LD from content
function generateJsonLd(data) {
  const scripts = [];

  // MedicalBusiness (extends LocalBusiness)
  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    'name': 'Nuno Jorge \u2014 Fisiologista do Exerc\u00edcio',
    'description': data.meta.description,
    'url': 'https://andrefurt.github.io/nuno-jorge/',
    'telephone': data.contact.phone,
    'areaServed': [
      { '@type': 'City', 'name': 'Porto' },
      { '@type': 'City', 'name': 'Vila Nova de Gaia' }
    ],
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Porto',
      'addressRegion': 'Porto',
      'addressCountry': 'PT'
    }
  });

  // Person
  scripts.push({
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': 'Nuno Jorge',
    'jobTitle': 'Fisiologista do Exerc\u00edcio',
    'alumniOf': [
      { '@type': 'CollegeOrUniversity', 'name': 'Faculdade de Desporto da Universidade do Porto' },
      { '@type': 'CollegeOrUniversity', 'name': 'Faculdade de Medicina da Universidade do Porto' }
    ],
    'worksFor': { '@type': 'Organization', 'name': 'Universidade Fernando Pessoa' },
    'knowsAbout': [
      'Exerc\u00edcio Cl\u00ednico',
      'Oncologia',
      'Pr\u00e9-habilita\u00e7\u00e3o Cir\u00fargica',
      'Reabilita\u00e7\u00e3o Funcional',
      'Envelhecimento Ativo'
    ]
  });

  // FAQPage
  if (data.faq && data.faq.items) {
    scripts.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': data.faq.items.map(item => ({
        '@type': 'Question',
        'name': item.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.answer
        }
      }))
    });
  }

  // Service for each area of intervention
  if (data.services && data.services.items) {
    data.services.items.forEach(service => {
      scripts.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': service.title,
        'description': service.description,
        'provider': {
          '@type': 'Person',
          'name': 'Nuno Jorge'
        },
        'areaServed': {
          '@type': 'City',
          'name': 'Porto'
        }
      });
    });
  }

  return scripts.map(s =>
    `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`
  ).join('\n');
}

// Compute derived values
content.computed = {
  whatsapp_url: `https://api.whatsapp.com/send?phone=${content.contact.whatsapp_number}&text=${encodeURIComponent(content.contact.whatsapp_message)}`
};

// Build
let html = template;

// Inject JSON-LD before </head>
const jsonLd = generateJsonLd(content);
html = html.replace('</head>', `${jsonLd}\n</head>`);

// Process template syntax
html = processEachBlocks(html, content);
html = processPlaceholders(html, content);

// Ensure dist directory exists
fs.mkdirSync(DIST, { recursive: true });

// Write output
fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf-8');

// Copy static assets
const assetDirs = ['assets'];
const staticFiles = ['styles.css', 'main.js', 'editor.js'];

assetDirs.forEach(dir => {
  const src = path.join(SRC, dir);
  if (fs.existsSync(src)) {
    copyDirSync(src, path.join(DIST, dir));
  }
});

staticFiles.forEach(file => {
  const src = path.join(SRC, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, file));
  }
});

// Copy root-level files (robots.txt, sitemap.xml, llms.txt)
['robots.txt', 'sitemap.xml', 'llms.txt'].forEach(file => {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DIST, file));
  }
});

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Build complete: dist/index.html');
