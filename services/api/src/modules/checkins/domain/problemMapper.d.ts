import type { ProblemDetails, ProblemFieldError } from './types.d.ts';

export interface DomainFailureInput {
  status?: number;
  code?: string;
  message?: string;
  requestId?: string;
  errors?: ProblemFieldError[];
}

export function toProblemDetails(failure?: DomainFailureInput): ProblemDetails;
