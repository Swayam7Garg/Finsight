import { Router } from "express";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import * as accountController from "../controllers/account.controller";
import { createAccountSchema, updateAccountSchema } from "@finsight/shared-types";

const router = Router();

// All account routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /accounts:
 *   get:
 *     tags: [Accounts]
 *     summary: List all accounts for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accounts
 */
router.get("/", accountController.list);

/**
 * @swagger
 * /accounts:
 *   post:
 *     tags: [Accounts]
 *     summary: Create a new financial account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit_card, cash, investment]
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Account created
 */
router.post("/", validate(createAccountSchema), accountController.create);

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     tags: [Accounts]
 *     summary: Get a specific account by ID
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
 *         description: Account details
 *       404:
 *         description: Account not found
 */
router.get("/:id", accountController.getById);

/**
 * @swagger
 * /accounts/{id}:
 *   patch:
 *     tags: [Accounts]
 *     summary: Update an account
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
 *               type:
 *                 type: string
 *               balance:
 *                 type: number
 *               currency:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated
 */
router.patch("/:id", validate(updateAccountSchema), accountController.update);

/**
 * @swagger
 * /accounts/{id}:
 *   delete:
 *     tags: [Accounts]
 *     summary: Archive (soft-delete) an account
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
 *         description: Account archived
 */
router.delete("/:id", accountController.archive);

/**
 * @swagger
 * /accounts/{id}/balance-history:
 *   get:
 *     tags: [Accounts]
 *     summary: Get balance history for an account
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
 *         description: Monthly balance history
 */
router.get("/:id/balance-history", accountController.getBalanceHistory);

export default router;
