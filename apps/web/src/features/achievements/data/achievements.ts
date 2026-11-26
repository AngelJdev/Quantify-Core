import type { DemoState } from "@/app/DemoProvider";
import type { HabitView } from "@/features/habits/data/model";
import { clampProgress } from "@/features/habits/data/model";

export type AchievementTier = "bronce" | "plata" | "oro" | "diamante";

export type AchievementCategory =
  | "Iniciación"
  | "Rachas y Constancia"
  | "Ejecución Diaria"
  | "Especialidades"
  | "Evidencia y Reflexión"
  | "Maestría";

export type AchievementDefinition = {
  id: string;
  code: string;
  title: string;
  description: string;
  ruleExplanation: string;
  category: AchievementCategory;
  tier: AchievementTier;
  points: number;
  iconSymbol: string;
  evaluate: (
    state: DemoState,
    habits: HabitView[],
    unlockedBeforeMastery?: number,
  ) => {
    current: number;
    target: number;
  };
};

export type EvaluatedAchievement = AchievementDefinition & {
  current: number;
  target: number;
  progressPct: number;
  unlocked: boolean;
};

function getMaxHabitStreak(state: DemoState, habits: HabitView[]): number {
  let maxStreak = 0;
  for (const h of habits) {
    const serverLongest = state.metricsByHabit?.[h.id]?.longestStreak ?? 0;
    const serverCurrent = state.metricsByHabit?.[h.id]?.currentStreak ?? 0;
    const completedDates = new Set(
      state.entries
        .filter((e) => e.habitId === h.id && h.target > 0 && e.value >= h.target)
        .map((e) => e.date),
    );
    const localCount =
      completedDates.size +
      (h.target > 0 && h.value >= h.target && completedDates.size === 0 ? 1 : 0);
    maxStreak = Math.max(maxStreak, serverLongest, serverCurrent, localCount);
  }
  return maxStreak;
}

function getActiveStreaksCount(state: DemoState, habits: HabitView[]): number {
  let count = 0;
  for (const h of habits.filter((item) => item.status === "active")) {
    const serverCurrent = state.metricsByHabit?.[h.id]?.currentStreak ?? 0;
    const hasCompleted =
      (h.target > 0 && h.value >= h.target) ||
      state.entries.some(
        (e) => e.habitId === h.id && h.target > 0 && e.value >= h.target,
      );
    if (serverCurrent >= 1 || hasCompleted) count += 1;
  }
  return count;
}

function getCompletedHabitsTodayCount(habits: HabitView[]): number {
  return habits.filter(
    (h) => h.status === "active" && h.target > 0 && h.value >= h.target,
  ).length;
}

function getTotalCheckInsCount(state: DemoState, habits: HabitView[]): number {
  const activeWithProgress = habits.filter((h) => h.value > 0).length;
  return Math.max(state.entries.length, activeWithProgress);
}

function getTotalCompletedCheckInsCount(
  state: DemoState,
  habits: HabitView[],
): number {
  const fromEntries = state.entries.filter((e) => {
    const h = habits.find((item) => item.id === e.habitId);
    return h
      ? h.target > 0 && e.value >= h.target
      : e.progressStatus === "completed";
  }).length;
  const fromCurrent = habits.filter(
    (h) => h.target > 0 && h.value >= h.target,
  ).length;
  return Math.max(fromEntries, fromCurrent);
}

function getTotalMinutesAccumulated(
  state: DemoState,
  habits: HabitView[],
): number {
  const minEntries = state.entries
    .filter((e) => e.unit === "min" || e.unit === "minutos")
    .reduce((acc, e) => acc + e.value, 0);
  const minCurrent = habits
    .filter((h) => h.unit === "min" || h.unit === "minutos")
    .reduce((acc, h) => acc + h.value, 0);
  return Math.max(minEntries, minCurrent);
}

function getMaxValueByUnitKeyword(
  state: DemoState,
  habits: HabitView[],
  keywords: string[],
): number {
  let maxVal = 0;
  for (const h of habits) {
    const text = `${h.name} ${h.unit}`.toLocaleLowerCase("es");
    if (keywords.some((kw) => text.includes(kw))) {
      maxVal = Math.max(maxVal, h.value);
    }
  }
  for (const e of state.entries) {
    const text = `${e.name} ${e.unit}`.toLocaleLowerCase("es");
    if (keywords.some((kw) => text.includes(kw))) {
      maxVal = Math.max(maxVal, e.value);
    }
  }
  return maxVal;
}

export const ACHIEVEMENTS_CATALOG: AchievementDefinition[] = [
  // --- 1. INICIACIÓN (6 logros) ---
  {
    id: "ach-01",
    code: "INI-01",
    title: "Primer Paso Consciente",
    description: "Tener al menos 1 hábito activo configurado en tu espacio.",
    ruleExplanation: "Requiere >= 1 hábito en estado activo.",
    category: "Iniciación",
    tier: "bronce",
    points: 50,
    iconSymbol: "🌱",
    evaluate: (_state, habits) => ({
      current: habits.filter((h) => h.status === "active").length,
      target: 1,
    }),
  },
  {
    id: "ach-02",
    code: "INI-02",
    title: "Trío de Equilibrio",
    description: "Mantener 3 hábitos activos simultáneamente en tu rutina.",
    ruleExplanation: "Requiere >= 3 hábitos activos.",
    category: "Iniciación",
    tier: "bronce",
    points: 100,
    iconSymbol: "⚖️",
    evaluate: (_state, habits) => ({
      current: habits.filter((h) => h.status === "active").length,
      target: 3,
    }),
  },
  {
    id: "ach-03",
    code: "INI-03",
    title: "Arquitecto de Rutinas",
    description: "Ampliar tu catálogo personal a 4 hábitos creados.",
    ruleExplanation: "Requiere >= 4 hábitos registrados en total.",
    category: "Iniciación",
    tier: "plata",
    points: 150,
    iconSymbol: "🏛️",
    evaluate: (_state, habits) => ({
      current: habits.length,
      target: 4,
    }),
  },
  {
    id: "ach-04",
    code: "INI-04",
    title: "Propósito Definido",
    description: "Escribir una intención personal clara en al menos 1 hábito.",
    ruleExplanation: "Requiere >= 1 hábito con campo intención no vacío.",
    category: "Iniciación",
    tier: "bronce",
    points: 80,
    iconSymbol: "🎯",
    evaluate: (_state, habits) => ({
      current: habits.filter((h) => h.intention.trim().length >= 4).length,
      target: 1,
    }),
  },
  {
    id: "ach-05",
    code: "INI-05",
    title: "Agenda Completa 7/7",
    description: "Configurar un hábito programado para los 7 días de la semana.",
    ruleExplanation: "Requiere >= 1 hábito con 7 días seleccionados (L a D).",
    category: "Iniciación",
    tier: "bronce",
    points: 90,
    iconSymbol: "📅",
    evaluate: (_state, habits) => ({
      current: habits.filter((h) => h.schedule.weekdays.length === 7).length,
      target: 1,
    }),
  },
  {
    id: "ach-06",
    code: "INI-06",
    title: "Identidad Personalizada",
    description: "Personalizar tu perfil con nombre, biografía o fotografía.",
    ruleExplanation: "Requiere sesión iniciada o foto/biografía configurada.",
    category: "Iniciación",
    tier: "plata",
    points: 120,
    iconSymbol: "👤",
    evaluate: (state) => ({
      current:
        (state.session ? 1 : 0) +
        (state.profile.avatarDataUrl ? 1 : 0) +
        (state.profile.bio && state.profile.bio.length > 5 ? 1 : 0),
      target: 1,
    }),
  },

  // --- 2. RACHAS Y CONSTANCIA (6 logros) ---
  {
    id: "ach-07",
    code: "RAC-01",
    title: "Chispa Inicial",
    description: "Lograr tu primer día cumplido al 100% en cualquier hábito.",
    ruleExplanation: "Racha máxima >= 1 día cumplido.",
    category: "Rachas y Constancia",
    tier: "bronce",
    points: 100,
    iconSymbol: "🔥",
    evaluate: (state, habits) => ({
      current: getMaxHabitStreak(state, habits),
      target: 1,
    }),
  },
  {
    id: "ach-08",
    code: "RAC-02",
    title: "Tríada de Constancia",
    description: "Alcanzar una racha de 3 días cumplidos en un hábito.",
    ruleExplanation: "Racha máxima >= 3 oportunidades cerradas cumplidas.",
    category: "Rachas y Constancia",
    tier: "bronce",
    points: 180,
    iconSymbol: "⚡",
    evaluate: (state, habits) => ({
      current: getMaxHabitStreak(state, habits),
      target: 3,
    }),
  },
  {
    id: "ach-09",
    code: "RAC-03",
    title: "Semana Imparable",
    description: "Mantener una racha de 7 días cumplidos en un hábito.",
    ruleExplanation: "Racha máxima >= 7 oportunidades cumplidas.",
    category: "Rachas y Constancia",
    tier: "plata",
    points: 300,
    iconSymbol: "🌟",
    evaluate: (state, habits) => ({
      current: getMaxHabitStreak(state, habits),
      target: 7,
    }),
  },
  {
    id: "ach-10",
    code: "RAC-04",
    title: "Quincena de Acero",
    description: "Sostener 14 días cumplidos de racha en un hábito.",
    ruleExplanation: "Racha máxima >= 14 oportunidades cumplidas.",
    category: "Rachas y Constancia",
    tier: "oro",
    points: 500,
    iconSymbol: "🛡️",
    evaluate: (state, habits) => ({
      current: getMaxHabitStreak(state, habits),
      target: 14,
    }),
  },
  {
    id: "ach-11",
    code: "RAC-05",
    title: "Forjador de Hábitos (21 Días)",
    description: "Superar la barrera clásica de 21 días cumplidos en un hábito.",
    ruleExplanation: "Racha máxima >= 21 oportunidades cumplidas.",
    category: "Rachas y Constancia",
    tier: "oro",
    points: 750,
    iconSymbol: "🏅",
    evaluate: (state, habits) => ({
      current: getMaxHabitStreak(state, habits),
      target: 21,
    }),
  },
  {
    id: "ach-12",
    code: "RAC-06",
    title: "Mes Legendario (30 Días)",
    description: "Alcanzar 30 días de cumplimiento acumulado o en racha.",
    ruleExplanation: "Racha máxima >= 30 oportunidades cumplidas.",
    category: "Rachas y Constancia",
    tier: "diamante",
    points: 1200,
    iconSymbol: "👑",
    evaluate: (state, habits) => ({
      current: getMaxHabitStreak(state, habits),
      target: 30,
    }),
  },

  // --- 3. EJECUCIÓN DIARIA (6 logros) ---
  {
    id: "ach-13",
    code: "EJE-01",
    title: "Primer Check-in",
    description: "Registrar tu primer avance en cualquier hábito activo.",
    ruleExplanation: "Total de avances registrados >= 1.",
    category: "Ejecución Diaria",
    tier: "bronce",
    points: 60,
    iconSymbol: "✅",
    evaluate: (state, habits) => ({
      current: getTotalCheckInsCount(state, habits),
      target: 1,
    }),
  },
  {
    id: "ach-14",
    code: "EJE-02",
    title: "Primera Meta al 100%",
    description: "Completar el 100% de la meta diaria de un hábito.",
    ruleExplanation: "Al menos 1 hábito con valor >= meta diaria.",
    category: "Ejecución Diaria",
    tier: "bronce",
    points: 120,
    iconSymbol: "🎯",
    evaluate: (state, habits) => ({
      current: getTotalCompletedCheckInsCount(state, habits),
      target: 1,
    }),
  },
  {
    id: "ach-15",
    code: "EJE-03",
    title: "Doble Victoria Diaria",
    description: "Completar la meta de 2 hábitos activos en el mismo día.",
    ruleExplanation: "Hábitos activos con progreso >= 100% hoy >= 2.",
    category: "Ejecución Diaria",
    tier: "plata",
    points: 200,
    iconSymbol: "✌️",
    evaluate: (_state, habits) => ({
      current: getCompletedHabitsTodayCount(habits),
      target: 2,
    }),
  },
  {
    id: "ach-16",
    code: "EJE-04",
    title: "Jornada Perfecta",
    description: "Completar el 100% de al menos 3 hábitos activos en un día.",
    ruleExplanation: "Hábitos activos completados hoy >= 3.",
    category: "Ejecución Diaria",
    tier: "oro",
    points: 350,
    iconSymbol: "🌞",
    evaluate: (_state, habits) => ({
      current: getCompletedHabitsTodayCount(habits),
      target: 3,
    }),
  },
  {
    id: "ach-17",
    code: "EJE-05",
    title: "Ritmo Sostenido (5 Registros)",
    description: "Acumular 5 registros de avance confirmados en tu historial.",
    ruleExplanation: "Total de entradas en historial >= 5.",
    category: "Ejecución Diaria",
    tier: "plata",
    points: 220,
    iconSymbol: "📈",
    evaluate: (state, habits) => ({
      current: getTotalCheckInsCount(state, habits),
      target: 5,
    }),
  },
  {
    id: "ach-18",
    code: "EJE-06",
    title: "Disciplina de Hierro (15 Registros)",
    description: "Acumular 15 registros de avance confirmados en tu historial.",
    ruleExplanation: "Total de entradas en historial >= 15.",
    category: "Ejecución Diaria",
    tier: "oro",
    points: 450,
    iconSymbol: "🚀",
    evaluate: (state, habits) => ({
      current: getTotalCheckInsCount(state, habits),
      target: 15,
    }),
  },

  // --- 4. ESPECIALIDADES (6 logros) ---
  {
    id: "ach-19",
    code: "ESP-01",
    title: "Hidratación Óptima",
    description: "Registrar 8 o más vasos en un hábito de agua/hidratación.",
    ruleExplanation: "Valor registrado en hábito de vasos/agua >= 8.",
    category: "Especialidades",
    tier: "plata",
    points: 180,
    iconSymbol: "💧",
    evaluate: (state, habits) => ({
      current: getMaxValueByUnitKeyword(state, habits, [
        "vaso",
        "agua",
        "hidrat",
      ]),
      target: 8,
    }),
  },
  {
    id: "ach-20",
    code: "ESP-02",
    title: "Lector Enfocado",
    description: "Registrar 30 minutos o páginas en un hábito de lectura.",
    ruleExplanation: "Valor en hábito de lectura/páginas >= 30.",
    category: "Especialidades",
    tier: "plata",
    points: 200,
    iconSymbol: "📚",
    evaluate: (state, habits) => ({
      current: getMaxValueByUnitKeyword(state, habits, [
        "leer",
        "lectura",
        "página",
        "libro",
      ]),
      target: 30,
    }),
  },
  {
    id: "ach-21",
    code: "ESP-03",
    title: "Caminante Activo (6,000 Pasos)",
    description: "Alcanzar 6,000 pasos en un hábito de caminata o movimiento.",
    ruleExplanation: "Valor en hábito de pasos/caminar >= 6000.",
    category: "Especialidades",
    tier: "plata",
    points: 220,
    iconSymbol: "👟",
    evaluate: (state, habits) => ({
      current: getMaxValueByUnitKeyword(state, habits, [
        "paso",
        "caminar",
        "caminata",
      ]),
      target: 6000,
    }),
  },
  {
    id: "ach-22",
    code: "ESP-04",
    title: "Hora de Enfoque Profundo",
    description: "Acumular 60 minutos totales en hábitos medidos por tiempo.",
    ruleExplanation: "Suma de minutos registrados >= 60 min.",
    category: "Especialidades",
    tier: "plata",
    points: 240,
    iconSymbol: "⏱️",
    evaluate: (state, habits) => ({
      current: getTotalMinutesAccumulated(state, habits),
      target: 60,
    }),
  },
  {
    id: "ach-23",
    code: "ESP-05",
    title: "Maratón de Productividad (180 min)",
    description: "Acumular 180 minutos (3 horas) en hábitos de tiempo.",
    ruleExplanation: "Suma de minutos registrados >= 180 min.",
    category: "Especialidades",
    tier: "oro",
    points: 420,
    iconSymbol: "⌛",
    evaluate: (state, habits) => ({
      current: getTotalMinutesAccumulated(state, habits),
      target: 180,
    }),
  },
  {
    id: "ach-24",
    code: "ESP-06",
    title: "Rutina Multidimensional",
    description: "Tener hábitos con al menos 3 unidades de medida diferentes.",
    ruleExplanation: "Unidades distintas en catálogo de hábitos >= 3.",
    category: "Especialidades",
    tier: "plata",
    points: 190,
    iconSymbol: "🧩",
    evaluate: (_state, habits) => ({
      current: new Set(habits.map((h) => h.unit.toLocaleLowerCase("es"))).size,
      target: 3,
    }),
  },

  // --- 5. EVIDENCIA Y REFLEXIÓN (6 logros) ---
  {
    id: "ach-25",
    code: "EVI-01",
    title: "Bitácora Reflexiva",
    description: "Registrar un check-in acompañado de una nota de reflexión.",
    ruleExplanation: "Check-ins con nota escrita >= 1.",
    category: "Evidencia y Reflexión",
    tier: "bronce",
    points: 110,
    iconSymbol: "📝",
    evaluate: (state) => ({
      current:
        state.entries.filter((e) => e.note && e.note.trim().length > 0).length +
        (state.evidenceList?.filter((e) => e.note && e.note.trim().length > 0)
          .length ?? 0),
      target: 1,
    }),
  },
  {
    id: "ach-26",
    code: "EVI-02",
    title: "Evidencia Fotográfica",
    description: "Subir tu primera imagen de evidencia en un check-in.",
    ruleExplanation: "Check-ins con fotografía adjunta >= 1.",
    category: "Evidencia y Reflexión",
    tier: "plata",
    points: 200,
    iconSymbol: "📸",
    evaluate: (state) => ({
      current: Math.max(
        state.entries.filter((e) => Boolean(e.imageDataUrl)).length,
        state.evidenceList?.filter((e) => Boolean(e.imageDataUrl)).length ?? 0,
      ),
      target: 1,
    }),
  },
  {
    id: "ach-27",
    code: "EVI-03",
    title: "Galería Verificable (3 Fotos)",
    description: "Documentar 3 avances con fotografía de evidencia.",
    ruleExplanation: "Check-ins con fotografía adjunta >= 3.",
    category: "Evidencia y Reflexión",
    tier: "oro",
    points: 380,
    iconSymbol: "🖼️",
    evaluate: (state) => ({
      current: Math.max(
        state.entries.filter((e) => Boolean(e.imageDataUrl)).length,
        state.evidenceList?.filter((e) => Boolean(e.imageDataUrl)).length ?? 0,
      ),
      target: 3,
    }),
  },
  {
    id: "ach-28",
    code: "EVI-04",
    title: "Energía al Máximo",
    description: "Registrar un avance con nivel de energía percibida de 9 o 10.",
    ruleExplanation: "Check-ins con energyLevel >= 9.",
    category: "Evidencia y Reflexión",
    tier: "bronce",
    points: 130,
    iconSymbol: "🔋",
    evaluate: (state) => ({
      current: state.entries.filter((e) => (e.energyLevel ?? 0) >= 9).length,
      target: 1,
    }),
  },
  {
    id: "ach-29",
    code: "EVI-05",
    title: "Enfoque Excelente",
    description: "Registrar un avance en estado de ánimo 'Excelente'.",
    ruleExplanation: "Check-ins con estado de ánimo 'excelente' >= 1.",
    category: "Evidencia y Reflexión",
    tier: "bronce",
    points: 130,
    iconSymbol: "✨",
    evaluate: (state) => ({
      current: state.entries.filter((e) => e.mood === "excelente").length,
      target: 1,
    }),
  },
  {
    id: "ach-30",
    code: "EVI-06",
    title: "Cronista de Hábitos (5 Notas)",
    description: "Escribir 5 notas de reflexión en tus registros de avance.",
    ruleExplanation: "Check-ins con nota de reflexión >= 5.",
    category: "Evidencia y Reflexión",
    tier: "oro",
    points: 360,
    iconSymbol: "📖",
    evaluate: (state) => ({
      current: state.entries.filter((e) => e.note && e.note.trim().length > 0)
        .length,
      target: 5,
    }),
  },

  // --- 6. MAESTRÍA (6 logros) ---
  {
    id: "ach-31",
    code: "MAE-01",
    title: "Sobrecumplimiento (120%)",
    description: "Superar al menos en un 20% adicional la meta diaria de un hábito.",
    ruleExplanation: "Hábito con valor registrado >= 1.2 * meta.",
    category: "Maestría",
    tier: "oro",
    points: 320,
    iconSymbol: "🔥",
    evaluate: (state, habits) => {
      const hasOver =
        habits.some((h) => h.target > 0 && h.value >= h.target * 1.2) ||
        state.entries.some((e) => {
          const h = habits.find((item) => item.id === e.habitId);
          return h ? h.target > 0 && e.value >= h.target * 1.2 : false;
        });
      return { current: hasOver ? 1 : 0, target: 1 };
    },
  },
  {
    id: "ach-32",
    code: "MAE-02",
    title: "Sincronía Matutina y Nocturna",
    description: "Tener hábitos configurados tanto por la mañana como por la noche.",
    ruleExplanation: "Al menos 1 hábito 'Por la mañana' y 1 'Por la noche'.",
    category: "Maestría",
    tier: "plata",
    points: 250,
    iconSymbol: "🌗",
    evaluate: (_state, habits) => {
      const morning = habits.some((h) =>
        h.detail.toLocaleLowerCase("es").includes("mañana"),
      );
      const night = habits.some((h) =>
        h.detail.toLocaleLowerCase("es").includes("noche"),
      );
      return { current: (morning ? 1 : 0) + (night ? 1 : 0), target: 2 };
    },
  },
  {
    id: "ach-33",
    code: "MAE-03",
    title: "Doble Racha Simultánea",
    description: "Mantener progreso cumplido en 2 hábitos distintos a la vez.",
    ruleExplanation: "Hábitos activos con racha >= 1 simultáneamente >= 2.",
    category: "Maestría",
    tier: "plata",
    points: 280,
    iconSymbol: "🔗",
    evaluate: (state, habits) => ({
      current: getActiveStreaksCount(state, habits),
      target: 2,
    }),
  },
  {
    id: "ach-34",
    code: "MAE-04",
    title: "Catálogo Experto (5 Hábitos)",
    description: "Gestionar un portafolio de 5 o más hábitos en tu cuenta.",
    ruleExplanation: "Total de hábitos en cuenta >= 5.",
    category: "Maestría",
    tier: "oro",
    points: 400,
    iconSymbol: "🎖️",
    evaluate: (_state, habits) => ({
      current: habits.length,
      target: 5,
    }),
  },
  {
    id: "ach-35",
    code: "MAE-05",
    title: "Coleccionista de Logros (10 Medallas)",
    description: "Desbloquear al menos 10 logros en Quantify Core.",
    ruleExplanation: "Total de logros desbloqueados >= 10.",
    category: "Maestría",
    tier: "oro",
    points: 600,
    iconSymbol: "🏆",
    evaluate: (_state, _habits, unlockedBeforeMastery = 0) => ({
      current: unlockedBeforeMastery,
      target: 10,
    }),
  },
  {
    id: "ach-36",
    code: "MAE-06",
    title: "Leyenda Quantify Core (20 Medallas)",
    description: "Alcanzar el grado maestro desbloqueando 20 logros del sistema.",
    ruleExplanation: "Total de logros desbloqueados >= 20.",
    category: "Maestría",
    tier: "diamante",
    points: 1500,
    iconSymbol: "💎",
    evaluate: (_state, _habits, unlockedBeforeMastery = 0) => ({
      current: unlockedBeforeMastery,
      target: 20,
    }),
  },
];

export function evaluateAllAchievements(
  state: DemoState,
  habits: HabitView[],
): {
  items: EvaluatedAchievement[];
  unlockedCount: number;
  totalCount: number;
  totalPoints: number;
  maxPoints: number;
  level: number;
  levelTitle: string;
  nextLevelPct: number;
} {
  // First pass for achievements 1..34
  let baseUnlocked = 0;
  const firstPass = ACHIEVEMENTS_CATALOG.map((def) => {
    if (def.id === "ach-35" || def.id === "ach-36") {
      return { def, current: 0, target: 10 };
    }
    const { current, target } = def.evaluate(state, habits, 0);
    if (current >= target) baseUnlocked += 1;
    return { def, current, target };
  });

  const items: EvaluatedAchievement[] = firstPass.map(({ def, current, target }) => {
    const finalEval =
      def.id === "ach-35" || def.id === "ach-36"
        ? def.evaluate(state, habits, baseUnlocked)
        : { current, target };
    const unlocked = finalEval.current >= finalEval.target;
    const progressPct = clampProgress(finalEval.current, finalEval.target);
    return {
      ...def,
      current: finalEval.current,
      target: finalEval.target,
      progressPct,
      unlocked,
    };
  });

  const unlockedCount = items.filter((i) => i.unlocked).length;
  const totalCount = items.length;
  const totalPoints = items
    .filter((i) => i.unlocked)
    .reduce((acc, i) => acc + i.points, 0);
  const maxPoints = items.reduce((acc, i) => acc + i.points, 0);

  const level = Math.max(1, Math.floor(totalPoints / 350) + 1);
  const levelTitles = [
    "Iniciado Consciente",
    "Constructor de Hábitos",
    "Estratega de Constancia",
    "Arquitecto de Disciplina",
    "Maestro del Equilibrio",
    "Leyenda Quantify Core",
  ];
  const levelTitle =
    levelTitles[Math.min(levelTitles.length - 1, level - 1)];
  const nextLevelPct = Math.min(100, Math.round(((totalPoints % 350) / 350) * 100));

  return {
    items,
    unlockedCount,
    totalCount,
    totalPoints,
    maxPoints,
    level,
    levelTitle,
    nextLevelPct,
  };
}
