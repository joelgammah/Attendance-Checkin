import React from 'react'
import Nav from '../components/Nav'
import { createEvent } from '../api/events'

export default function EventFormPage(){
  const [form, setForm] = React.useState({ name: '', location: '', start_time: '', end_time: '', notes: '' })
  const [error, setError] = React.useState('')

  function update<K extends keyof typeof form>(k: K, v: string){ setForm(s=>({ ...s, [k]: v })) }

  async function onSubmit(e: React.FormEvent){
    e.preventDefault()
    try {
      const payload = { ...form, start_time: new Date(form.start_time).toISOString(), end_time: new Date(form.end_time).toISOString() }
      const ev = await createEvent(payload)
      location.href = `/events/${ev.checkin_token}`
    } catch(err:any){ setError(err.message) }
  }

  return (
    <div>
      <Nav />
      <form onSubmit={onSubmit} className="max-w-xl m-4 p-4 rounded-2xl shadow grid gap-3">
        <h1 className="text-xl font-semibold">Create Event</h1>
        {error && <div className="text-red-600 text-sm" role="alert">{error}</div>}
        <label className="grid">Name<input className="border rounded p-2" value={form.name} onChange={e=>update('name', e.target.value)} required /></label>
        <label className="grid">Location<input className="border rounded p-2" value={form.location} onChange={e=>update('location', e.target.value)} required /></label>
        <label className="grid">Start Time<input type="datetime-local" className="border rounded p-2" value={form.start_time} onChange={e=>update('start_time', e.target.value)} required /></label>
        <label className="grid">End Time<input type="datetime-local" className="border rounded p-2" value={form.end_time} onChange={e=>update('end_time', e.target.value)} required /></label>
        <label className="grid">Notes<textarea className="border rounded p-2" value={form.notes} onChange={e=>update('notes', e.target.value)} /></label>
        <button className="bg-black text-white rounded p-2">Create</button>
      </form>
    </div>
  )
}
