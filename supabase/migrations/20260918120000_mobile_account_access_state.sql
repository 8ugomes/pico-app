begin;

-- Account rights must remain reachable even when social admission is suspended.
-- Expose only the caller's coarse access state; never expose the private ledger.
create or replace function public.mobile_account_access_state() returns text
language sql stable security definer set search_path = '' as $$
  select case
    when auth.uid() is null then 'signed_out'
    when exists (
      select 1 from public.account_deletions where player_id = auth.uid()
    ) then 'deletion_pending'
    else coalesce((
      select case status
        when 'approved' then 'active'
        when 'suspended' then 'suspended'
        when 'revoked' then 'revoked'
        else 'restricted'
      end
      from pico_private.beta_admissions
      where player_id = auth.uid()
    ), 'restricted')
  end;
$$;

revoke all on function public.mobile_account_access_state() from public, anon, authenticated;
grant execute on function public.mobile_account_access_state() to authenticated;

commit;
