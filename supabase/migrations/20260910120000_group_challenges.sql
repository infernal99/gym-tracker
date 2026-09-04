-- Group challenges reuse the existing challenges/challenge_participants
-- tables (via the group_id column added earlier) rather than a parallel
-- system. This adds what's missing to support them properly:

-- 1. 'streak' as a challenge metric — the spec's "racha" challenge type has
--    no equivalent in the existing enum. Must be its own statement/migration:
--    Postgres won't let a newly added enum label be referenced inside the
--    same transaction that added it.
alter type challenge_metric add value if not exists 'streak';
