-- Read-only inventory for a linked development project. Contains no user data.
-- npx supabase db query --linked --file supabase/audit.sql
select jsonb_build_object(
  'tables', (select coalesce(jsonb_agg(jsonb_build_object(
    'name', c.relname, 'rls', c.relrowsecurity, 'forced_rls', c.relforcerowsecurity
  ) order by c.relname), '[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')),
  'policies', (select coalesce(jsonb_agg(to_jsonb(p) order by p.tablename, p.policyname), '[]'::jsonb)
    from pg_policies p where p.schemaname = 'public'),
  'table_grants', (select coalesce(jsonb_agg(to_jsonb(g) order by g.table_name, g.grantee, g.privilege_type), '[]'::jsonb)
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.grantee in ('PUBLIC', 'anon', 'authenticated')),
  'column_grants', (select coalesce(jsonb_agg(to_jsonb(g) order by g.table_name, g.column_name, g.grantee, g.privilege_type), '[]'::jsonb)
    from information_schema.role_column_grants g
    where g.table_schema = 'public' and g.grantee in ('PUBLIC', 'anon', 'authenticated')),
  'functions', (select coalesce(jsonb_agg(jsonb_build_object(
    'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid),
    'security_definer', p.prosecdef, 'config', p.proconfig,
    'anon_execute', has_function_privilege('anon', p.oid, 'EXECUTE'),
    'authenticated_execute', has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ) order by p.proname), '[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public')
) as audit;
