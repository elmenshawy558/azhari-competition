-- ============================================================================
-- Migration: rank each student against others at their own memorization
-- level, instead of against everyone regardless of how much they memorized.
-- Run once in the SQL Editor. Existing scores are automatically re-ranked
-- the next time any score changes — to re-rank immediately, this also
-- triggers a harmless no-op update at the end.
-- ============================================================================

create or replace function recompute_ranks()
returns trigger
language plpgsql
as $$
begin
  update scores s
  set rank = ranked.rn
  from (
    select sc.id, row_number() over (
      partition by st.memorization_level
      order by sc.final desc, sc.updated_at asc
    ) as rn
    from scores sc
    join students st on st.id = sc.student_id
  ) ranked
  where ranked.id = s.id and (s.rank is distinct from ranked.rn);
  return null;
end;
$$;

-- Force an immediate re-rank of everyone under the new logic.
update scores set final = final where true;
