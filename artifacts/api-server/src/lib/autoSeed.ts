import { db, postsTable, postLikesTable } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "./logger";
import { createGradientPNG, STYLE_PALETTES } from "./seedImages";

const SEED_POSTS = [
  {
    id: "seed-my-001",
    userId: "user-001",
    userName: "petlover",
    petName: "Buddy",
    petType: "Dog",
    style: "Watercolor",
    caption: "My dog Buddy looking majestic in watercolor 🎨",
    likes: 18,
    likedByUser001: false,
  },
  {
    id: "seed-my-002",
    userId: "user-001",
    userName: "petlover",
    petName: "Whiskers",
    petType: "Cat",
    style: "Pop Art",
    caption: "Pop art Whiskers stealing hearts 😻",
    likes: 34,
    likedByUser001: false,
  },
  {
    id: "seed-001",
    userId: "user-002",
    userName: "SophiaPaws",
    petName: "Biscuit",
    petType: "Dog",
    style: "Cartoon",
    caption: "My golden boy in cartoon style! He loves this portrait 🐶",
    likes: 42,
    likedByUser001: false,
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
    likedByUser001: true,
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
    likedByUser001: false,
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
    likedByUser001: true,
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
    likedByUser001: false,
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
    likedByUser001: false,
  },
  {
    id: "seed-007",
    userId: "user-008",
    userName: "AnimeAddict",
    petName: "Kiki",
    petType: "Cat",
    style: "Anime",
    caption: "Kiki-chan in anime style!! so cute ⭐",
    likes: 201,
    likedByUser001: true,
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
    likedByUser001: false,
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
    likedByUser001: false,
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
    likedByUser001: false,
  },
];

const SEED_NOTIFICATIONS = [
  {
    id: "notif-seed-001",
    userId: "user-001",
    type: "like",
    fromUser: "AnimeAddict",
    fromUserAvatar: null,
    postId: "seed-my-001",
    message: "AnimeAddict liked your Watercolor portrait of Buddy!",
    read: false,
  },
  {
    id: "notif-seed-002",
    userId: "user-001",
    type: "comment",
    fromUser: "SophiaPaws",
    fromUserAvatar: null,
    postId: "seed-my-001",
    message: "SophiaPaws commented: \"Omg this is so beautiful!! 😍\"",
    read: false,
  },
  {
    id: "notif-seed-003",
    userId: "user-001",
    type: "like",
    fromUser: "MeowMaster",
    fromUserAvatar: null,
    postId: "seed-my-002",
    message: "MeowMaster liked your Pop Art portrait of Whiskers!",
    read: true,
  },
  {
    id: "notif-seed-004",
    userId: "user-001",
    type: "comment",
    fromUser: "PixelPetFan",
    fromUserAvatar: null,
    postId: "seed-my-002",
    message: "PixelPetFan commented: \"Whiskers is iconic 👾\"",
    read: true,
  },
  {
    id: "notif-seed-005",
    userId: "user-001",
    type: "like",
    fromUser: "PoppyArtist",
    fromUserAvatar: null,
    postId: "seed-my-001",
    message: "PoppyArtist liked your Watercolor portrait of Buddy!",
    read: false,
  },
];

export async function autoSeed(): Promise<void> {
  try {
    logger.info("Checking seed posts…");

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

      if (seed.likedByUser001) {
        const existingLike = await db
          .select()
          .from(postLikesTable)
          .where(and(eq(postLikesTable.postId, seed.id), eq(postLikesTable.userId, "user-001")));
        if (existingLike.length === 0) {
          await db.insert(postLikesTable).values({ postId: seed.id, userId: "user-001" });
        }
      }
    }

    logger.info("Seeding notifications…");
    for (const notif of SEED_NOTIFICATIONS) {
      const post = SEED_POSTS.find((p) => p.id === notif.postId);
      const palette = post ? (STYLE_PALETTES[post.style] ?? STYLE_PALETTES["Cartoon"]) : STYLE_PALETTES["Cartoon"];
      const postImageData = post
        ? createGradientPNG(512, 512, palette.top, palette.bottom, palette.accent)
        : null;

      await db
        .insert(notificationsTable)
        .values({
          id: notif.id,
          userId: notif.userId,
          type: notif.type,
          fromUser: notif.fromUser,
          fromUserAvatar: notif.fromUserAvatar,
          postId: notif.postId ?? null,
          postImageData,
          message: notif.message,
          read: notif.read,
        })
        .onConflictDoNothing();
    }

    logger.info({ count: SEED_POSTS.length }, "Seed complete");
  } catch (err) {
    logger.error({ err }, "Auto-seed failed (non-fatal)");
  }
}
