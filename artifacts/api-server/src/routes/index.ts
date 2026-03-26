import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import postsRouter from "./posts";
import petsRouter from "./pets";
import profileRouter from "./profile";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(postsRouter);
router.use(petsRouter);
router.use(profileRouter);

export default router;
