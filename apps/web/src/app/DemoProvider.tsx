import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import type {
  DemoHabit,
  HabitDraft,
  HabitView,
} from "@/features/habits/data/model";
import { toHabitView, validateDraft } from "@/features/habits/data/model";
import {
  FIXTURE_DATE,
  fixtureHabits,
  fixtureProfile,
} from "@/shared/fixtures/demo";
import type { IconName } from "@/shared/ui/Icon";
import type { Metrics } from "@/shared/api/schema";
import {
  addDaysToBusinessDate,
  apiCreateHabit,
  apiGetExtendedProfile,
  apiGetHabitMetrics,
  apiGetProfile,
  apiListCheckIns,
  apiListEvidence,
  apiListHabits,
  apiPatchHabit,
  apiRecordCheckIn,
  apiSaveEvidence,
  apiSaveExtendedProfile,
  getBusinessDateInZone,
  logoutOidcSession,
  nextValidRevisionDate,
  type EvidenceRecord,
  type OidcUserSession,
} from "@/shared/api/client";

export type DemoEntry = {
  habitId: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  version?: number;
  progressStatus?: "zero" | "partial" | "completed";
  note?: string;
  mood?: string;
  energyLevel?: number;
  imageDataUrl?: string;
};

export type LinkedDevice = {
  id: string;
  name: string;
  model: string;
  linkedAt: string;
  status: "connected" | "paused";
};

export type ProfileState = {
  displayName: string;
  timeZone: string;
  id?: string;
  email?: string;
  roles?: Array<"user" | "admin">;
  status?: "active" | "suspended";
  avatarDataUrl?: string;
  bio?: string;
  occupation?: string;
  institution?: string;
  phone?: string;
  accentColor?: "blue" | "emerald" | "cyan" | "violet" | "amber";
  density?: "comfortable" | "compact";
  fontSize?: "normal" | "large";
  geminiApiKey?: string;
};

export type DemoState = {
  habits: DemoHabit[];
  entries: DemoEntry[];
  evidenceList?: EvidenceRecord[];
  profile: ProfileState;
  read: boolean;
  readNoticeIds?: string[];
  consent: { suggestions: boolean; devices: boolean };
  devices?: LinkedDevice[];
  session?: OidcUserSession | null;
  metricsByHabit?: Record<string, Metrics>;
  syncing?: boolean;
  syncError?: string | null;
};

export type DemoAction =
  | { type: "save"; id: string; draft: HabitDraft }
  | { type: "upsert-server-habit"; habit: DemoHabit }
  | { type: "status"; id: string; status: HabitView["status"] }
  | {
      type: "progress";
      id: string;
      value: number;
      date: string;
      version?: number;
      progressStatus?: "zero" | "partial" | "completed";
      note?: string;
      mood?: string;
      energyLevel?: number;
      imageDataUrl?: string;
    }
  | { type: "add-evidence"; evidence: EvidenceRecord }
  | { type: "read"; noticeId?: string }
  | { type: "profile"; profile: ProfileState }
  | { type: "consent"; consent: DemoState["consent"] }
  | { type: "device-add"; device: LinkedDevice }
  | { type: "device-toggle"; id: string }
  | { type: "device-remove"; id: string }
  | {
      type: "hydrate-backend";
      session: OidcUserSession;
      profile: ProfileState;
      habits: DemoHabit[];
      entries: DemoEntry[];
      evidenceList: EvidenceRecord[];
      metricsByHabit: Record<string, Metrics>;
    }
  | { type: "set-habit-metrics"; habitId: string; metrics: Metrics }
  | { type: "sync-state"; syncing: boolean; error?: string | null }
  | { type: "logout" };

const HABIT_UI_STORAGE_KEY = "qc_habit_ui_meta_v1";

type StoredUiMeta = Record<
  string,
  {
    detail: string;
    intention: string;
    color: HabitView["color"];
    icon: IconName;
  }
>;

function readUiMeta(): StoredUiMeta {
  try {
    const raw = localStorage.getItem(HABIT_UI_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredUiMeta) : {};
  } catch {
    return {};
  }
}

function writeUiMeta(
  id: string,
  meta: {
    detail: string;
    intention: string;
    color: HabitView["color"];
    icon: IconName;
  },
) {
  try {
    const current = readUiMeta();
    current[id] = meta;
    localStorage.setItem(HABIT_UI_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

function inferHabitIcon(unit: string, name: string): IconName {
  const lower = `${name} ${unit}`.toLocaleLowerCase("es");
  if (
    lower.includes("leer") ||
    lower.includes("página") ||
    lower.includes("libro")
  )
    return "lectura";
  if (
    lower.includes("caminar") ||
    lower.includes("paso") ||
    lower.includes("correr") ||
    lower.includes("ejercicio") ||
    lower.includes("km")
  )
    return "movimiento";
  if (
    lower.includes("dormir") ||
    lower.includes("descanso") ||
    lower.includes("pausa") ||
    lower.includes("meditar")
  )
    return "descanso";
  return "habitos";
}

const COLORS: HabitView["color"][] = ["blue", "cyan", "emerald"];

export function initialDemoState(): DemoState {
  return {
    habits: structuredClone(fixtureHabits),
    entries: [],
    evidenceList: [],
    profile: { ...fixtureProfile },
    read: false,
    readNoticeIds: [],
    consent: { suggestions: true, devices: false },
    devices: [],
    session: null,
    metricsByHabit: {},
    syncing: false,
    syncError: null,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  if (action.type === "read") {
    if (action.noticeId) {
      const nextIds = Array.from(
        new Set([...(state.readNoticeIds ?? []), action.noticeId]),
      );
      return {
        ...state,
        readNoticeIds: nextIds,
        read: nextIds.length >= 2 ? true : state.read,
      };
    }
    return { ...state, read: true };
  }
  if (action.type === "profile")
    return { ...state, profile: { ...state.profile, ...action.profile } };
  if (action.type === "consent") return { ...state, consent: action.consent };
  if (action.type === "add-evidence")
    return {
      ...state,
      evidenceList: [action.evidence, ...(state.evidenceList ?? [])],
    };
  if (action.type === "device-add")
    return {
      ...state,
      devices: [...(state.devices ?? []), action.device],
    };
  if (action.type === "device-toggle")
    return {
      ...state,
      devices: (state.devices ?? []).map((d) =>
        d.id === action.id
          ? {
              ...d,
              status: d.status === "connected" ? "paused" : "connected",
            }
          : d,
      ),
    };
  if (action.type === "device-remove")
    return {
      ...state,
      devices: (state.devices ?? []).filter((d) => d.id !== action.id),
    };
  if (action.type === "hydrate-backend")
    return {
      ...state,
      session: action.session,
      profile: action.profile,
      habits: action.habits,
      entries: action.entries,
      evidenceList: action.evidenceList,
      metricsByHabit: action.metricsByHabit,
      syncing: false,
      syncError: null,
    };
  if (action.type === "set-habit-metrics")
    return {
      ...state,
      metricsByHabit: {
        ...(state.metricsByHabit ?? {}),
        [action.habitId]: action.metrics,
      },
    };
  if (action.type === "sync-state")
    return {
      ...state,
      syncing: action.syncing,
      syncError: action.error ?? null,
    };
  if (action.type === "logout") return initialDemoState();
  if (action.type === "upsert-server-habit") {
    const existing = state.habits.some(
      (h) => h.resource.id === action.habit.resource.id,
    );
    return {
      ...state,
      habits: existing
        ? state.habits.map((h) =>
            h.resource.id === action.habit.resource.id ? action.habit : h,
          )
        : [...state.habits, action.habit],
    };
  }
  if (action.type === "save") {
    if (Object.keys(validateDraft(action.draft)).length) return state;
    const existing = state.habits.find((h) => h.resource.id === action.id);
    if (existing?.resource.status === "archived") return state;
    const stamp = new Date().toISOString();
    const { detail, intention, color, icon } = action.draft;
    const habit: DemoHabit = {
      detail,
      intention,
      color,
      icon,
      value: existing?.value ?? 0,
      resource: {
        ...action.draft.dto,
        id: action.id,
        status: existing?.resource.status ?? "active",
        version: (existing?.resource.version ?? 0) + 1,
        createdAt: existing?.resource.createdAt ?? stamp,
        updatedAt: stamp,
      },
    };
    return {
      ...state,
      habits: existing
        ? state.habits.map((h) => (h.resource.id === action.id ? habit : h))
        : [...state.habits, habit],
    };
  }
  if (action.type === "status")
    return {
      ...state,
      habits: state.habits.map((h) =>
        h.resource.id === action.id && h.resource.status !== "archived"
          ? { ...h, resource: { ...h.resource, status: action.status } }
          : h,
      ),
    };
  const habit = state.habits.find((h) => h.resource.id === action.id);
  if (
    !habit ||
    habit.resource.status !== "active" ||
    !Number.isFinite(action.value) ||
    action.value < 0
  )
    return state;
  const target = habit.resource.targetValue;
  const computedStatus: DemoEntry["progressStatus"] =
    action.progressStatus ??
    (action.value <= 0
      ? "zero"
      : action.value >= target
        ? "completed"
        : "partial");
  const prevEntry = state.entries.find(
    (e) => e.habitId === action.id && e.date === action.date,
  );
  const entry: DemoEntry = {
    habitId: action.id,
    name: habit.resource.name,
    value: action.value,
    unit: habit.resource.unit,
    date: action.date,
    version: action.version ?? (prevEntry?.version ?? 0) + 1,
    progressStatus: computedStatus,
    note: action.note ?? prevEntry?.note,
    mood: action.mood ?? prevEntry?.mood,
    energyLevel: action.energyLevel ?? prevEntry?.energyLevel,
    imageDataUrl: action.imageDataUrl ?? prevEntry?.imageDataUrl,
  };
  return {
    ...state,
    habits: state.habits.map((h) =>
      h.resource.id === action.id ? { ...h, value: action.value } : h,
    ),
    entries: [
      ...state.entries.filter(
        (e) => e.habitId !== action.id || e.date !== action.date,
      ),
      entry,
    ],
  };
}

type DemoContextValue = {
  state: DemoState;
  dispatch: React.Dispatch<DemoAction>;
  syncWithBackend: (session: OidcUserSession) => Promise<void>;
  saveHabit: (id: string | undefined, draft: HabitDraft) => Promise<string>;
  changeHabitStatus: (
    habit: HabitView,
    nextStatus: HabitView["status"],
  ) => Promise<void>;
  recordHabitProgress: (
    habit: HabitView,
    value: number,
    date?: string,
    correctionReason?: string,
    extraEvidence?: {
      note?: string;
      mood?: string;
      energyLevel?: number;
      imageDataUrl?: string;
    },
  ) => Promise<void>;
  updateProfilePreferences: (nextProfile: Partial<ProfileState>) => Promise<void>;
  endSession: () => Promise<void>;
};

const DemoContext = createContext<DemoContextValue | null>(null);

const ACCENT_HEX: Record<NonNullable<ProfileState["accentColor"]>, string> = {
  blue: "#275BC0",
  emerald: "#10B981",
  cyan: "#0EA5E9",
  violet: "#7C3AED",
  amber: "#D97706",
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    demoReducer,
    undefined,
    initialDemoState,
  );

  useEffect(() => {
    const root = document.documentElement;
    if (state.profile.accentColor && ACCENT_HEX[state.profile.accentColor]) {
      root.style.setProperty(
        "--qc-action",
        ACCENT_HEX[state.profile.accentColor],
      );
    } else {
      root.style.removeProperty("--qc-action");
    }
    root.dataset.qcDensity = state.profile.density || "comfortable";
    root.dataset.qcFont = state.profile.fontSize || "normal";
  }, [
    state.profile.accentColor,
    state.profile.density,
    state.profile.fontSize,
  ]);

  const syncWithBackend = useCallback(async (session: OidcUserSession) => {
    dispatch({ type: "sync-state", syncing: true, error: null });
    try {
      const [apiProfile, initialHabits, extProfile, evidenceList] =
        await Promise.all([
          apiGetProfile(),
          apiListHabits(),
          apiGetExtendedProfile().catch(
            (): Record<string, unknown> => ({}),
          ),
          apiListEvidence().catch(() => []),
        ]);

      let apiHabits = initialHabits;
      // Seed 3 initial production habits if a brand-new user has 0 habits
      if (apiHabits.length === 0) {
        const zone = apiProfile.timeZone || "America/Mexico_City";
        const today = getBusinessDateInZone(zone);
        const seeds: Array<{
          name: string;
          targetValue: number;
          unit: string;
          detail: string;
          intention: string;
          color: HabitView["color"];
          icon: IconName;
        }> = [
          {
            name: "Hidratación diaria",
            targetValue: 8,
            unit: "vasos",
            detail: "Por la mañana",
            intention: "Mantener energía y claridad mental durante el día",
            color: "blue",
            icon: "habitos",
          },
          {
            name: "Lectura y enfoque técnico",
            targetValue: 30,
            unit: "min",
            detail: "Por la noche",
            intention: "Aprender algo nuevo cada día sin distracciones",
            color: "cyan",
            icon: "lectura",
          },
          {
            name: "Caminata activa",
            targetValue: 6000,
            unit: "pasos",
            detail: "Por la mañana",
            intention: "Cuidar mi salud física y reducir el estrés académico",
            color: "emerald",
            icon: "movimiento",
          },
        ];
        const createdSeeds = [];
        for (const s of seeds) {
          try {
            const c = await apiCreateHabit({
              name: s.name,
              targetValue: s.targetValue,
              unit: s.unit,
              timeZone: zone,
              schedule: { weekdays: [1, 2, 3, 4, 5, 6, 7], effectiveFrom: today },
            });
            writeUiMeta(c.id, {
              detail: s.detail,
              intention: s.intention,
              color: s.color,
              icon: s.icon,
            });
            createdSeeds.push(c);
          } catch {
            // ignore if write disabled
          }
        }
        if (createdSeeds.length > 0) apiHabits = createdSeeds;
      }

      const uiMeta = readUiMeta();
      const entries: DemoEntry[] = [];
      const metricsByHabit: Record<string, Metrics> = {};
      const evidenceByHabitDate = new Map<string, EvidenceRecord>();
      for (const ev of evidenceList) {
        evidenceByHabitDate.set(`${ev.habitId}:${ev.businessDate}`, ev);
      }

      const demoHabits: DemoHabit[] = await Promise.all(
        apiHabits.map(async (resource, idx) => {
          const today = getBusinessDateInZone(resource.timeZone);
          const from30 = addDaysToBusinessDate(today, -29);
          const from7 = addDaysToBusinessDate(today, -6);
          let habitCheckIns: Awaited<ReturnType<typeof apiListCheckIns>> = [];
          try {
            const [ciList, m] = await Promise.all([
              apiListCheckIns(resource.id, from30, today),
              apiGetHabitMetrics(resource.id, from7, today),
            ]);
            habitCheckIns = ciList;
            metricsByHabit[resource.id] = m;
          } catch {
            // keep empty if no window data
          }
          for (const ci of habitCheckIns) {
            const ev = evidenceByHabitDate.get(
              `${resource.id}:${ci.businessDate}`,
            );
            entries.push({
              habitId: resource.id,
              name: resource.name,
              value: ci.value,
              unit: resource.unit,
              date: ci.businessDate,
              version: ci.version,
              progressStatus: ci.progressStatus,
              note: ev?.note,
              mood: ev?.mood,
              energyLevel: ev?.energyLevel,
              imageDataUrl: ev?.imageDataUrl,
            });
          }
          const todayCheckIn = habitCheckIns.find(
            (c) => c.businessDate === today,
          );
          const latestCheckIn = habitCheckIns.at(-1);
          const meta = uiMeta[resource.id];
          return {
            resource,
            detail: meta?.detail || "Por la mañana",
            intention:
              meta?.intention ||
              "Sostener constancia diaria con equilibrio y evidencia.",
            color: meta?.color || COLORS[idx % COLORS.length],
            icon: meta?.icon || inferHabitIcon(resource.unit, resource.name),
            value: todayCheckIn?.value ?? latestCheckIn?.value ?? 0,
          };
        }),
      );

      entries.sort((a, b) => b.date.localeCompare(a.date));

      dispatch({
        type: "hydrate-backend",
        session,
        profile: {
          id: apiProfile.id,
          displayName: String(
            extProfile.displayName || session.displayName || "Usuario Quantify",
          ),
          email: String(extProfile.email || session.email),
          timeZone: apiProfile.timeZone || "America/Mexico_City",
          roles: apiProfile.roles,
          status: apiProfile.status,
          avatarDataUrl:
            typeof extProfile.avatarDataUrl === "string"
              ? extProfile.avatarDataUrl
              : undefined,
          bio:
            typeof extProfile.bio === "string"
              ? extProfile.bio
              : "Construyendo hábitos sostenibles con evidencia e IA.",
          occupation:
            typeof extProfile.occupation === "string"
              ? extProfile.occupation
              : "Ingeniería en Desarrollo y Gestión de Software",
          institution:
            typeof extProfile.institution === "string"
              ? extProfile.institution
              : "Universidad Tecnológica de Xicotepec de Juárez",
          phone:
            typeof extProfile.phone === "string" ? extProfile.phone : "",
          accentColor:
            (extProfile.accentColor as ProfileState["accentColor"]) || "blue",
          density:
            (extProfile.density as ProfileState["density"]) || "comfortable",
          fontSize:
            (extProfile.fontSize as ProfileState["fontSize"]) || "normal",
        },
        habits: demoHabits,
        entries,
        evidenceList,
        metricsByHabit,
      });
    } catch (error) {
      dispatch({
        type: "sync-state",
        syncing: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo sincronizar con el backend.",
      });
      throw error;
    }
  }, []);

  const saveHabit = useCallback(
    async (
      existingId: string | undefined,
      draft: HabitDraft,
    ): Promise<string> => {
      const normalizedDraft: HabitDraft = {
        ...draft,
        dto: { ...draft.dto, name: draft.dto.name.trim() },
      };
      if (!state.session) {
        const localId = existingId ?? crypto.randomUUID();
        dispatch({ type: "save", id: localId, draft: normalizedDraft });
        return localId;
      }

      const existing = existingId
        ? state.habits.find((h) => h.resource.id === existingId)
        : undefined;

      if (!existing) {
        const today = getBusinessDateInZone(normalizedDraft.dto.timeZone);
        const created = await apiCreateHabit({
          name: normalizedDraft.dto.name,
          targetValue: normalizedDraft.dto.targetValue,
          unit: normalizedDraft.dto.unit,
          timeZone: normalizedDraft.dto.timeZone,
          schedule: {
            weekdays: normalizedDraft.dto.schedule.weekdays,
            effectiveFrom: today,
          },
        });
        writeUiMeta(created.id, {
          detail: normalizedDraft.detail,
          intention: normalizedDraft.intention,
          color: normalizedDraft.color,
          icon: normalizedDraft.icon,
        });
        dispatch({
          type: "upsert-server-habit",
          habit: {
            resource: created,
            detail: normalizedDraft.detail,
            intention: normalizedDraft.intention,
            color: normalizedDraft.color,
            icon: normalizedDraft.icon,
            value: 0,
          },
        });
        return created.id;
      } else {
        const nextEffective = nextValidRevisionDate(
          existing.resource.schedule.effectiveFrom,
          existing.resource.timeZone,
          normalizedDraft.dto.timeZone,
        );
        const updated = await apiPatchHabit(
          existing.resource.id,
          existing.resource.version,
          {
            name: normalizedDraft.dto.name,
            targetValue: normalizedDraft.dto.targetValue,
            unit: normalizedDraft.dto.unit,
            timeZone: normalizedDraft.dto.timeZone,
            schedule: {
              weekdays: normalizedDraft.dto.schedule.weekdays,
              effectiveFrom: nextEffective,
            },
          },
        );
        writeUiMeta(updated.id, {
          detail: normalizedDraft.detail,
          intention: normalizedDraft.intention,
          color: normalizedDraft.color,
          icon: normalizedDraft.icon,
        });
        dispatch({
          type: "upsert-server-habit",
          habit: {
            resource: updated,
            detail: normalizedDraft.detail,
            intention: normalizedDraft.intention,
            color: normalizedDraft.color,
            icon: normalizedDraft.icon,
            value: existing.value,
          },
        });
        return updated.id;
      }
    },
    [state.session, state.habits],
  );

  const changeHabitStatus = useCallback(
    async (habit: HabitView, nextStatus: HabitView["status"]) => {
      if (!state.session) {
        dispatch({ type: "status", id: habit.id, status: nextStatus });
        return;
      }
      const nextEffective = nextValidRevisionDate(
        habit.schedule.effectiveFrom,
        habit.timeZone,
      );
      const updated = await apiPatchHabit(habit.id, habit.version, {
        status: nextStatus,
        schedule: {
          weekdays: habit.schedule.weekdays,
          effectiveFrom: nextEffective,
        },
      });
      const existing = state.habits.find((h) => h.resource.id === habit.id);
      dispatch({
        type: "upsert-server-habit",
        habit: {
          resource: updated,
          detail: existing?.detail ?? habit.detail,
          intention: existing?.intention ?? habit.intention,
          color: existing?.color ?? habit.color,
          icon: existing?.icon ?? habit.icon,
          value: existing?.value ?? habit.value,
        },
      });
    },
    [state.session, state.habits],
  );

  const recordHabitProgress = useCallback(
    async (
      habit: HabitView,
      value: number,
      date?: string,
      correctionReason?: string,
      extraEvidence?: {
        note?: string;
        mood?: string;
        energyLevel?: number;
        imageDataUrl?: string;
      },
    ) => {
      const targetDate =
        date ||
        (state.session
          ? getBusinessDateInZone(habit.timeZone)
          : FIXTURE_DATE);

      if (!state.session) {
        dispatch({
          type: "progress",
          id: habit.id,
          value,
          date: targetDate,
          note: extraEvidence?.note,
          mood: extraEvidence?.mood,
          energyLevel: extraEvidence?.energyLevel,
          imageDataUrl: extraEvidence?.imageDataUrl,
        });
        if (
          extraEvidence?.note ||
          extraEvidence?.imageDataUrl ||
          extraEvidence?.mood
        ) {
          dispatch({
            type: "add-evidence",
            evidence: {
              id: crypto.randomUUID(),
              ownerId: "local",
              habitId: habit.id,
              habitName: habit.name,
              businessDate: targetDate,
              value,
              unit: habit.unit,
              note: extraEvidence.note || "",
              mood: extraEvidence.mood || "enfocado",
              energyLevel: extraEvidence.energyLevel ?? 8,
              imageDataUrl: extraEvidence.imageDataUrl,
              createdAt: new Date().toISOString(),
            },
          });
        }
        return;
      }

      const existingEntry = state.entries.find(
        (e) => e.habitId === habit.id && e.date === targetDate,
      );
      const expectedVersion = existingEntry?.version ?? 0;
      const todayInZone = getBusinessDateInZone(habit.timeZone);
      const occurredAt =
        targetDate === todayInZone
          ? new Date().toISOString()
          : `${targetDate}T12:00:00Z`;

      const recorded = await apiRecordCheckIn(habit.id, {
        clientEventId: crypto.randomUUID(),
        businessDate: targetDate,
        occurredAt,
        timeZone: habit.timeZone,
        value,
        expectedVersion,
        ...(expectedVersion > 0
          ? {
              correctionReason:
                correctionReason?.trim() || "Actualización de avance diario",
            }
          : {}),
      });

      if (
        extraEvidence?.note ||
        extraEvidence?.imageDataUrl ||
        extraEvidence?.mood
      ) {
        try {
          const savedEv = await apiSaveEvidence({
            habitId: habit.id,
            habitName: habit.name,
            businessDate: recorded.businessDate,
            value: recorded.value,
            unit: habit.unit,
            note: extraEvidence.note || "",
            mood: extraEvidence.mood || "enfocado",
            energyLevel: extraEvidence.energyLevel ?? 8,
            imageDataUrl: extraEvidence.imageDataUrl,
          });
          dispatch({ type: "add-evidence", evidence: savedEv });
        } catch {
          // ignore
        }
      }

      dispatch({
        type: "progress",
        id: habit.id,
        value: recorded.value,
        date: recorded.businessDate,
        version: recorded.version,
        progressStatus: recorded.progressStatus,
        note: extraEvidence?.note,
        mood: extraEvidence?.mood,
        energyLevel: extraEvidence?.energyLevel,
        imageDataUrl: extraEvidence?.imageDataUrl,
      });

      try {
        const from7 = addDaysToBusinessDate(todayInZone, -6);
        const metrics = await apiGetHabitMetrics(habit.id, from7, todayInZone);
        dispatch({ type: "set-habit-metrics", habitId: habit.id, metrics });
      } catch {
        // ignore metrics refresh error
      }
    },
    [state.session, state.entries],
  );

  const updateProfilePreferences = useCallback(
    async (nextProfile: Partial<ProfileState>) => {
      const merged = { ...state.profile, ...nextProfile };
      dispatch({ type: "profile", profile: merged });
      if (state.session) {
        try {
          await apiSaveExtendedProfile(merged);
        } catch {
          // keep local state even if backend call fails
        }
      }
    },
    [state.profile, state.session],
  );

  const endSession = useCallback(async () => {
    await logoutOidcSession();
    dispatch({ type: "logout" });
  }, []);

  return (
    <DemoContext.Provider
      value={{
        state,
        dispatch,
        syncWithBackend,
        saveHabit,
        changeHabitStatus,
        recordHabitProgress,
        updateProfilePreferences,
        endSession,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("DemoProvider is required");
  return { ...context, habits: context.state.habits.map(toHabitView) };
}
