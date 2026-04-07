import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDate, formatHour, formatHours, getTaskProgress, getTotalHours, isDeadlineUrgent } from '../utils/dateUtils';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';

export default function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, getTaskColor } = useApp();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const task = useMemo(() => state.tasks.find(t => t.id === id), [state.tasks, id]);
  const client = useMemo(() => task?.clientId ? state.clients.find(c => c.id === task.clientId) : null, [state.clients, task]);
  const entries = useMemo(() =>
    state.timeEntries.filter(e => e.taskId === id).sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.startHour - a.startHour;
    }), [state.timeEntries, id]);

  if (!task) {
    return (
      <div className="empty-state">
        <h3 className="empty-state-title">Tarea no encontrada</h3>
        <p className="empty-state-description">Esta tarea puede haber sido eliminada</p>
        <button className="btn btn-primary" onClick={() => navigate('/tareas')}>Ver todas</button>
      </div>
    );
  }

  const color = getTaskColor(state.tasks, id, state.clients);
  const progress = getTaskProgress(task, state.timeEntries);
  const totalHours = getTotalHours(state.timeEntries, id);

  const statusLabels = {
    backlog: 'Backlog',
    in_progress: 'En progreso',
    completed: 'Completada',
    archived: 'Archivada'
  };

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tareas')} style={{ marginBottom: 'var(--space-4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Volver a tareas
        </button>
      </div>

      <div className="task-detail-header">
        <h1 className="task-detail-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span className="task-color-dot" style={{ background: color, width: 12, height: 12 }}></span>
          {task.name}
        </h1>
        <div className="task-detail-badges">
          <span className={`task-card-badge badge-${task.status}`}>{statusLabels[task.status]}</span>
          {task.deadline && (
            <span className={`task-card-badge ${isDeadlineUrgent(task.deadline) ? 'badge-in_progress' : 'badge-backlog'}`}>
              Deadline: {formatDate(task.deadline)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        <div>
          <div className="task-detail-section">
            <h2 className="task-detail-section-title">Información</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {task.description && (
                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Descripción</div>
                  <div style={{ fontSize: '0.9375rem' }}>{task.description}</div>
                </div>
              )}
              {client && (
                <div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Cliente</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: client.color, display: 'inline-block' }}></span>
                    <span style={{ fontSize: '0.9375rem' }}>{client.name}</span>
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Tiempo estimado</div>
                <div style={{ fontSize: '0.9375rem', fontFamily: 'var(--font-mono)' }}>{formatHours(task.estimatedHours)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Tiempo invertido</div>
                <div style={{ fontSize: '0.9375rem', fontFamily: 'var(--font-mono)' }}>{formatHours(totalHours)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Progreso</div>
                <div className="progress-bar" style={{ marginBottom: 'var(--space-2)' }}>
                  <div
                    className={`progress-bar-fill ${progress < 33 ? 'progress-low' : progress < 66 ? 'progress-medium' : 'progress-high'}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{progress}%</div>
              </div>
            </div>
          </div>

          <div className="task-detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 className="task-detail-section-title" style={{ margin: 0 }}>Requisitos</h2>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => {
                  const newReqs = [...task.requirements, { text: '', completed: false }];
                  dispatch.updateTask(task.id, { requirements: newReqs });
                }}
              >
                + Añadir
              </button>
            </div>
            {task.requirements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin requisitos definidos</p>
            ) : (
              <ul className="requirements-list">
                {task.requirements.map((req, i) => (
                  <li key={i} className={`requirement-item ${req.completed ? 'completed' : ''}`}>
                    <div
                      className={`requirement-checkbox ${req.completed ? 'checked' : ''}`}
                      onClick={() => dispatch.toggleRequirement(task.id, i)}
                    >
                      {req.completed && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </div>
                    <input
                      type="text"
                      value={req.text}
                      className="form-input"
                      placeholder="Descripción del requisito"
                      style={{ flex: 1, fontSize: '0.9375rem' }}
                      onChange={e => {
                        const newReqs = [...task.requirements];
                        newReqs[i] = { ...newReqs[i], text: e.target.value };
                        dispatch.updateTask(task.id, { requirements: newReqs });
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ width: 28, height: 28 }}
                      onClick={e => {
                        e.stopPropagation();
                        const newReqs = task.requirements.filter((_, idx) => idx !== i);
                        dispatch.updateTask(task.id, { requirements: newReqs });
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="task-detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 className="task-detail-section-title" style={{ margin: 0 }}>Sesiones de trabajo</h2>
            </div>
            {entries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay sesiones registradas</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {entries.map(entry => {
                  const entryUser = state.users.find(u => u.id === entry.userId);
                  return (
                  <div key={entry.id} style={{ padding: 'var(--space-3)', background: 'var(--bg)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        {formatDate(entry.date)}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, background: entryUser?.color + '22', color: entryUser?.color || 'var(--text-secondary)' }}>
                          {entryUser?.name || '?'}
                        </span>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {formatHour(entry.startHour)} - {formatHour(entry.endHour)}
                        </span>
                      </div>
                    </div>
                    {entry.description && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{entry.description}</p>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <button className="btn btn-secondary" onClick={() => setEditOpen(true)}>Editar tarea</button>
            {task.status !== 'completed' && (
              <button
                className="btn btn-primary"
                onClick={() => dispatch.setTaskStatus(task.id, 'completed')}
              >
                Marcar completada
              </button>
            )}
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--warning)' }}
              onClick={() => setDeleteOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {editOpen && (
        <Modal onClose={() => setEditOpen(false)} title="Editar tarea">
          <TaskForm task={task} onClose={() => setEditOpen(false)} />
        </Modal>
      )}

      {deleteOpen && (
        <Modal onClose={() => setDeleteOpen(false)} title="Eliminar tarea">
          <div style={{ padding: 'var(--space-4) var(--space-4) var(--space-6)' }}>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--text-secondary)' }}>
              ¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer y se eliminarán también todas las sesiones de trabajo asociadas.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
                Cancelar
              </button>
              <button
                className="btn"
                style={{ background: 'var(--warning)', color: 'white', borderColor: 'var(--warning)' }}
                onClick={() => {
                  dispatch.deleteTask(task.id);
                  navigate('/tareas');
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}