// Measure uncompressed CSS referenced by production HTML, one route at a time.
// Run after `npm run build` while `npm run start -- -p 3217` serves locally.
const origin = new URL(process.argv[2] ?? 'http://localhost:3217');
const routes = process.argv.slice(3).length ? process.argv.slice(3) : ['/login', '/signup', '/feed', '/notificacoes', '/perfil', '/instalar'];

for (const route of routes) {
  if (!route.startsWith('/') || route.startsWith('//')) throw new Error(`Rota inválida: ${route}`);
  const page = await fetch(new URL(route, origin), { redirect: 'manual' });
  if (!page.ok) throw new Error(`${route}: HTTP ${page.status}`);
  const html = await page.text();
  const stylesheets = new Set(
    [...html.matchAll(/<link\b[^>]*href="([^"]+\.css(?:\?[^"]*)?)"[^>]*>/g)].map((match) => match[1]),
  );
  if (stylesheets.size === 0) throw new Error(`${route}: nenhum CSS encontrado no HTML compilado`);
  let bytes = 0;
  for (const href of stylesheets) {
    const response = await fetch(new URL(href, origin));
    if (!response.ok) throw new Error(`${route}: CSS ${href} retornou HTTP ${response.status}`);
    bytes += (await response.arrayBuffer()).byteLength;
  }
  console.log(`${route}\t${bytes} bytes CSS não comprimido\t${stylesheets.size} arquivo(s)`);
}
