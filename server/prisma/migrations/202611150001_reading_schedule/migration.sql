-- Additive only: existing goals, entries, target versions and sessions are retained.
CREATE TABLE "goal_schedules" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "reminder_enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "goal_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "goal_schedule_days" (
    "schedule_id" UUID NOT NULL,
    "weekday" SMALLINT NOT NULL,
    "reading_minute" SMALLINT NOT NULL,
    "reminder_minute" SMALLINT,
    CONSTRAINT "goal_schedule_days_pkey" PRIMARY KEY ("schedule_id", "weekday"),
    CONSTRAINT "schedule_weekday_range" CHECK ("weekday" BETWEEN 1 AND 7),
    CONSTRAINT "schedule_reading_minute_range" CHECK ("reading_minute" BETWEEN 0 AND 1439),
    CONSTRAINT "schedule_reminder_minute_range" CHECK (
      "reminder_minute" IS NULL OR
      ("reminder_minute" BETWEEN 0 AND 1439 AND "reminder_minute" <= "reading_minute")
    )
);

CREATE UNIQUE INDEX "goal_schedules_goal_id_key" ON "goal_schedules"("goal_id");
ALTER TABLE "goal_schedules" ADD CONSTRAINT "goal_schedules_goal_id_fkey"
  FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "goal_schedule_days" ADD CONSTRAINT "goal_schedule_days_schedule_id_fkey"
  FOREIGN KEY ("schedule_id") REFERENCES "goal_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Child count and parent-toggle/null agreement are validated atomically by the service.
