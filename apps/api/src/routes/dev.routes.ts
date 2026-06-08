import { Router } from "express";
import { seedDemoData } from "../seeds/demo.seed";

const router = Router();

/**
 * @swagger
 * /dev/seed:
 *   post:
 *     summary: Seed demo data
 *     description: |
 *       Seeds the database with demo user, accounts, transactions, budgets, goals, categories,
 *       and recurring rules. Only available in non-production environments.
 *       Returns the demo user credentials for testing.
 *     tags: [Dev]
 *     security: []
 *     responses:
 *       200:
 *         description: Demo data seeded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Demo data seeded successfully
 *                     credentials:
 *                       type: object
 *                       properties:
 *                         email:
 *                           type: string
 *                         password:
 *                           type: string
 *       500:
 *         description: Seeding failed
 */
router.post("/seed", async (_req, res, next) => {
  try {
    const result = await seedDemoData();
    res.status(200).json({
      success: true,
      data: {
        message: "Demo data seeded successfully",
        credentials: result,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
