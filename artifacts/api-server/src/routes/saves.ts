import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { savesTable, postsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = "user-001";

router.post("/posts/:id/save", async (req, res) => {
  const { id } = req.params;
  const existing = await db
    .select()
    .from(savesTable)
    .where(and(eq(savesTable.userId, DEFAULT_USER_ID), eq(savesTable.postId, id)));

  if (existing.length > 0) {
    await db
      .delete(savesTable)
      .where(and(eq(savesTable.userId, DEFAULT_USER_ID), eq(savesTable.postId, id)));
    res.json({ saved: false });
  } else {
    await db.insert(savesTable).values({ userId: DEFAULT_USER_ID, postId: id });
    res.json({ saved: true });
  }
});

router.get("/saved", async (_req, res) => {
  const rows = await db
    .select({ postId: savesTable.postId })
    .from(savesTable)
    .where(eq(savesTable.userId, DEFAULT_USER_ID))
    .orderBy(desc(savesTable.createdAt));
  res.json(rows.map((r) => r.postId));
});

export default router;
