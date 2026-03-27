import { Router, type IRouter } from "express";
import healthRouter from "./health";
import openaiRouter from "./openai";
import postsRouter from "./posts";
import petsRouter from "./pets";
import profileRouter from "./profile";
import seedRouter from "./seed";
import commentsRouter from "./comments";
import savesRouter from "./saves";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(openaiRouter);
router.use(postsRouter);
router.use(petsRouter);
router.use(profileRouter);
router.use(seedRouter);
router.use(commentsRouter);
router.use(savesRouter);
router.use(notificationsRouter);

export default router;
