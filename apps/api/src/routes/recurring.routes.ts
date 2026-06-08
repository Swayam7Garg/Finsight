import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as recurringController from "../controllers/recurring.controller";
import { createRecurringSchema, updateRecurringSchema } from "@finsight/shared-types";

const router = Router();

// All recurring routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /recurring:
 *   get:
 *     tags: [Recurring]
 *     summary: List all recurring transaction rules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recurring rules
 */
router.get("/", recurringController.list);

/**
 * @swagger
 * /recurring/upcoming:
 *   get:
 *     tags: [Recurring]
 *     summary: Get upcoming recurring transactions (next 30 days)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Upcoming recurring rules
 */
router.get("/upcoming", recurringController.getUpcoming);

/**
 * @swagger
 * /recurring:
 *   post:
 *     tags: [Recurring]
 *     summary: Create a new recurring transaction rule
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, categoryId, type, amount, description, frequency, startDate]
 *             properties:
 *               accountId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               frequency:
 *                 type: string
 *                 enum: [daily, weekly, biweekly, monthly, yearly]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Recurring rule created
 */
router.post("/", validate(createRecurringSchema), recurringController.create);

/**
 * @swagger
 * /recurring/{id}:
 *   patch:
 *     tags: [Recurring]
 *     summary: Update a recurring rule
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
 *               accountId:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               type:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               frequency:
 *                 type: string
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recurring rule updated
 */
router.patch("/:id", validate(updateRecurringSchema), recurringController.update);

/**
 * @swagger
 * /recurring/{id}:
 *   delete:
 *     tags: [Recurring]
 *     summary: Delete a recurring rule
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
 *         description: Recurring rule deleted
 */
router.delete("/:id", recurringController.remove);

/**
 * @swagger
 * /recurring/{id}/mark-paid:
 *   post:
 *     tags: [Recurring]
 *     summary: Mark a recurring rule as paid for the current cycle
 *     description: Creates a real transaction and advances the next due date
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
 *         description: Transaction created and rule advanced
 */
router.post("/:id/mark-paid", recurringController.markAsPaid);

export default router;
