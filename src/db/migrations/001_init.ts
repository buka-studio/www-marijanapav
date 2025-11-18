import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
        create table
        stats (
            pathname text not null,
            count integer not null default 0,
            type text not null,
            constraint stats_pkey primary key (
                pathname,
                type
            )
        ) tablespace pg_default;
    `.execute(db);

  await sql`
        CREATE OR REPLACE FUNCTION incr_stat(pathname text, type text, amount int4 DEFAULT 1)
        RETURNS int4 AS $$
        #variable_conflict use_column
        DECLARE
            current_count int4;
        BEGIN
            INSERT INTO stats (pathname, type, count)
            VALUES (incr_stat.pathname, incr_stat.type, incr_stat.amount)
            ON CONFLICT (pathname, type)
            DO UPDATE SET count = stats.count + incr_stat.amount
            RETURNING count INTO current_count;

            RETURN current_count;
        END;
        $$ LANGUAGE plpgsql;
    `.execute(db);
}
