/**
 * Shared Place Graph Contract
 * File: frontend/src/types/graphContract.ts
 *
 * Models the evolving travel place graph across all sections:
 * Khám phá (Discovery) -> Sắp xếp bản nháp (Draft Graph) ->
 * Cùng xây (Co-create) -> Xác nhận (Confirm) -> Khởi hành (Journey).
 */

export type {
  EntryPointType,
  EntryPointState,
  EdgeState,
  PlanState,
  EntryPoint,
  GraphEdge,
  PlaceGraphModel,
  EdgeValidationResult,
} from '@/components/landing/landingDemo';

export { validateNewEdge, createInitialGraphModel } from '@/components/landing/landingDemo';
