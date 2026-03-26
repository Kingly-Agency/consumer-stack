import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const petsTable = pgTable("pets", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  breed: text("breed"),
  imageData: text("image_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPetSchema = createInsertSchema(petsTable).omit({ createdAt: true });
export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof petsTable.$inferSelect;
