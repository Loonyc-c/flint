import { z } from "zod";

// Match stage enum validation
export const matchStageSchema = z.enum([
  'fresh',
  'stage1_complete',
  'stage2_complete',
  'unlocked'
]);

// Staged call stage numbers
export const stageNumberSchema = z.union([z.literal(1), z.literal(2)]);

// Staged call initiate request
export const stagedCallInitiateSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  calleeId: z.string().min(1, "Callee ID is required"),
  stage: stageNumberSchema,
});

// Staged call accept request
export const stagedCallAcceptSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
});

// Stage prompt response
export const stagePromptResponseSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  accepted: z.boolean(),
});

// Get match stage request
export const getMatchStageSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
});

// Inferred types
export type StagedCallInitiateInput = z.infer<typeof stagedCallInitiateSchema>;
export type StagedCallAcceptInput = z.infer<typeof stagedCallAcceptSchema>;
export type StagePromptResponseInput = z.infer<typeof stagePromptResponseSchema>;
export type GetMatchStageInput = z.infer<typeof getMatchStageSchema>;
