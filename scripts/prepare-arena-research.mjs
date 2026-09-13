// Read-only research queue. Does not query Google, spend API credits or import arenas.
import { writeFile, mkdir } from 'node:fs/promises';
const source = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios?orderBy=nome';
const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
if (!response.ok) throw Error('Não foi possível consultar os municípios no IBGE.');
const municipalities = await response.json();
if (!Array.isArray(municipalities) || municipalities.length < 600 || municipalities.some(m => !String(m.id).startsWith('35') || !m.nome)) throw Error('Lista de municípios inesperada; nenhum arquivo foi escrito.');
const terms = ['arena beach tennis', 'arena futevôlei', 'quadra vôlei de praia', 'arena esportes de areia', 'beach sports'];
const escape = value => '"' + String(value).replaceAll('"', '""') + '"';
const rows = [['municipio_ibge', 'municipio', 'regiao_intermediaria', 'status', ...terms.map((_, i) => 'google_busca_' + (i + 1)), 'consultado_em', 'candidatos', 'observacoes']];
for (const m of municipalities) {
  const region = m['regiao-imediata']?.['regiao-intermediaria']?.nome ?? m.microrregiao?.mesorregiao?.nome ?? '';
  rows.push([m.id, m.nome, region, 'a pesquisar', ...terms.map(term => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${term} em ${m.nome}, São Paulo, Brasil`)), '', '', '']);
}
await mkdir('docs/arena-state-research', { recursive: true });
// Exclusive creation protects an existing queue with completed research.
await writeFile('docs/arena-state-research/municipios.csv', '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\n') + '\n', { flag: 'wx' });
await writeFile('docs/arena-state-research/provenance.json', JSON.stringify({ source, checkedOn: new Date().toISOString().slice(0, 10), municipalities: municipalities.length, terms, googleSearchesExecuted: 0, arenasImported: 0 }, null, 2) + '\n', { flag: 'wx' });
console.log(`Preparados ${municipalities.length} municípios e ${municipalities.length * terms.length} links de pesquisa. Nenhuma arena importada.`);
