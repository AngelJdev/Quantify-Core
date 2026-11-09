export type Habit = {
  id: string
  name: string
  detail: string
  value: number
  target: number
  unit: string
  color: 'blue' | 'cyan' | 'emerald'
}

export const initialHabits: Habit[] = [
  { id: 'water', name: 'Tomar agua', detail: 'Meta diaria', value: 5, target: 8, unit: 'vasos', color: 'blue' },
  { id: 'read', name: 'Leer', detail: 'Enfoque y aprendizaje', value: 20, target: 30, unit: 'min', color: 'cyan' },
  { id: 'walk', name: 'Caminar', detail: 'Movimiento consciente', value: 4200, target: 6000, unit: 'pasos', color: 'emerald' },
]

export const clampProgress = (value: number, target: number) =>
  Math.min(100, Math.max(0, Math.round((value / target) * 100)))

export const incrementHabit = (habit: Habit): Habit => {
  const step = habit.id === 'walk' ? 500 : habit.id === 'read' ? 5 : 1
  return { ...habit, value: Math.min(habit.target, habit.value + step) }
}
