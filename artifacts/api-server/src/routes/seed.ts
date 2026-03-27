import { Router, type IRouter } from "express";
import { db, postsTable, postLikesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { createGradientPNG, STYLE_PALETTES } from "../lib/seedImages";

const router: IRouter = Router();

const SEED_POSTS = [
  {
    id: "seed-001",
    userId: "user-002",
    userName: "SophiaPaws",
    petName: "Biscuit",
    petType: "Dog",
    style: "Cartoon",
    caption: "My golden boy in cartoon style! He loves this portrait 🐶",
    likes: 42,
  },
  {
    id: "seed-002",
    userId: "user-003",
    userName: "MeowMaster",
    petName: "Luna",
    petType: "Cat",
    style: "Watercolor",
    caption: "Luna in watercolor — she looks like royalty 👑",
    likes: 87,
  },
  {
    id: "seed-003",
    userId: "user-004",
    userName: "RabbitWhisperer",
    petName: "Snowy",
    petType: "Rabbit",
    style: "Oil Paint",
    caption: "Oil painting vibes for my little snowball ❄️",
    likes: 31,
  },
  {
    id: "seed-004",
    userId: "user-005",
    userName: "PoppyArtist",
    petName: "Mango",
    petType: "Dog",
    style: "Pop Art",
    caption: "Mango goes full Andy Warhol 🎨",
    likes: 124,
  },
  {
    id: "seed-005",
    userId: "user-006",
    userName: "SketchLover",
    petName: "Oliver",
    petType: "Cat",
    style: "Sketch",
    caption: "A pencil sketch of my very photogenic Oliver ✏️",
    likes: 56,
  },
  {
    id: "seed-006",
    userId: "user-007",
    userName: "PixelPetFan",
    petName: "Dot",
    petType: "Rabbit",
    style: "Pixel Art",
    caption: "Dot is now an 8-bit legend 👾",
    likes: 73,
  },
  {
    id: "seed-007",
    userId: "user-008",
    userName: "AnimeAddict",
    petName: "Kiki",
    petType: "Cat",
    style: "Anime",
    caption: "Kiki-chan in anime style!! so cutee ⭐",
    likes: 201,
  },
  {
    id: "seed-008",
    userId: "user-009",
    userName: "3DPetWorld",
    petName: "Atlas",
    petType: "Dog",
    style: "3D Render",
    caption: "Atlas looks like he's from a Pixar movie 🎬",
    likes: 95,
  },
  {
    id: "seed-009",
    userId: "user-010",
    userName: "BirdieArt",
    petName: "Sunny",
    petType: "Bird",
    style: "Watercolor",
    caption: "My little parakeet Sunny in soft watercolor 🐦",
    likes: 38,
  },
  {
    id: "seed-010",
    userId: "user-011",
    userName: "HamsterFam",
    petName: "Peanut",
    petType: "Hamster",
    style: "Cartoon",
    caption: "Peanut the hamster in full cartoon mode 🥜",
    likes: 61,
  },
];

router.post("/seed", async (_req, res) => {
  try {
    const existing = await db.select({ count: sql<number>`count(*)` }).from(postsTable);
    const count = Number(existing[0]?.count ?? 0);

    if (count >= 5) {
      res.json({ message: "Already seeded", count });
      return;
    }

    const inserted: string[] = [];

    for (const seed of SEED_POSTS) {
      const palette = STYLE_PALETTES[seed.style] ?? STYLE_PALETTES["Cartoon"];
      const imageData = createGradientPNG(512, 512, palette.top, palette.bottom, palette.accent);

      await db
        .insert(postsTable)
        .values({
          id: seed.id,
          userId: seed.userId,
          userName: seed.userName,
          userAvatar: null,
          petName: seed.petName,
          petType: seed.petType,
          imageData,
          style: seed.style,
          caption: seed.caption,
          likes: seed.likes,
        })
        .onConflictDoNothing();

      // Add some likes from user-001 for variety
      if (["seed-002", "seed-004", "seed-007"].includes(seed.id)) {
        await db
          .insert(postLikesTable)
          .values({ postId: seed.id, userId: "user-001" })
          .onConflictDoNothing();
      }

      inserted.push(seed.id);
    }

    res.json({ message: "Seeded successfully", inserted });
  } catch (err) {
    console.error("Seed error:", err);
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
