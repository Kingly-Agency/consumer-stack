import { Router, type IRouter } from "express";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { GenerateOpenaiImageBody as GenerateOpenaiImageBodySchema } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/openai/generate-image", async (req, res) => {
  const parsed = GenerateOpenaiImageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { prompt, size } = parsed.data;
  const buffer = await generateImageBuffer(
    prompt,
    (size as "1024x1024" | "512x512" | "256x256") ?? "1024x1024"
  );
  res.json({ b64_json: buffer.toString("base64") });
});

export default router;
