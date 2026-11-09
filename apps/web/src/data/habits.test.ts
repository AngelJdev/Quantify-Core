import { describe, expect, it } from 'vitest'
import { clampProgress, incrementHabit, initialHabits } from './habits'

describe('habit prototype rules', () => {
  it('keeps progress inside the visual range', () => {
    expect(clampProgress(5, 8)).toBe(63)
    expect(clampProgress(12, 8)).toBe(100)
    expect(clampProgress(-1, 8)).toBe(0)
  })

  it('never increments a habit beyond its target', () => {
    const habit = { ...initialHabits[0], value: initialHabits[0].target }
    expect(incrementHabit(habit).value).toBe(habit.target)
  })
})
