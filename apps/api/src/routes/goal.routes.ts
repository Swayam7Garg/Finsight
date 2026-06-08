import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as goalController from "../controllers/goal.controller";
import { createGoalSchema, updateGoalSchema, addFundsSchema } from "@finsight/shared-types";

const router = Router();

// All goal routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /goals:
 *   get:
 *     tags: [Goals]
 *     summary: List all financial goals for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 */
router.get("/", goalController.list);

/**
 * @swagger
 * /goals:
 *   post:
 *     tags: [Goals]
 *     summary: Create a new financial goal
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, targetAmount]
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               currentAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Goal created
 */
router.post("/", validate(createGoalSchema), goalController.create);

/**
 * @swagger
 * /goals/{id}:
 *   patch:
 *     tags: [Goals]
 *     summary: Update a financial goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               targetAmount:
 *                 type: number
 *               currentAmount:
 *                 type: number
 *               deadline:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       200:
 *         description: Goal updated
 */
router.patch("/:id", validate(updateGoalSchema), goalController.update);

/**
 * @swagger
 * /goals/{id}:
 *   delete:
 *     tags: [Goals]
 *     summary: Delete a financial goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Goal deleted
 */
router.delete("/:id", goalController.remove);

/**
 * @swagger
 * /goals/{id}/add-funds:
 *   post:
 *     tags: [Goals]
 *     summary: Add funds toward a financial goal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Funds added to goal
 */
router.post("/:id/add-funds", validate(addFundsSchema), goalController.addFunds);

export default router;
