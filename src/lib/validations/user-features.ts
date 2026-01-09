import { z } from "zod";

// Reviews
export const createReviewSchema = z.object({
  serverId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().max(2000).optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

// Submissions
export const createSubmissionSchema = z.object({
  githubUrl: z
    .string()
    .url()
    .regex(
      /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/,
      "Must be a GitHub repository URL (e.g. https://github.com/owner/repo)"
    ),
  categoryIds: z.array(z.string().uuid()).min(1, "Select at least one category").max(5),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

// Reports
export const reportTypes = ["broken", "spam", "outdated", "security", "other"] as const;
export type ReportType = (typeof reportTypes)[number];

export const createReportSchema = z.object({
  serverId: z.string().uuid(),
  type: z.enum(reportTypes),
  description: z.string().max(1000).optional(),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Claims
export const verificationMethods = ["file", "github_owner"] as const;
export type VerificationMethod = (typeof verificationMethods)[number];

export const initiateClaimSchema = z.object({
  serverId: z.string().uuid(),
  verificationMethod: z.enum(verificationMethods).default("file"),
});

export const verifyClaimSchema = z.object({
  claimId: z.string().uuid(),
});

export type InitiateClaimInput = z.infer<typeof initiateClaimSchema>;
export type VerifyClaimInput = z.infer<typeof verifyClaimSchema>;
