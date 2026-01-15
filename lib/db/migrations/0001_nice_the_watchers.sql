CREATE TABLE "gaming_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"tensordock_instance_id" varchar(100) NOT NULL,
	"wolf_api_url" varchar(255) NOT NULL,
	"wolf_api_key" text NOT NULL,
	"wolf_pair_secret" text NOT NULL,
	"server_ip" varchar(45),
	"status" varchar(20) DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gaming_nodes_tensordock_instance_id_unique" UNIQUE("tensordock_instance_id")
);
--> statement-breakpoint
CREATE TABLE "gaming_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"node_id" integer NOT NULL,
	"status" varchar(20) DEFAULT 'starting' NOT NULL,
	"wolf_client_id" varchar(100),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"paired_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"ended_at" timestamp,
	"end_reason" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gaming_sessions" ADD CONSTRAINT "gaming_sessions_node_id_gaming_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."gaming_nodes"("id") ON DELETE no action ON UPDATE no action;