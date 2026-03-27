import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { commentsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = "user-001";
const DEFAULT_USER_NAME = "petlover";

router.get("/posts/:id/comments", async (req, res) => {
  const { id } = req.params;
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, id))
    .orderBy(asc(commentsTable.createdAt));
  res.json(comments);
});

router.post("/posts/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    res.status(400).json({ error: "Comment text is required" });
    return;
  }
  const commentId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const [comment] = await db
    .insert(commentsTable)
    .values({
      id: commentId,
      postId: id,
      userId: DEFAULT_USER_ID,
      userName: DEFAULT_USER_NAME,
      text: text.trim(),
    })
    .returning();
  res.status(201).json(comment);
});

router.delete("/posts/:id/comments/:commentId", async (req, res) => {
  const { commentId } = req.params;
  await db
    .delete(commentsTable)
    .where(eq(commentsTable.id, commentId));
  res.status(204).send();
});

export default router;
