import { useRef, useState } from 'react'
import type { Habit } from '../data/habits'
import { Icon } from './Icon'

const weekdays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
export function HabitEditor({ habit, onPreview }: { habit?: Habit; onPreview: (habit: Habit) => void }) {
  const preview = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState<Habit | null>(null)
  const [selectedDays, setSelectedDays] = useState(weekdays)
  const [error, setError] = useState('')
  return <>
    <form className="card form-card" onSubmit={e => {
      e.preventDefault()
      const data = new FormData(e.currentTarget)
      const name = String(data.get('name')).trim()
      if (!name || !selectedDays.length) { setError('Escribe un nombre y elige al menos un día para explorar tu hábito.'); return }
      setError('')
      setDraft({ id: habit?.id ?? `preview-${Date.now()}`, name, detail: String(data.get('moment')), value: habit?.value ?? 0, target: Number(data.get('target')), unit: String(data.get('unit')), color: habit?.color ?? 'blue' })
      preview.current?.showModal()
    }}>
      <div className="section-heading"><div><h2>{habit ? 'Ajusta tu rutina' : 'Hazlo tuyo'}</h2><p>Una intención clara es un buen punto de partida.</p></div><span className="symbol blue"><Icon name={habit ? 'editar' : 'crear'} /></span></div>
      {error && <p className="form-note" role="alert">{error}</p>}
      <label>Nombre del hábito<input name="name" required maxLength={80} defaultValue={habit?.name} placeholder="Por ejemplo, leer con calma" /></label>
      <div className="form-grid"><label>Meta diaria<input name="target" type="number" min="1" max="1000000" step="1" required defaultValue={habit?.target} placeholder="20" /></label><label>Unidad<select name="unit" defaultValue={habit?.unit ?? 'min'}><option value="min">minutos</option><option value="vasos">vasos</option><option value="pasos">pasos</option><option value="veces">veces</option></select></label></div>
      <fieldset><legend>¿Qué días quieres dedicarle?</legend><div className="day-picker">{weekdays.map((day,i) => <label key={day}><input type="checkbox" checked={selectedDays.includes(day)} aria-label={day} onChange={e => setSelectedDays(current => e.target.checked ? [...current,day] : current.filter(d => d !== day))} /><span>{['L','M','X','J','V','S','D'][i]}</span></label>)}</div></fieldset>
      <label>Momento del día<select name="moment"><option>Cuando encuentre mi momento</option><option>Por la mañana</option><option>Por la tarde</option><option>Por la noche</option></select></label>
      <label>Una intención personal <small>Opcional</small><textarea placeholder="¿Qué te gustaría que este hábito aporte a tu día?" rows={3} /></label>
      <div className="form-note"><Icon name="privacidad" />Tu rutina pertenece a tu espacio personal.</div><div className="form-actions"><a href={habit ? `#/detalle/${habit.id}` : '#/habitos'} className="button secondary">Cancelar</a><button className="button primary" type="submit"><Icon name="ver" />Previsualizar hábito</button></div>
    </form>
    <dialog ref={preview} aria-labelledby="habit-preview-title"><div className="section-heading"><h2 id="habit-preview-title">Así se verá tu hábito</h2><button className="icon-button" onClick={() => preview.current?.close()} aria-label="Cerrar vista previa"><Icon name="cancelar" /></button></div><div className="habit-preview"><span className="symbol blue"><Icon name="habitos" /></span><h3>{draft?.name}</h3><p>{draft?.target} {draft?.unit} · {draft?.detail}</p><div className="progress"><span style={{width:'0%'}} /></div></div><p className="caption">{selectedDays.join(' · ')}</p><div className="form-note"><Icon name="informacion" />Puedes recorrer este hábito durante la demostración. Al recargar se restablecen los ejemplos.</div><div className="form-actions"><button className="button secondary" onClick={() => preview.current?.close()}>Seguir editando</button><button className="button primary" onClick={() => { if (draft) { onPreview(draft); preview.current?.close() } }}>Ver en mi rutina</button></div></dialog>
  </>
}
