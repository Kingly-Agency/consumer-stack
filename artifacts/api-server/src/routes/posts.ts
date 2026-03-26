import { Router, type IRouter } from "express";
import { db, postsTable, postLikesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = "user-001";

router.get("/posts", async (_req, res) => {
  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(desc(postsTable.createdAt));

  const likes = await db
    .select()
    .from(postLikesTable)
    .where(eq(postLikesTable.userId, DEFAULT_USER_ID));
  const likedPostIds = new Set(likes.map((l) => l.postId));

  const result = posts.map((p) => ({
    ...p,
    userAvatar: p.userAvatar ?? undefined,
    likedByMe: likedPostIds.has(p.id),
  }));

  res.json(result);
});

router.post("/posts", async (req, res) => {
  const { petName, petType, imageData, style, caption, userName, userAvatar } = req.body;
  if (!petName || !petType || !imageData || !style || !userName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const [post] = await db
    .insert(postsTable)
    .values({
      id,
      userId: DEFAULT_USER_ID,
      userName,
      userAvatar: userAvatar ?? null,
      petName,
      petType,
      imageData,
      style,
      caption: caption ?? "",
    })
    .returning();
  res.status(201).json({ ...post, likedByMe: false });
});

router.post("/posts/:id/like", async (req, res) => {
  const { id } = req.params;
  const existing = await db
    .select()
    .from(postLikesTable)
    .where(and(eq(postLikesTable.postId, id), eq(postLikesTable.userId, DEFAULT_USER_ID)));

  const currentRows = await db.select().from(postsTable).where(eq(postsTable.id, id));
  if (!currentRows.length) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const current = currentRows[0];

  if (existing.length > 0) {
    await db
      .delete(postLikesTable)
      .where(and(eq(postLikesTable.postId, id), eq(postLikesTable.userId, DEFAULT_USER_ID)));
    const [upd] = await db
      .update(postsTable)
      .set({ likes: Math.max(0, current.likes - 1) })
      .where(eq(postsTable.id, id))
      .returning();
    res.json({ ...upd, likedByMe: false });
  } else {
    await db.insert(postLikesTable).values({ postId: id, userId: DEFAULT_USER_ID });
    const [upd] = await db
      .update(postsTable)
      .set({ likes: current.likes + 1 })
      .where(eq(postsTable.id, id))
      .returning();
    res.json({ ...upd, likedByMe: true });
  }
});

export default router;
