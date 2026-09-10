import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

export const ALICE = '30000000-0000-4000-8000-000000000001';
export const BOB = '30000000-0000-4000-8000-000000000002';
export const VILA = '20000000-0000-4000-8000-000000000001';
export const FUTEVOLEI = '10000000-0000-4000-8000-000000000001';
export const BEACH = '10000000-0000-4000-8000-000000000002';
export const PRIVATE = '20000000-0000-4000-8000-000000000099';

export async function createTestDatabase() {
  const db = new PGlite();
  // Only this disposable test DB emulates the Supabase identity boundary.
  // Production migrations use the real auth.users and verified JWT identity.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create role supabase_auth_admin nologin;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner_id text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select,insert,update,delete on storage.objects to authenticated;
    -- Only the SQL policy boundary is emulated here. Real Storage HTTP behavior
    -- is covered separately against the hosted project.
    create function storage.allow_any_operation(operations text[]) returns boolean language sql stable as
      $$ select coalesce(current_setting('storage.operation',true),'')=any(operations) $$;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    insert into auth.users (id, email) values ('30000000-0000-4000-8000-000000000000', 'before-migration@example.invalid');
  `);
  const directory = new URL('../../supabase/migrations/', import.meta.url);
  for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(name, directory), 'utf8'));
  }
  const seed = await readFile(new URL('../../supabase/seed.sql', import.meta.url), 'utf8');
  await db.exec(seed);
  await db.exec(seed); // Apply twice: fixtures must be idempotent.
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'alice@example.invalid', $3), ($2, 'bob@example.invalid', '{}')`, [ALICE, BOB, JSON.stringify({display_name:'Alice Teste', id:BOB, is_demo:true, role:'admin', username:'stolen'})]);
  await db.exec(`
    insert into public.arenas (id, slug, name, neighborhood, city, is_public)
      values ('${PRIVATE}', 'arena-privada-teste', 'Arena privada de teste', 'Teste', 'Teste', false);
    insert into public.arena_sports (arena_id, sport_id) values ('${PRIVATE}', '${FUTEVOLEI}');
  `);
  await db.exec(`insert into pico_private.beta_admissions(player_id,status) select id,'approved' from public.profiles on conflict do nothing;
    insert into pico_private.environment_identity(purpose,project_ref) values('development','local-pglite');`);
  return db;
}

export async function asUser(db, id, run) {
  await db.exec(`set role ${id === null ? 'anon' : 'authenticated'}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [id ?? '']);
  try { return await run(db); }
  finally { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub', '', false)`); }
}
