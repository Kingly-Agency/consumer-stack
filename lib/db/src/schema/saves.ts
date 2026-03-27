import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const savesTable = pgTable(
  "saves",
  {
    userId: text("user_id").notNull(),
    postId: text("post_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export type Save = typeof savesTable.$inferSelect;
