import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as budgetController from "../controllers/budget.controller";
import { createBudgetSchema, updateBudgetSchema } from "@finsight/shared-types";

const router = Router();

// All budget routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /budgets:
 *   get:
 *     tags: [Budgets]
 *     summary: List all budgets for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of budgets
 */
router.get("/", budgetController.list);

/**
 * @swagger
 * /budgets/summary:
 *   get:
 *     tags: [Budgets]
 *     summary: Get budget vs. actual spending summary for current period
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Budget summary with spent amounts and statuses
 */
router.get("/summary", budgetController.getSummary);

/**
 * @swagger
 * /budgets:
 *   post:
 *     tags: [Budgets]
 *     summary: Create a new budget
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, amount, period]
 *             properties:
 *               categoryId:
 *                 type: string
 *               amount:
 *                 type: number
 *               period:
 *                 type: string
 *                 enum: [monthly, weekly]
 *               alertThreshold:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *     responses:
 *       201:
 *         description: Budget created
 */
router.post("/", validate(createBudgetSchema), budgetController.create);

/**
 * @swagger
 * /budgets/{id}:
 *   patch:
 *     tags: [Budgets]
 *     summary: Update a budget
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
 *               categoryId:
 *                 type: string
 *               amount:
 *                 type: number
 *               period:
 *                 type: string
 *               alertThreshold:
 *                 type: number
 *     responses:
 *       200:
 *         description: Budget updated
 */
router.patch("/:id", validate(updateBudgetSchema), budgetController.update);

/**
 * @swagger
 * /budgets/{id}:
 *   delete:
 *     tags: [Budgets]
 *     summary: Delete a budget
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
 *         description: Budget deleted
 */
router.delete("/:id", budgetController.remove);

export default router;
