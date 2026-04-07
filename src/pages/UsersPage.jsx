import { useState } from 'react';
import { useApp } from '../context/AppContext';

const USER_COLORS = [
  '#7C3AED', '#059669', '#2563EB', '#DB2777', '#EA580C',
  '#16A34A', '#4F46E5', '#9333EA', '#DC2626', '#0891B2'
];

export default function UsersPage() {
  const { state, dispatch, currentUserId, setCurrentUserId } = useApp();
  const [addingUser, setAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleCreateUser = async () => {
    if (!newUserName.trim()) return;
    const color = USER_COLORS[state.users.length % USER_COLORS.length];
    const u = await dispatch.addUser({ name: newUserName.trim(), color });
    setCurrentUserId(u.id);
    setNewUserName('');
    setAddingUser(false);
  };

  const handleUpdateUser = async (id) => {
    await dispatch.updateUser(id, { name: editingName, color: editingColor });
    setEditingUserId(null);
  };

  const handleDeleteUser = async (id) => {
    await dispatch.deleteUser(id);
    setDeleteConfirmId(null);
  };

  const startEditing = (user) => {
    setEditingUserId(user.id);
    setEditingName(user.name);
    setEditingColor(user.color);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="page-subtitle">{state.users.length} usuario{state.users.length !== 1 ? 's' : ''}</p>
        </div>
        {!addingUser && (
          <button className="btn btn-primary" onClick={() => setAddingUser(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo usuario
          </button>
        )}
      </div>

      {addingUser && (
        <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Nombre</label>
              <input
                type="text"
                className="form-input"
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Nombre del usuario"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateUser();
                  if (e.key === 'Escape') { setAddingUser(false); setNewUserName(''); }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
              <button className="btn btn-primary" onClick={handleCreateUser} style={{ height: 36 }}>
                Crear
              </button>
              <button className="btn btn-ghost" onClick={() => { setAddingUser(false); setNewUserName(''); }} style={{ height: 36 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {state.users.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3 className="empty-state-title">Sin usuarios</h3>
          <p className="empty-state-description">Crea tu primer usuario para empezar a rastrear tiempo</p>
          <button className="btn btn-primary" onClick={() => setAddingUser(true)}>Crear usuario</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {state.users.map(user => {
            const isCurrentUser = currentUserId === user.id;
            const isEditing = editingUserId === user.id;
            const isDeleting = deleteConfirmId === user.id;

            if (isEditing) {
              return (
                <div key={user.id} className="card" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Nombre</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdateUser(user.id);
                          if (e.key === 'Escape') setEditingUserId(null);
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>Color</label>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {USER_COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditingColor(c)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: c,
                              border: editingColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button className="btn btn-primary" onClick={() => handleUpdateUser(user.id)} style={{ height: 36 }}>
                        Guardar
                      </button>
                      <button className="btn btn-ghost" onClick={() => setEditingUserId(null)} style={{ height: 36 }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (isDeleting) {
              return (
                <div key={user.id} className="card" style={{ padding: 'var(--space-4)', borderColor: 'var(--warning)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 500 }}>
                        ¿Eliminar a <span style={{ color: user.color }}>{user.name}</span>?
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                        Las sesiones de trabajo de este usuario también se eliminarán.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)} style={{ height: 36 }}>
                        Cancelar
                      </button>
                      <button
                        className="btn"
                        style={{ background: 'var(--warning)', color: 'white', borderColor: 'var(--warning)', height: 36 }}
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={user.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: user.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{user.name}</span>
                  {isCurrentUser && (
                    <span style={{ marginLeft: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500 }}>
                      (actual)
                    </span>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => startEditing(user)}
                  title="Editar"
                  style={{ height: 32, padding: '0 8px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                {!isCurrentUser && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteConfirmId(user.id)}
                    title="Eliminar"
                    style={{ height: 32, padding: '0 8px', color: 'var(--warning)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
