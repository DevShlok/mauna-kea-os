-- ─── Migration 0031: Workflow Audit — Schema Fixes ───────────────────────────
--
-- 1. Add soft-cascade FK on consultant_notifications.user_id → platform_users.id
--    Previously this was a plain varchar with no constraint, so notifications for
--    deleted users accumulated as permanent orphans.
--
-- 2. Add an index on consultant_notifications.user_id to support the common
--    WHERE user_id = ? OR target_role = ? OR (user_id IS NULL AND target_role IS NULL) query.
--
-- Uses idempotent DO$$ blocks so the migration is safe to re-run.

-- 1. FK: consultant_notifications.user_id → platform_users.id (SET NULL on delete)
--    We use SET NULL (not CASCADE) because a soft-deleted consultant should still
--    have their old notifications visible to admins. Hard-deleting a user will now
--    NULL out user_id on their notifications rather than leaving a dangling string.
DO $$ BEGIN
  ALTER TABLE "consultant_notifications"
    ADD CONSTRAINT "cn_user_id_platform_users_fk"
    FOREIGN KEY ("user_id")
    REFERENCES "platform_users"("id")
    ON DELETE SET NULL
    ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Index on user_id (supports getConsultantNotificationsAction filter)
CREATE INDEX IF NOT EXISTS "cn_user_id_idx" ON "consultant_notifications" ("user_id");

-- 3. Index on target_role (supports the OR branch for role-targeted notifications)
CREATE INDEX IF NOT EXISTS "cn_target_role_idx" ON "consultant_notifications" ("target_role");
