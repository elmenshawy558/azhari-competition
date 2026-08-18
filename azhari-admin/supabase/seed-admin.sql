-- ============================================================================
-- Run this AFTER:
--   1. Running schema.sql
--   2. Creating exactly one user for yourself — either:
--      a) Supabase Dashboard → Authentication → Users → "Add user", or
--      b) having that one person register through the app's normal
--         /register flow like anyone else, then promoting them here.
--
-- Then find that user's UUID (Dashboard → Authentication → Users → copy the
-- "User UID" column) and run:
-- ============================================================================

insert into admins (user_id) values ('PASTE-THE-USER-UUID-HERE');

-- If you ever need to replace the admin (e.g. lost access), first remove the
-- old one, then insert the new one — the trigger only blocks having two at once:
--   delete from admins where user_id = 'OLD-UUID';
--   insert into admins (user_id) values ('NEW-UUID');
