import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TaskForm({ task, onClose }) {
  const { state, dispatch } = useApp();
  const [name, setName] = useState(task?.name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [clientId, setClientId] = useState(task?.clientId || '');
  const [deadline, setDeadline] = useState(task?.deadline || '');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours || 1);
  const [requirements, setRequirements] = useState(task?.requirements || []);
  const [tags, setTags] = useState(task?.tags || []);
  const [newTag, setNewTag] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = { name, description, clientId: clientId || null, deadline, estimatedHours, requirements, tags };
    if (task) {
      await dispatch.updateTask(task.id, payload);
    } else {
      await dispatch.addTask(payload);
    }
    onClose();
  }

  function addTag() {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  }

  function removeTag(tag) {
    setTags(tags.filter(t => t !== tag));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="modal-body">
        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nombre de la tarea"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-textarea"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe la tarea..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cliente</label>
          <select
            className="form-input"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
          >
            <option value="">Sin cliente</option>
            {state.clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              type="date"
              className="form-input"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Horas estimadas</label>
            <input
              type="number"
              className="form-input"
              value={estimatedHours}
              onChange={e => setEstimatedHours(Number(e.target.value))}
              min="0.5"
              step="0.5"
            />
          </div>
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="form-label" style={{ margin: 0 }}>Requisitos</label>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => setRequirements([...requirements, { text: '', completed: false }])}
            >
              + Añadir
            </button>
          </div>
          {requirements.length === 0 ? (
            <p className="form-hint">Pulse + para añadir requisitos</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {requirements.map((req, i) => (
                <li key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <div
                    className={`requirement-checkbox ${req.completed ? 'checked' : ''}`}
                    onClick={() => {
                      const updated = [...requirements];
                      updated[i] = { ...updated[i], completed: !updated[i].completed };
                      setRequirements(updated);
                    }}
                  >
                    {req.completed && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={req.text}
                    onChange={e => {
                      const updated = [...requirements];
                      updated[i] = { ...updated[i], text: e.target.value };
                      setRequirements(updated);
                    }}
                    placeholder={`Requisito ${i + 1}`}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ width: 28, height: 28, padding: 0 }}
                    onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))}
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

        <div className="form-group">
          <label className="form-label">Tags</label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
            {tags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'var(--accent)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="text"
              className="form-input"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="Añadir tag..."
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addTag(); }
              }}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-secondary" onClick={addTag}>+</button>
          </div>
        </div>
      </div>
      <div className="modal-footer" style={{ display: 'flex', justifyContent: task ? 'space-between' : 'flex-end' }}>
        {task && (
          <button
            type="button"
            className="btn"
            style={{ background: 'var(--warning)', color: 'white', borderColor: 'var(--warning)' }}
            onClick={() => {
              if (confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) {
                dispatch.deleteTask(task.id);
                onClose();
              }
            }}
          >
            Eliminar tarea
          </button>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">{task ? 'Guardar' : 'Crear'}</button>
        </div>
      </div>
    </form>
  );
}