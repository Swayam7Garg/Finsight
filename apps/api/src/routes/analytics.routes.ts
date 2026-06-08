import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as analyticsController from "../controllers/analytics.controller";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /analytics/spending-by-category:
 *   get:
 *     tags: [Analytics]
 *     summary: Get spending breakdown by category for a date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Spending by category with totals and percentages
 */
router.get("/spending-by-category", analyticsController.spendingByCategory);

/**
 * @swagger
 * /analytics/income-vs-expense:
 *   get:
 *     tags: [Analytics]
 *     summary: Get monthly income vs. expense comparison
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly income vs expense data
 */
router.get("/income-vs-expense", analyticsController.incomeVsExpense);

/**
 * @swagger
 * /analytics/monthly-summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get summary totals for a specific month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Monthly summary with income, expense, savings
 */
router.get("/monthly-summary", analyticsController.monthlySummary);

/**
 * @swagger
 * /analytics/trends:
 *   get:
 *     tags: [Analytics]
 *     summary: Get spending trends over time
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of months to analyze
 *     responses:
 *       200:
 *         description: Monthly spending trend data with percent change
 */
router.get("/trends", analyticsController.trends);

/**
 * @swagger
 * /analytics/net-worth:
 *   get:
 *     tags: [Analytics]
 *     summary: Get net worth over time across all accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly net worth progression
 */
router.get("/net-worth", analyticsController.netWorth);

/**
 * @swagger
 * /analytics/spending-by-day-of-week:
 *   get:
 *     tags: [Analytics]
 *     summary: Get average spending by day of week
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Spending totals and averages by day of week
 */
router.get("/spending-by-day-of-week", analyticsController.spendingByDayOfWeek);

/**
 * @swagger
 * /analytics/category-monthly-breakdown:
 *   get:
 *     tags: [Analytics]
 *     summary: Get expense breakdown by category per month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of months to look back
 *     responses:
 *       200:
 *         description: Monthly expense breakdown by top categories
 */
router.get("/category-monthly-breakdown", analyticsController.categoryMonthlyBreakdown);

export default router;
