begin;
-- Keep the recipient equality visible to the planner so polling uses the inbox
-- index before evaluating current membership/admission for each visible row.
alter policy notifications_own_read on public.notifications
  using (recipient_id = (select auth.uid())
    and pico_private.can_read_notification(recipient_id, actor_id, community_id));
commit;
