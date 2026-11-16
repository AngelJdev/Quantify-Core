// Generated from packages/contracts/openapi.json. Do not edit.
export type Problem = { "type": string; "title": string; "status": number; "detail"?: string; "code": string; "requestId": string; "errors"?: Array<{ "field": string; "code": string }> }
export type Profile = { "id": string; "timeZone": string; "roles": Array<"user" | "admin">; "status": "active" | "suspended" }
export type Schedule = { "weekdays": Array<number>; "effectiveFrom": string }
export type HabitCreate = { "name": string; "targetValue": number; "unit": string; "schedule": Schedule; "timeZone": string }
export type HabitPatch = { "name"?: string; "targetValue"?: number; "unit"?: string; "schedule"?: Schedule; "timeZone"?: string; "status"?: "active" | "paused" | "archived" }
export type Habit = { "id": string; "name": string; "targetValue": number; "unit": string; "schedule": Schedule; "timeZone": string; "status": "active" | "paused" | "archived"; "version": number; "createdAt": string; "updatedAt": string }
export type HabitList = { "items": Array<Habit>; "nextCursor": string | null }
export type CheckInCommand = { "clientEventId": string; "businessDate": string; "occurredAt": string; "timeZone": string; "value": number; "expectedVersion": number; "correctionReason"?: string }
export type CheckIn = { "id": string; "habitId": string; "clientEventId": string; "businessDate": string; "occurredAt": string; "recordedAt": string; "timeZone": string; "value": number; "version": number; "progressStatus": "zero" | "partial" | "completed" }
export type CheckInList = { "items": Array<CheckIn>; "nextCursor": string | null }
export type Metrics = { "habitId": string; "from": string; "to": string; "timeZone": string; "ruleVersion": string; "calculatedAt": string; "eligiblePeriods": number; "completedPeriods": number; "completionRate": number | null; "currentStreak": number; "longestStreak": number; "noDataReason": string | null }
