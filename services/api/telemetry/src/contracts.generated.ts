/* Generado del contrato canónico. No editar. */

export interface SyntheticSource {
  sourceId: string;
  origin: "synthetic-generator";
  schemaVersion: "1.0.0";
}

/* Generado del contrato canónico. No editar. */

export interface ConsentUpdate {
  expectedVersion: number;
  noticeVersion: "synthetic-notice-v1";
  /**
   * @maxItems 2
   */
  grants:
    | []
    | [
        {
          signal: "heartRate" | "stepCount";
          purpose: "personal-analytics";
        }
      ]
    | [
        {
          signal: "heartRate" | "stepCount";
          purpose: "personal-analytics";
        },
        {
          signal: "heartRate" | "stepCount";
          purpose: "personal-analytics";
        }
      ];
}

/* Generado del contrato canónico. No editar. */

export interface TelemetryBatch {
  schemaVersion: "1.0.0";
  sourceId: string;
  batchId: string;
  origin: "synthetic-generator";
  consentVersion: number;
  purpose: "personal-analytics";
  /**
   * @minItems 1
   * @maxItems 100
   */
  samples: [
    (
      | {
          sampleId: string;
          signal: "heartRate";
          observedAt: string;
          unit: "bpm";
          value: number;
        }
      | {
          sampleId: string;
          signal: "stepCount";
          observedAt: string;
          unit: "count";
          value: number;
        }
    ),
    ...(
      | {
          sampleId: string;
          signal: "heartRate";
          observedAt: string;
          unit: "bpm";
          value: number;
        }
      | {
          sampleId: string;
          signal: "stepCount";
          observedAt: string;
          unit: "count";
          value: number;
        }
    )[]
  ];
}

/* Generado del contrato canónico. No editar. */

export interface TelemetryReceipt {
  schemaVersion: "1.0.0";
  sourceId: string;
  batchId: string;
  consentVersion: number;
  receivedAt: string;
  acceptedCount: number;
  duplicateCount: number;
  outOfOrderCount: number;
}

/* Generado del contrato canónico. No editar. */

export interface SourceState {
  sourceId: string;
  origin: "synthetic-generator";
  active: boolean;
  consentVersion: number;
  /**
   * @maxItems 2
   */
  grants:
    | []
    | [
        {
          signal: "heartRate" | "stepCount";
          purpose: "personal-analytics";
        }
      ]
    | [
        {
          signal: "heartRate" | "stepCount";
          purpose: "personal-analytics";
        },
        {
          signal: "heartRate" | "stepCount";
          purpose: "personal-analytics";
        }
      ];
  consentAt: string | null;
}

/* Generado del contrato canónico. No editar. */

export interface TelemetrySummary {
  sourceId: string;
  consentVersion: number;
  scope: "synthetic-current-consent";
  /**
   * @maxItems 2
   */
  items:
    | []
    | [
        {
          signal: "heartRate" | "stepCount";
          sampleCount: number;
          outOfOrderCount: number;
          latestObservedAt: string;
        }
      ]
    | [
        {
          signal: "heartRate" | "stepCount";
          sampleCount: number;
          outOfOrderCount: number;
          latestObservedAt: string;
        },
        {
          signal: "heartRate" | "stepCount";
          sampleCount: number;
          outOfOrderCount: number;
          latestObservedAt: string;
        }
      ];
}

/* Generado del contrato canónico. No editar. */

export interface TelemetryErrorResponse {
  code:
    | "ACCESS_TOKEN_REQUIRED"
    | "INVALID_ACCESS_TOKEN"
    | "PROFILE_NOT_ACTIVE"
    | "SOURCE_NOT_FOUND"
    | "SOURCE_REVOKED"
    | "CONSENT_NOT_CURRENT"
    | "CONSENT_VERSION_CONFLICT"
    | "SAMPLE_PRECEDES_CONSENT"
    | "INVALID_PAYLOAD"
    | "TIMESTAMP_OUT_OF_WINDOW"
    | "DUPLICATE_SAMPLE_IN_BATCH"
    | "BATCH_CONTENT_CONFLICT"
    | "SAMPLE_CONTENT_CONFLICT"
    | "SAMPLE_TIME_CONFLICT"
    | "BATCH_NOT_FOUND"
    | "INVALID_JSON_OR_PARAMETER"
    | "PAYLOAD_TOO_LARGE"
    | "DEPENDENCY_UNAVAILABLE"
    | "HTTP_ERROR"
    | "MONGODB_NOT_ENABLED"
    | "PROJECTION_INVALID"
    | "PROJECTION_CONTENT_CONFLICT";
  type: "about:blank";
  title: string;
  status: number;
  requestId: string;
}
