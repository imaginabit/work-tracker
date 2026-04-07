import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate, isDeadlineNear, getTaskProgress, formatHours, getTotalHours } from '../utils/dateUtils';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';

const STATUS_COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
  { id: 'in_progress', label: 'En progreso', color: 'var(--accent)' },
  { id: 'completed', label: 'Completadas', color: 'var(--success)' },
  { id: 'archived', label: 'Archivadas', color: 'var(--text-muted)' }
];

export default function TasksPage() {
  const { state, dispatch, getTaskColor } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterTag, setFilterTag] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedTag, setDraggedTag] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);

  const allTags = useMemo(() => {
    const tags = new Set();
    state.tasks.forEach(t => {
      (t.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [state.tasks]);

  const filteredTasks = useMemo(() => {
    let tasks = [...state.tasks];
    if (selectedClient) tasks = tasks.filter(t => t.clientId === selectedClient);
    if (filterTag) tasks = tasks.filter(t => (t.tags || []).includes(filterTag));
    return tasks;
  }, [state.tasks, filterTag, selectedClient]);

  const tasksByStatus = useMemo(() => {
    const grouped = {};
    STATUS_COLUMNS.forEach(col => { grouped[col.id] = []; });
    filteredTasks.forEach(task => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  const stats = useMemo(() => {
    const active = state.tasks.filter(t => t.status === 'in_progress').length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const total = state.tasks.filter(t => t.status !== 'archived').length;
    return { active, completed, total };
  }, [state.tasks]);

  function handleDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  async function handleDrop(e, newStatus) {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTask && draggedTask.status !== newStatus) {
      await dispatch.updateTask(draggedTask.id, { status: newStatus });
    }
    setDraggedTask(null);
  }

  function handleDragEnd() {
    setDraggedTask(null);
    setDraggedTag(null);
    setDragOverColumn(null);
    setDragOverTask(null);
  }

  function handleTagDragStart(e, tag) {
    setDraggedTag(tag);
    e.dataTransfer.effectAllowed = 'link';
    e.dataTransfer.setData('text/plain', tag);
  }

  function handleTagDragEnd() {
    setDraggedTag(null);
    setDragOverTask(null);
  }

  function handleTaskDragOver(e, task) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTask(task.id);
  }

  async function handleTaskDrop(e, task) {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTask(null);
    if (draggedTag && !task.tags?.includes(draggedTag)) {
      const newTags = [...(task.tags || []), draggedTag];
      await dispatch.updateTask(task.id, { tags: newTags });
    }
    setDraggedTag(null);
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 className="page-title">Tareas</h1>
          <p className="page-subtitle">{stats.total} tareas · {stats.completed} completadas</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva tarea
        </button>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          className="btn btn-sm"
          style={{ cursor: 'pointer', background: selectedClient ? 'var(--accent)' : 'var(--surface)', color: selectedClient ? 'white' : 'inherit', border: '1px solid var(--border)' }}
          value={selectedClient || ''}
          onChange={e => setSelectedClient(e.target.value || null)}
        >
          <option value="">Todos los clientes</option>
          {state.clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {selectedClient && (
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setSelectedClient(null)}
            style={{ height: 32 }}
          >
            Limpiar
          </button>
        )}

        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tags:</span>
            {filterTag && (
              <button
                className="btn btn-sm"
                onClick={() => setFilterTag(null)}
                style={{ height: 24, fontSize: '0.7rem', padding: '0 6px', background: 'var(--accent)', color: 'white' }}
              >
                × Limpiar
              </button>
            )}
            {allTags.map(tag => (
              <button
                key={tag}
                draggable
                onDragStart={e => handleTagDragStart(e, tag)}
                onDragEnd={handleTagDragEnd}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                style={{
                  height: 24,
                  fontSize: '0.7rem',
                  padding: '0 6px',
                  background: filterTag === tag ? 'var(--accent)' : 'var(--surface)',
                  color: filterTag === tag ? 'white' : 'inherit',
                  border: '1px solid var(--border)',
                  cursor: 'grab'
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STATUS_COLUMNS.length}, minmax(250px, 1fr))`, gap: 'var(--space-4)', overflowX: 'auto' }}>
        {STATUS_COLUMNS.map(col => (
          <div
            key={col.id}
            onDragOver={e => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              minHeight: 400,
              padding: 'var(--space-2)',
              borderRadius: 8,
              background: dragOverColumn === col.id ? 'var(--accent-light)' : 'transparent',
              transition: 'background 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-2) var(--space-3)', background: 'var(--surface)', borderRadius: 8, borderBottom: `2px solid ${col.color}` }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{col.label}</span>
              <span style={{ background: col.color + '22', color: col.color, padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 500 }}>
                {tasksByStatus[col.id].length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flex: 1 }}>
              {tasksByStatus[col.id].map(task => {
                const color = getTaskColor(state.tasks, task.id, state.clients);
                const progress = getTaskProgress(task, state.timeEntries);
                const hours = getTotalHours(state.timeEntries, task.id);
                const client = state.clients.find(c => c.id === task.clientId);

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => handleTaskDragOver(e, task)}
                    onDrop={e => handleTaskDrop(e, task)}
                    onDragLeave={() => setDragOverTask(null)}
                    onClick={() => setEditingTask(task)}
                    className="task-card"
                    style={{
                      cursor: 'grab',
                      opacity: draggedTask?.id === task.id ? 0.5 : 1,
                      border: draggedTask?.id === task.id ? `2px dashed ${col.color}` : undefined,
                      outline: dragOverTask === task.id ? '2px solid var(--accent)' : undefined,
                      outlineOffset: dragOverTask === task.id ? '2px' : undefined
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                      <span className="task-color-dot" style={{ background: color, width: 8, height: 8 }}></span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.name}
                      </span>
                    </div>

                    {task.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {task.description}
                      </p>
                    )}

                    {(task.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
                        {(task.tags || []).map(tag => (
                          <span key={tag} style={{
                            fontSize: '0.6rem',
                            padding: '1px 5px',
                            borderRadius: 8,
                            background: 'var(--accent)',
                            color: 'white',
                            fontWeight: 500
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: '0.7rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {task.deadline && (
                        <span className={isDeadlineNear(task.deadline) ? 'deadline-near' : ''}>
                          {formatDate(task.deadline)}
                        </span>
                      )}
                      <span>{formatHours(hours)} / {formatHours(task.estimatedHours)}</span>
                      {client && (
                        <span style={{ color: client.color }}>{client.name}</span>
                      )}
                    </div>

                    {progress > 0 && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <div className="progress-bar" style={{ height: 4 }}>
                          <div
                            className={`progress-bar-fill ${progress < 33 ? 'progress-low' : progress < 66 ? 'progress-medium' : 'progress-high'}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {tasksByStatus[col.id].length === 0 && (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-muted)', fontSize: '0.75rem', border: '2px dashed var(--border)', borderRadius: 8 }}>
                  Soltar aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title="Nueva tarea">
          <TaskForm onClose={() => setModalOpen(false)} />
        </Modal>
      )}

      {editingTask && (
        <Modal onClose={() => setEditingTask(null)} title="Editar tarea" large>
          <TaskForm task={editingTask} onClose={() => setEditingTask(null)} />
        </Modal>
      )}
    </div>
  );
}
