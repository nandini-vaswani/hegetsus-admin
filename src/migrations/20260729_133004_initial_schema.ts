import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_journeys_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__journeys_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_variants_scope" AS ENUM('page', 'block', 'field', 'list');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "journeys_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"headline" varchar,
  	"subhead" varchar,
  	"media_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "journeys_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"video_id" integer,
  	"video_label" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "journeys_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "journeys_blocks_rotating_prayer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "journeys_blocks_next_step_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"target_journey_id" integer
  );
  
  CREATE TABLE "journeys_blocks_next_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "journeys" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"intro" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_journeys_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "journeys_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "_journeys_v_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"headline" varchar,
  	"subhead" varchar,
  	"media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_journeys_v_blocks_video" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"title" varchar,
  	"video_id" integer,
  	"video_label" varchar,
  	"caption" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_journeys_v_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_journeys_v_blocks_rotating_prayer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_journeys_v_blocks_next_step_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"target_journey_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_journeys_v_blocks_next_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_journeys_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_intro" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__journeys_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_journeys_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"topics_id" integer
  );
  
  CREATE TABLE "variants_blocks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block" varchar
  );
  
  CREATE TABLE "variants_field_overrides_variants_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"target_journey_id" integer
  );
  
  CREATE TABLE "variants_field_overrides_variants" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "variants_field_overrides" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar,
  	"override_text" varchar,
  	"override_media_id" integer
  );
  
  CREATE TABLE "variants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"name" varchar,
  	"page_id" integer NOT NULL,
  	"block" varchar,
  	"block_type" varchar,
  	"block_visible" boolean DEFAULT true,
  	"block_order" numeric,
  	"surface_key" varchar,
  	"scope" "enum_variants_scope",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"topics_id" integer,
  	"journeys_id" integer,
  	"variants_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_blocks_hero" ADD CONSTRAINT "journeys_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journeys_blocks_hero" ADD CONSTRAINT "journeys_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_blocks_video" ADD CONSTRAINT "journeys_blocks_video_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journeys_blocks_video" ADD CONSTRAINT "journeys_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_blocks_text" ADD CONSTRAINT "journeys_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_blocks_rotating_prayer" ADD CONSTRAINT "journeys_blocks_rotating_prayer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_blocks_next_step_options" ADD CONSTRAINT "journeys_blocks_next_step_options_target_journey_id_journeys_id_fk" FOREIGN KEY ("target_journey_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "journeys_blocks_next_step_options" ADD CONSTRAINT "journeys_blocks_next_step_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journeys_blocks_next_step"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_blocks_next_step" ADD CONSTRAINT "journeys_blocks_next_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_rels" ADD CONSTRAINT "journeys_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "journeys_rels" ADD CONSTRAINT "journeys_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_hero" ADD CONSTRAINT "_journeys_v_blocks_hero_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_hero" ADD CONSTRAINT "_journeys_v_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journeys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_video" ADD CONSTRAINT "_journeys_v_blocks_video_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_video" ADD CONSTRAINT "_journeys_v_blocks_video_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journeys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_text" ADD CONSTRAINT "_journeys_v_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journeys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_rotating_prayer" ADD CONSTRAINT "_journeys_v_blocks_rotating_prayer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journeys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_next_step_options" ADD CONSTRAINT "_journeys_v_blocks_next_step_options_target_journey_id_journeys_id_fk" FOREIGN KEY ("target_journey_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_next_step_options" ADD CONSTRAINT "_journeys_v_blocks_next_step_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journeys_v_blocks_next_step"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_blocks_next_step" ADD CONSTRAINT "_journeys_v_blocks_next_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_journeys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v" ADD CONSTRAINT "_journeys_v_parent_id_journeys_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_journeys_v_rels" ADD CONSTRAINT "_journeys_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_journeys_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_journeys_v_rels" ADD CONSTRAINT "_journeys_v_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants_blocks" ADD CONSTRAINT "variants_blocks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants_field_overrides_variants_items" ADD CONSTRAINT "variants_field_overrides_variants_items_target_journey_id_journeys_id_fk" FOREIGN KEY ("target_journey_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants_field_overrides_variants_items" ADD CONSTRAINT "variants_field_overrides_variants_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants_field_overrides_variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants_field_overrides_variants" ADD CONSTRAINT "variants_field_overrides_variants_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants_field_overrides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants_field_overrides" ADD CONSTRAINT "variants_field_overrides_override_media_id_media_id_fk" FOREIGN KEY ("override_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "variants_field_overrides" ADD CONSTRAINT "variants_field_overrides_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "variants" ADD CONSTRAINT "variants_page_id_journeys_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."journeys"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_journeys_fk" FOREIGN KEY ("journeys_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_variants_fk" FOREIGN KEY ("variants_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "journeys_blocks_hero_order_idx" ON "journeys_blocks_hero" USING btree ("_order");
  CREATE INDEX "journeys_blocks_hero_parent_id_idx" ON "journeys_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "journeys_blocks_hero_path_idx" ON "journeys_blocks_hero" USING btree ("_path");
  CREATE INDEX "journeys_blocks_hero_media_idx" ON "journeys_blocks_hero" USING btree ("media_id");
  CREATE INDEX "journeys_blocks_video_order_idx" ON "journeys_blocks_video" USING btree ("_order");
  CREATE INDEX "journeys_blocks_video_parent_id_idx" ON "journeys_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "journeys_blocks_video_path_idx" ON "journeys_blocks_video" USING btree ("_path");
  CREATE INDEX "journeys_blocks_video_video_idx" ON "journeys_blocks_video" USING btree ("video_id");
  CREATE INDEX "journeys_blocks_text_order_idx" ON "journeys_blocks_text" USING btree ("_order");
  CREATE INDEX "journeys_blocks_text_parent_id_idx" ON "journeys_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "journeys_blocks_text_path_idx" ON "journeys_blocks_text" USING btree ("_path");
  CREATE INDEX "journeys_blocks_rotating_prayer_order_idx" ON "journeys_blocks_rotating_prayer" USING btree ("_order");
  CREATE INDEX "journeys_blocks_rotating_prayer_parent_id_idx" ON "journeys_blocks_rotating_prayer" USING btree ("_parent_id");
  CREATE INDEX "journeys_blocks_rotating_prayer_path_idx" ON "journeys_blocks_rotating_prayer" USING btree ("_path");
  CREATE INDEX "journeys_blocks_next_step_options_order_idx" ON "journeys_blocks_next_step_options" USING btree ("_order");
  CREATE INDEX "journeys_blocks_next_step_options_parent_id_idx" ON "journeys_blocks_next_step_options" USING btree ("_parent_id");
  CREATE INDEX "journeys_blocks_next_step_options_target_journey_idx" ON "journeys_blocks_next_step_options" USING btree ("target_journey_id");
  CREATE INDEX "journeys_blocks_next_step_order_idx" ON "journeys_blocks_next_step" USING btree ("_order");
  CREATE INDEX "journeys_blocks_next_step_parent_id_idx" ON "journeys_blocks_next_step" USING btree ("_parent_id");
  CREATE INDEX "journeys_blocks_next_step_path_idx" ON "journeys_blocks_next_step" USING btree ("_path");
  CREATE UNIQUE INDEX "journeys_slug_idx" ON "journeys" USING btree ("slug");
  CREATE INDEX "journeys_updated_at_idx" ON "journeys" USING btree ("updated_at");
  CREATE INDEX "journeys_created_at_idx" ON "journeys" USING btree ("created_at");
  CREATE INDEX "journeys__status_idx" ON "journeys" USING btree ("_status");
  CREATE INDEX "journeys_rels_order_idx" ON "journeys_rels" USING btree ("order");
  CREATE INDEX "journeys_rels_parent_idx" ON "journeys_rels" USING btree ("parent_id");
  CREATE INDEX "journeys_rels_path_idx" ON "journeys_rels" USING btree ("path");
  CREATE INDEX "journeys_rels_topics_id_idx" ON "journeys_rels" USING btree ("topics_id");
  CREATE INDEX "_journeys_v_blocks_hero_order_idx" ON "_journeys_v_blocks_hero" USING btree ("_order");
  CREATE INDEX "_journeys_v_blocks_hero_parent_id_idx" ON "_journeys_v_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "_journeys_v_blocks_hero_path_idx" ON "_journeys_v_blocks_hero" USING btree ("_path");
  CREATE INDEX "_journeys_v_blocks_hero_media_idx" ON "_journeys_v_blocks_hero" USING btree ("media_id");
  CREATE INDEX "_journeys_v_blocks_video_order_idx" ON "_journeys_v_blocks_video" USING btree ("_order");
  CREATE INDEX "_journeys_v_blocks_video_parent_id_idx" ON "_journeys_v_blocks_video" USING btree ("_parent_id");
  CREATE INDEX "_journeys_v_blocks_video_path_idx" ON "_journeys_v_blocks_video" USING btree ("_path");
  CREATE INDEX "_journeys_v_blocks_video_video_idx" ON "_journeys_v_blocks_video" USING btree ("video_id");
  CREATE INDEX "_journeys_v_blocks_text_order_idx" ON "_journeys_v_blocks_text" USING btree ("_order");
  CREATE INDEX "_journeys_v_blocks_text_parent_id_idx" ON "_journeys_v_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "_journeys_v_blocks_text_path_idx" ON "_journeys_v_blocks_text" USING btree ("_path");
  CREATE INDEX "_journeys_v_blocks_rotating_prayer_order_idx" ON "_journeys_v_blocks_rotating_prayer" USING btree ("_order");
  CREATE INDEX "_journeys_v_blocks_rotating_prayer_parent_id_idx" ON "_journeys_v_blocks_rotating_prayer" USING btree ("_parent_id");
  CREATE INDEX "_journeys_v_blocks_rotating_prayer_path_idx" ON "_journeys_v_blocks_rotating_prayer" USING btree ("_path");
  CREATE INDEX "_journeys_v_blocks_next_step_options_order_idx" ON "_journeys_v_blocks_next_step_options" USING btree ("_order");
  CREATE INDEX "_journeys_v_blocks_next_step_options_parent_id_idx" ON "_journeys_v_blocks_next_step_options" USING btree ("_parent_id");
  CREATE INDEX "_journeys_v_blocks_next_step_options_target_journey_idx" ON "_journeys_v_blocks_next_step_options" USING btree ("target_journey_id");
  CREATE INDEX "_journeys_v_blocks_next_step_order_idx" ON "_journeys_v_blocks_next_step" USING btree ("_order");
  CREATE INDEX "_journeys_v_blocks_next_step_parent_id_idx" ON "_journeys_v_blocks_next_step" USING btree ("_parent_id");
  CREATE INDEX "_journeys_v_blocks_next_step_path_idx" ON "_journeys_v_blocks_next_step" USING btree ("_path");
  CREATE INDEX "_journeys_v_parent_idx" ON "_journeys_v" USING btree ("parent_id");
  CREATE INDEX "_journeys_v_version_version_slug_idx" ON "_journeys_v" USING btree ("version_slug");
  CREATE INDEX "_journeys_v_version_version_updated_at_idx" ON "_journeys_v" USING btree ("version_updated_at");
  CREATE INDEX "_journeys_v_version_version_created_at_idx" ON "_journeys_v" USING btree ("version_created_at");
  CREATE INDEX "_journeys_v_version_version__status_idx" ON "_journeys_v" USING btree ("version__status");
  CREATE INDEX "_journeys_v_created_at_idx" ON "_journeys_v" USING btree ("created_at");
  CREATE INDEX "_journeys_v_updated_at_idx" ON "_journeys_v" USING btree ("updated_at");
  CREATE INDEX "_journeys_v_latest_idx" ON "_journeys_v" USING btree ("latest");
  CREATE INDEX "_journeys_v_rels_order_idx" ON "_journeys_v_rels" USING btree ("order");
  CREATE INDEX "_journeys_v_rels_parent_idx" ON "_journeys_v_rels" USING btree ("parent_id");
  CREATE INDEX "_journeys_v_rels_path_idx" ON "_journeys_v_rels" USING btree ("path");
  CREATE INDEX "_journeys_v_rels_topics_id_idx" ON "_journeys_v_rels" USING btree ("topics_id");
  CREATE INDEX "variants_blocks_order_idx" ON "variants_blocks" USING btree ("_order");
  CREATE INDEX "variants_blocks_parent_id_idx" ON "variants_blocks" USING btree ("_parent_id");
  CREATE INDEX "variants_field_overrides_variants_items_order_idx" ON "variants_field_overrides_variants_items" USING btree ("_order");
  CREATE INDEX "variants_field_overrides_variants_items_parent_id_idx" ON "variants_field_overrides_variants_items" USING btree ("_parent_id");
  CREATE INDEX "variants_field_overrides_variants_items_target_journey_idx" ON "variants_field_overrides_variants_items" USING btree ("target_journey_id");
  CREATE INDEX "variants_field_overrides_variants_order_idx" ON "variants_field_overrides_variants" USING btree ("_order");
  CREATE INDEX "variants_field_overrides_variants_parent_id_idx" ON "variants_field_overrides_variants" USING btree ("_parent_id");
  CREATE INDEX "variants_field_overrides_order_idx" ON "variants_field_overrides" USING btree ("_order");
  CREATE INDEX "variants_field_overrides_parent_id_idx" ON "variants_field_overrides" USING btree ("_parent_id");
  CREATE INDEX "variants_field_overrides_override_media_idx" ON "variants_field_overrides" USING btree ("override_media_id");
  CREATE INDEX "variants_page_idx" ON "variants" USING btree ("page_id");
  CREATE INDEX "variants_updated_at_idx" ON "variants" USING btree ("updated_at");
  CREATE INDEX "variants_created_at_idx" ON "variants" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_journeys_id_idx" ON "payload_locked_documents_rels" USING btree ("journeys_id");
  CREATE INDEX "payload_locked_documents_rels_variants_id_idx" ON "payload_locked_documents_rels" USING btree ("variants_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "journeys_blocks_hero" CASCADE;
  DROP TABLE "journeys_blocks_video" CASCADE;
  DROP TABLE "journeys_blocks_text" CASCADE;
  DROP TABLE "journeys_blocks_rotating_prayer" CASCADE;
  DROP TABLE "journeys_blocks_next_step_options" CASCADE;
  DROP TABLE "journeys_blocks_next_step" CASCADE;
  DROP TABLE "journeys" CASCADE;
  DROP TABLE "journeys_rels" CASCADE;
  DROP TABLE "_journeys_v_blocks_hero" CASCADE;
  DROP TABLE "_journeys_v_blocks_video" CASCADE;
  DROP TABLE "_journeys_v_blocks_text" CASCADE;
  DROP TABLE "_journeys_v_blocks_rotating_prayer" CASCADE;
  DROP TABLE "_journeys_v_blocks_next_step_options" CASCADE;
  DROP TABLE "_journeys_v_blocks_next_step" CASCADE;
  DROP TABLE "_journeys_v" CASCADE;
  DROP TABLE "_journeys_v_rels" CASCADE;
  DROP TABLE "variants_blocks" CASCADE;
  DROP TABLE "variants_field_overrides_variants_items" CASCADE;
  DROP TABLE "variants_field_overrides_variants" CASCADE;
  DROP TABLE "variants_field_overrides" CASCADE;
  DROP TABLE "variants" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_journeys_status";
  DROP TYPE "public"."enum__journeys_v_version_status";
  DROP TYPE "public"."enum_variants_scope";`)
}
