import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const DEFAULT_USER_ID = "user-001";
const DEFAULT_PROFILE = {
  id: DEFAULT_USER_ID,
  username: "petlover",
  displayName: "Pet Lover",
  bio: "Sharing my furry friends with the world!",
  avatarData: null,
  postsCount: 0,
  followersCount: 0,
  followingCount: 0,
};

router.get("/profile", async (_req, res) => {
  const profiles = await db.select().from(profilesTable).where(eq(profilesTable.id, DEFAULT_USER_ID));
  if (profiles.length === 0) {
    const [created] = await db.insert(profilesTable).values(DEFAULT_PROFILE).returning();
    res.json(created);
  } else {
    res.json(profiles[0]);
  }
});

router.put("/profile", async (req, res) => {
  const { username, displayName, bio, avatarData } = req.body;
  const profiles = await db.select().from(profilesTable).where(eq(profilesTable.id, DEFAULT_USER_ID));
  if (profiles.length === 0) {
    await db.insert(profilesTable).values(DEFAULT_PROFILE);
  }
  const [updated] = await db
    .update(profilesTable)
    .set({
      ...(username ? { username } : {}),
      ...(displayName ? { displayName } : {}),
      ...(bio !== undefined ? { bio } : {}),
      ...(avatarData !== undefined ? { avatarData } : {}),
    })
    .where(eq(profilesTable.id, DEFAULT_USER_ID))
    .returning();
  res.json(updated);
});

export default router;
