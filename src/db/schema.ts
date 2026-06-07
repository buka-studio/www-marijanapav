import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const stats = sqliteTable(
  'stats',
  {
    pathname: text('pathname').notNull(),
    type: text('type').notNull(),
    count: integer('count').notNull().default(0),
  },
  (table) => [
    primaryKey({
      columns: [table.pathname, table.type],
    }),
  ],
);

export const feedback = sqliteTable(
  'feedback',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    feedbackId: text('feedback_id').notNull(),
    message: text('message').notNull(),
    ua: text('ua'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    meta: text('meta').notNull().default('{}'),
  },
  (table) => [
    check('feedback_message_length_check', sql`length(${table.message}) BETWEEN 1 AND 1000`),
    index('feedback_created_at_idx').on(table.createdAt),
    index('feedback_feedback_id_created_idx').on(table.feedbackId, table.createdAt),
  ],
);
