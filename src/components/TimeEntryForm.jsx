import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatHour } from '../utils/dateUtils';

export default function TimeEntryForm({ date, hour, onClose, entry }) {
  const { state, dispatch, currentUserId } = useApp();
  const isEditing = !!entry;
  const [taskId, setTaskId] = useState(entry?.taskId || state.tasks.find(t => t.status === 'in_progress')?.id || '');
  const [endHour, setEndHour] = useState(entry?.endHour || hour + 1);
  const [description, setDescription] = useState(entry?.description || '');
  const [taskSearch, setTaskSearch] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!taskId || !currentUserId) return;
    if (isEditing) {
      await dispatch.updateTimeEntry(entry.id, { taskId, date: entry.date, startHour: entry.startHour, endHour, description });
    } else {
      await dispatch.addTimeEntry({ userId: currentUserId, taskId, date, startHour: hour, endHour, description });
    }
    onClose();
  }

  const filteredTasks = useMemo(() => {
    const search = taskSearch.toLowerCase();
    return state.tasks.filter(t =>
      t.status !== 'archived' &&
      t.status !== 'completed' &&
      (t.name.toLowerCase().includes(search) ||
      t.description?.toLowerCase().includes(search))
    );
  }, [state.tasks, taskSearch]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Tarea</label>
          <input
            type="text"
            className="form-input"
            value={taskSearch}
            onChange={e => setTaskSearch(e.target.value)}
            placeholder="Buscar tarea..."
            style={{ marginBottom: 'var(--space-2)' }}
          />
          <select
            className="form-select"
            value={taskId}
            onChange={e => setTaskId(e.target.value)}
            required
            size={Math.min(6, filteredTasks.length + 1)}
          >
            <option value="">Selecciona una tarea...</option>
            {filteredTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.status === 'completed' ? '(completada)' : ''}
              </option>
            ))}
          </select>
          {!currentUserId && (
            <p className="form-hint" style={{ color: 'var(--warning)' }}>Selecciona un usuario arriba para registrar horas.</p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Hora de fin</label>
          <select
            className="form-select"
            value={endHour}
            onChange={e => setEndHour(Number(e.target.value))}
          >
            {Array.from({ length: 20 - hour }, (_, i) => hour + i + 1).map(h => (
              <option key={h} value={h}>{formatHour(h)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="¿Qué hiciste en esta hora?"
            rows={3}
          />
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={!taskId}>
          {isEditing ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}