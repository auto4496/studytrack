-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'PROGRAM_MANAGER');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityUnit" AS ENUM ('MINUTES');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email_normalized" VARCHAR(254) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "csrf_token" VARCHAR(64) NOT NULL,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_templates" (
    "id" UUID NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "unit" "ActivityUnit" NOT NULL DEFAULT 'MINUTES',
    "min_minutes" INTEGER NOT NULL,
    "max_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activity_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "template_title_snapshot" VARCHAR(100) NOT NULL,
    "unit" "ActivityUnit" NOT NULL DEFAULT 'MINUTES',
    "min_minutes_snapshot" INTEGER NOT NULL,
    "max_minutes_snapshot" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_target_versions" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "effective_from" DATE NOT NULL,
    "target_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_target_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_entries" (
    "id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "daily_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_normalized_key" ON "users"("email_normalized");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "goals_owner_id_created_at_idx" ON "goals"("owner_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "goal_target_versions_goal_id_effective_from_key" ON "goal_target_versions"("goal_id", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "daily_entries_goal_id_entry_date_key" ON "daily_entries"("goal_id", "entry_date");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_templates" ADD CONSTRAINT "activity_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "activity_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_target_versions" ADD CONSTRAINT "goal_target_versions_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_entries" ADD CONSTRAINT "daily_entries_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Domain constraints that Prisma 6 does not express in its schema.
CREATE UNIQUE INDEX goals_one_active_per_owner_template ON goals(owner_id, template_id) WHERE status = 'ACTIVE';
ALTER TABLE activity_templates ADD CONSTRAINT template_minutes_range CHECK (min_minutes >= 1 AND max_minutes <= 1440 AND min_minutes <= max_minutes);
ALTER TABLE activity_templates ADD CONSTRAINT template_title_nonempty CHECK (length(btrim(title)) BETWEEN 1 AND 100);
ALTER TABLE goals ADD CONSTRAINT goal_snapshot_minutes_range CHECK (min_minutes_snapshot >= 1 AND max_minutes_snapshot <= 1440 AND min_minutes_snapshot <= max_minutes_snapshot);
ALTER TABLE goals ADD CONSTRAINT goal_dates_order CHECK (end_date IS NULL OR end_date >= start_date);
ALTER TABLE goal_target_versions ADD CONSTRAINT target_minutes_range CHECK (target_minutes BETWEEN 1 AND 1440);
ALTER TABLE daily_entries ADD CONSTRAINT entry_minutes_range CHECK (minutes BETWEEN 1 AND 1440);
