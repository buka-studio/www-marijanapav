import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    create table if not exists feedback (
      id bigserial primary key,
      feedback_id text not null,
      message text not null check (char_length(message) between 1 and 1000),
      ua text,
      created_at timestamptz not null default now(),
      meta jsonb not null default '{}'
    );
  `.execute(db);

  await sql`create index if not exists feedback_created_at_idx on feedback (created_at desc);`.execute(
    db,
  );
  await sql`create index if not exists feedback_feedback_id_created_idx on feedback (feedback_id, created_at desc);`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`drop table if exists feedback;`.execute(db);
}
