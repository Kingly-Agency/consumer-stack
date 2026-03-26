import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const postsTable = pgTable("posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  petName: text("pet_name").notNull(),
  petType: text("pet_type").notNull(),
  imageData: text("image_data").notNull(),
  style: text("style").notNull(),
  caption: text("caption").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postLikesTable = pgTable("post_likes", {
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
});

export const insertPostSchema = createInsertSchema(postsTable).omit({ createdAt: true, likes: true });
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof postsTable.$inferSelect;
