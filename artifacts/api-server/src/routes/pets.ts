import { Router, type IRouter } from "express";
import { db, petsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/pets", async (_req, res) => {
  const pets = await db.select().from(petsTable).orderBy(desc(petsTable.createdAt));
  res.json(pets);
});

router.post("/pets", async (req, res) => {
  const { name, type, breed, imageData } = req.body;
  if (!name || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const [pet] = await db
    .insert(petsTable)
    .values({ id, name, type, breed: breed ?? null, imageData: imageData ?? null })
    .returning();
  res.status(201).json(pet);
});

router.delete("/pets/:id", async (req, res) => {
  await db.delete(petsTable).where(eq(petsTable.id, req.params.id));
  res.status(204).end();
});

export default router;
