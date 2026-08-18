-- ============================================================================
-- Migration: switch from 4 score components to a single 0–100 score.
-- Run this once in the SQL Editor on your existing project (schema.sql
-- itself has also been updated to match, for anyone setting up fresh later).
-- Safe to run even if you already have scores entered — existing `final`
-- totals are kept as-is; you'll just enter/edit one number from now on.
-- ============================================================================

alter table scores drop column if exists tajweed;
alter table scores drop column if exists memorization;
alter table scores drop column if exists voice;
alter table scores drop column if exists performance;

alter table scores add constraint scores_final_range check (final between 0 and 100);

create or replace function scores_before_write()
returns trigger
language plpgsql
as $$
begin
  new.status := case when new.final >= 60 then 'PASSED' else 'FAILED' end;
  new.updated_at := now();
  return new;
end;
$$;
