import { Router, type IRouter } from "express";
import healthRouter from "./health";
import careerpilotRouter from "./careerpilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(careerpilotRouter);

export default router;
