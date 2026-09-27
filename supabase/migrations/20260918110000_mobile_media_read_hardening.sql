begin;

-- Private media is delivered only after the BFF evaluates can_read_media for
-- the current Bearer identity. Keep Storage object reads unavailable even if a
-- broad policy from an interrupted or older rollout survived in an environment.
drop policy if exists pico_media_read on storage.objects;

commit;
