// Read-only aggregate audit. Never emit credentials, Auth rows, data or hashes.
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {assertRemoteIdentity} from './environment-guard.mjs';
const env=await assertRemoteIdentity(process.env,'backup');
process.umask(0o077);
const wd=resolve('.vercel/security-'+env.purpose);mkdirSync(wd+'/supabase',{recursive:true});
writeFileSync(wd+'/supabase/config.toml','project_id = "pico-security-audit"\n[auth]\nminimum_password_length = 12\n');
function run(args,cwd){try{return JSON.parse(execFileSync('npx',['--yes','supabase@2.117.0',...args],{cwd,encoding:'utf8',timeout:90000,maxBuffer:8e6,stdio:['ignore','pipe','pipe']}));}catch{throw Error('Read-only security audit failed; no provider output emitted');}}
const sql=`select
(select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')) public_tables,
(select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and not c.relrowsecurity) public_tables_without_rls,
(select count(*)::int from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','pico_private') and p.prosecdef and not coalesce(p.proconfig @> array['search_path=""'],false)) definers_without_empty_search_path,
(select count(*)::int from information_schema.columns where table_schema='public' and column_name ~* '(password|secret|token|email)') public_credential_columns,
(select count(*)::int from auth.users) auth_users,
(select count(*)::int from auth.users where encrypted_password<>'' and encrypted_password !~ '^\\$2[aby]\\$') non_bcrypt_passwords,
has_table_privilege('anon','auth.users','select') anon_auth_read,
has_table_privilege('authenticated','auth.users','select') client_auth_read,
(select count(*)::int from storage.buckets where public) public_buckets,
(select count(*)::int from supabase_migrations.schema_migrations) migrations,
(select count(*)::int from pico_private.platform_grants g join pico_private.beta_admissions a on a.player_id=g.player_id where g.role='admin' and a.status='approved' and not exists(select 1 from public.account_deletions d where d.player_id=g.player_id)) active_operators`;
const db=run(['db','query','--linked',sql,'--workdir',resolve('.vercel/db-'+env.purpose)]).rows[0];
const diff=run(['config','diff','--project-ref',env.projectRef,'--yes'],wd);
const allowed=/^auth\.(minimum_password_length|jwt_expiry|site_url|additional_redirect_urls|enable_signup|email\.(enable_signup|enable_confirmations|secure_password_change|double_confirm_changes|smtp\.enabled)|rate_limit\.[a-z_]+|captcha\.enabled)$/;
const auth=Object.fromEntries((diff.changes||[]).map(c=>[c.path.join('.'),c.remote]).filter(([k])=>allowed.test(k)));
const tls=run(['ssl-enforcement','get','--experimental','--project-ref',env.projectRef]);
const report={at:new Date().toISOString(),projectRef:env.projectRef,db,auth,tlsEnforced:tls.currentConfig?.database===true&&tls.appliedSuccessfully===true};
writeFileSync(wd+'/audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(db.public_tables_without_rls||db.definers_without_empty_search_path||db.public_credential_columns||db.non_bcrypt_passwords||db.anon_auth_read||db.client_auth_read||db.public_buckets||!db.active_operators||!report.tlsEnforced)throw Error('Security boundary needs review');
