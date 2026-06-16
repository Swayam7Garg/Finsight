import { z } from "zod";

export const financialHealthGradeEnum = z.enum(["A", "B", "C", "D", "F"]);

export const financialHealthStatusEnum = z.enum([
  "excellent",
  "good",
  "fair",
  "watch",
  "at_risk",
  "critical",
  "needs_data",
]);

export const recommendationPriorityEnum = z.enum(["low", "medium", "high"]);

export const financialHealthBreakdownItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  score: z.number().min(0),
  maxScore: z.number().positive(),
  status: financialHealthStatusEnum,
  detail: z.string(),
});

export const financialHealthRecommendationSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  priority: recommendationPriorityEnum,
});

export const financialHealthScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  grade: financialHealthGradeEnum,
  breakdown: z.array(financialHealthBreakdownItemSchema),
  recommendations: z.array(financialHealthRecommendationSchema),
  calculatedAt: z.string().datetime(),
});
