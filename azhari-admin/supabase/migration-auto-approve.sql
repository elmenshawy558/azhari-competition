-- ============================================================================
-- Migration: registrations are now auto-approved instantly instead of
-- sitting PENDING for manual admin review. The admin can still reject a
-- student afterward from the Students tab if needed.
-- ============================================================================

create or replace function students_before_insert()
returns trigger
language plpgsql
as $$
begin
  new.user_id := auth.uid();
  new.approval_status := 'APPROVED';
  new.rejection_reason := null;
  new.updated_at := now();
  return new;
end;
$$;
