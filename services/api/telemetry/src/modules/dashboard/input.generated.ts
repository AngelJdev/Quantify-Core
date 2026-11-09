/* Generado del contrato canónico. No editar. */

export interface DashboardInput {
  /**
   * @maxItems 5000
   */
  revisions: {
    habitId: string;
    ownerId: string;
    revision: number;
    effectiveFrom: string;
    timeZone: string;
    /**
     * @minItems 1
     * @maxItems 7
     */
    weekdays:
      | [number]
      | [number, number]
      | [number, number, number]
      | [number, number, number, number]
      | [number, number, number, number, number]
      | [number, number, number, number, number, number]
      | [number, number, number, number, number, number, number];
    targetValue: string;
    unit: string;
    status: "active" | "paused" | "archived";
  }[];
  /**
   * @maxItems 100000
   */
  checkIns: {
    habitId: string;
    ownerId: string;
    businessDate: string;
    habitRevision: number;
    version: number;
    timeZone: string;
    unit: string;
    value: string;
    recordedAt: string;
  }[];
}
