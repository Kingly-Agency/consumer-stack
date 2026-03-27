import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = "user-001";

router.get("/notifications", async (_req, res) => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(notificationsTable.createdAt));
  res.json(rows);
});

router.post("/notifications/read-all", async (_req, res) => {
  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.userId, DEFAULT_USER_ID));
  res.json({ ok: true });
});

export default router;
