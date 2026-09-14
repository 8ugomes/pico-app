import { readFileSync } from 'node:fs';

export const arenaCatalog = JSON.parse(readFileSync(new URL('../src/data/arena-catalog.json', import.meta.url), 'utf8'));
const municipalities = new Map([...readFileSync(new URL('../docs/arena-state-research/municipios.csv', import.meta.url), 'utf8').matchAll(/^"(35\d{5})","([^"]+)"/gm)].map(match => [match[1], match[2]]));
export const retiredDemoIds = ['20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003'];
export function buildArenaCatalogSql(catalog = arenaCatalog) {
  const ids = new Set(), slugs = new Set();
  for (const a of catalog.arenas) {
    if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/.test(a.id) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(a.slug) || a.slug.length > 80 || ids.has(a.id) || slugs.has(a.slug)) throw Error('Invalid or duplicate arena identity');
    ids.add(a.id); slugs.add(a.slug);
    if (municipalities.get(a.municipalityId) !== a.city || !a.region || !a.neighborhood || a.neighborhood.length > 80 || a.city.length > 80 || !a.address || !a.name || a.name.length > 100 || a.description.length > 1000 || `${a.address}\n${a.note}`.length > 500 || !a.sports.length || a.sports.some(s => !['futevolei', 'beach-tennis', 'volei-praia'].includes(s)) || new Set(a.sports).size !== a.sports.length) throw Error('Invalid catalog facts');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a.checkedOn) || !a.sources.length || !Array.isArray(a.photos) || (!a.photos.length && a.photoStatus !== 'pending-rights-review')) throw Error('Source or photo review status missing');
    for (const source of a.sources) { const u = new URL(source.url); if (u.protocol !== 'https:' || u.username || u.password) throw Error('Invalid source URL'); }
  }
  const records = catalog.arenas.map(a => ({ id: a.id, slug: a.slug, name: a.name, description: a.description, city: a.city, neighborhood: a.neighborhood, public_info: [a.address, a.note].filter(Boolean).join('\n'), sports: a.sports }));
  const json = JSON.stringify(records).replaceAll("'", "''");
  return `begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
set local standard_conforming_strings = on;
select pg_advisory_xact_lock(20260913, 17);
create temporary table incoming_arenas on commit drop as
select * from jsonb_to_recordset('${json}'::jsonb) as x(id uuid,slug text,name text,description text,city text,neighborhood text,public_info text,sports jsonb);
do $$ begin
 if exists(select 1 from public.arenas a join incoming_arenas i on a.id=i.id where a.slug<>i.slug or a.is_demo) then raise exception 'Catalog identity collision'; end if;
 if exists(select 1 from incoming_arenas i cross join lateral jsonb_array_elements_text(i.sports) s where not exists(select 1 from public.sports where slug::text=s)) then raise exception 'Sport catalog missing'; end if;
end $$;
-- Existing records, owner edits, photos and sport choices are never overwritten.
with inserted as (
 insert into public.arenas(id,slug,name,description,city,neighborhood,public_info,is_demo,is_public,status)
 select id,slug,name,description,city,neighborhood,public_info,false,true,'active' from incoming_arenas
 on conflict(id) do nothing returning id
)
insert into public.arena_sports(arena_id,sport_id)
select a.id,s.id from inserted a join incoming_arenas i on i.id=a.id
cross join lateral jsonb_array_elements_text(i.sports) sport
join public.sports s on s.slug::text=sport;
-- Retire only the three known fictional fixtures. Preserve their IDs and history.
update public.arenas set is_public=false,status='archived',version=version+1
where id in (${retiredDemoIds.map(id => `'${id}'`).join(',')}) and is_demo and (is_public or status<>'archived');
select count(*) as catalog_entries from public.arenas a join incoming_arenas i on i.id=a.id;
commit;
`;
}
