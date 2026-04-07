import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getWeekDays, getWeekString, getDateString, isToday, isWeekend, formatHour
} from '../utils/dateUtils';
import { useSettings } from '../utils/settingsUtils';
import Modal from '../components/Modal';
import TimeEntryForm from '../components/TimeEntryForm';

export default function SchedulePage() {
  const { state, dispatch, getTaskColor, currentUserId } = useApp();
  const { settings } = useSettings();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [deleteEntry, setDeleteEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const weekString = useMemo(() => getWeekString(currentDate), [currentDate]);

  const filteredWeekDays = useMemo(() => {
    return weekDays.filter(day => {
      const dayOfWeek = day.getDay();
      if (dayOfWeek === 0 && !settings.showSunday) return false;
      if (dayOfWeek === 6 && !settings.showSaturday) return false;
      return true;
    });
  }, [weekDays, settings.showSaturday, settings.showSunday]);

  const hours = useMemo(() => {
    const h = [];
    for (let i = settings.workStartHour; i < settings.workEndHour; i++) {
      h.push(i);
    }
    return h;
  }, [settings.workStartHour, settings.workEndHour]);

  function prevWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  function openSlot(date, hour) {
    setSelectedSlot({ date: getDateString(date), hour });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelectedSlot(null);
  }

  function getEntriesForCell(date, hour) {
    const dateStr = getDateString(date);
    return state.timeEntries.filter(e => e.date === dateStr && e.startHour <= hour && e.endHour > hour);
  }

  function extractTags(text) {
    const tags = [];
    const cleaned = text.replace(/\[([^\]]+)\]/g, (_, tag) => {
      tags.push(tag);
      return '';
    }).trim();
    return { tags, remaining: cleaned };
  }

  const myEntries = useMemo(() => {
    return state.timeEntries.filter(e => e.userId === currentUserId);
  }, [state.timeEntries, currentUserId]);

  function getMyEntriesForCell(date, hour) {
    const dateStr = getDateString(date);
    return myEntries.filter(e => e.date === dateStr && e.startHour <= hour && e.endHour > hour);
  }

  const taskMap = useMemo(() => {
    const m = {};
    state.tasks.forEach(t => { m[t.id] = t; });
    return m;
  }, [state.tasks]);

  return (
    <div>
      <div className="week-nav">
        <button className="week-btn" onClick={prevWeek} title="Semana anterior">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>
        <div className="week-nav-center">
          <span className="week-title">{weekString}</span>
          <button className="today-btn" onClick={goToday}>Hoy</button>
        </div>
        <button className="week-btn" onClick={nextWeek} title="Semana siguiente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
      </div>

<div className="schedule-wrapper">
        <div className="schedule-grid" style={{ gridTemplateColumns: `60px repeat(${filteredWeekDays.length}, 1fr)` }}>
          <div className="schedule-header"></div>
          {filteredWeekDays.map((day, i) => (
            <div key={i} className={`schedule-header ${isWeekend(day) ? 'weekend' : ''}`}>
              <div style={{ fontWeight: 600 }}>{day.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
              <div style={{ fontSize: '0.625rem', marginTop: 2 }}>{day.getDate()}</div>
            </div>
          ))}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="time-label">{formatHour(hour)}</div>
              {filteredWeekDays.map((day, di) => {
                const entries = getEntriesForCell(day, hour);
                return (
                  <div
                    key={`${di}-${hour}`}
                    className={`time-slot ${isWeekend(day) ? 'weekend' : ''}`}
                  >
                    <button
                      onClick={() => openSlot(day, hour)}
                      style={{ position: 'absolute', top: 2, right: 2, background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', opacity: 0.5, display: 'flex', alignItems: 'center' }}
                      title="Agregar sesión"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    {entries.map(e => {
                      const task = taskMap[e.taskId];
                      if (!task) return null;
                      const color = getTaskColor(state.tasks, e.taskId, state.clients);
                      const user = state.users.find(u => u.id === e.userId);
                      const isMe = e.userId === currentUserId;
                      const { tags, remaining } = extractTags(e.description || '');
                      const shortDesc = remaining.length > 60 ? remaining.substring(0, 60) + '…' : remaining;
                      return (
                        <div
                          key={e.id}
                          className="time-slot-entry"
                          style={isMe ? { borderLeft: `3px solid ${user?.color || '#7C3AED'}`, cursor: 'pointer' } : { cursor: 'default' }}
                          onClick={isMe ? () => setEditingEntry(e) : undefined}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-1)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                {task.name}
                              </div>
                              {tags.length > 0 && (
                                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 2 }}>
                                  {tags.map((tag, i) => (
                                    <span key={i} style={{
                                      fontSize: '0.6rem',
                                      padding: '1px 4px',
                                      borderRadius: 3,
                                      background: color + '33',
                                      color: color,
                                      fontWeight: 500
                                    }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {shortDesc && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.3 }}>
                                  {shortDesc}
                                </div>
                              )}
                            </div>
                            {isMe && (
                              <button
                                onClick={ev => { ev.stopPropagation(); setDeleteEntry(e); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                                title="Eliminar sesión"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {modalOpen && selectedSlot && (
        <Modal onClose={closeModal} title={`${formatHour(selectedSlot.hour)} - ${selectedSlot.date}`}>
          <TimeEntryForm
            date={selectedSlot.date}
            hour={selectedSlot.hour}
            onClose={closeModal}
          />
        </Modal>
      )}

      {deleteEntry && (
        <Modal onClose={() => setDeleteEntry(null)} title="Eliminar sesión">
          <div style={{ padding: 'var(--space-4) var(--space-4) var(--space-6)' }}>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              ¿Estás seguro de que quieres eliminar esta sesión de trabajo?
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteEntry(null)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: 'var(--warning)', color: 'white', borderColor: 'var(--warning)' }}
                onClick={() => {
                  dispatch.deleteTimeEntry(deleteEntry.id);
                  setDeleteEntry(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editingEntry && (
        <Modal onClose={() => setEditingEntry(null)} title={`Editar sesión`}>
          <TimeEntryForm
            entry={editingEntry}
            onClose={() => setEditingEntry(null)}
          />
        </Modal>
      )}
    </div>
  );
}