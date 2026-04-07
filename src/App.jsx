import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from './context/AppContext';
import SchedulePage from './pages/SchedulePage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import AdminPage from './pages/AdminPage';
import './index.css';

function AppHeader() {
  const { state, currentUserId, setCurrentUserId, dispatch } = useApp();
  const [addingUser, setAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');

  const currentUser = state.users.find(u => u.id === currentUserId);

  return (
    <header className="header">
      <div className="container header-content">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Work Tracker
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <nav className="nav">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              Horario
            </NavLink>
            <NavLink to="/tareas" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Tareas
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Admin
            </NavLink>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', paddingLeft: 'var(--space-3)', borderLeft: '1px solid var(--border)' }}>
            {addingUser ? (
              <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.8rem', height: 30, width: 120 }}
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="Tu nombre"
                  autoFocus
                  onKeyDown={async e => {
                    if (e.key === 'Enter') {
                      if (newUserName.trim()) {
                        const u = await dispatch.addUser({ name: newUserName.trim(), color: '#7C3AED' });
                        setCurrentUserId(u.id);
                        setNewUserName('');
                        setAddingUser(false);
                      }
                    }
                    if (e.key === 'Escape') { setAddingUser(false); setNewUserName(''); }
                  }}
                />
                <button className="btn btn-sm btn-primary" style={{ height: 30, padding: '0 8px' }}
                  onClick={async () => {
                    if (newUserName.trim()) {
                      const u = await dispatch.addUser({ name: newUserName.trim(), color: '#7C3AED' });
                      setCurrentUserId(u.id);
                      setNewUserName('');
                      setAddingUser(false);
                    }
                  }}>
                  Crear
                </button>
                <button className="btn btn-sm btn-ghost" style={{ height: 30, padding: '0 6px' }}
                  onClick={() => { setAddingUser(false); setNewUserName(''); }}>✕</button>
              </div>
            ) : (
              <>
                {state.users.length === 0 ? (
                  <button className="btn btn-sm btn-secondary" style={{ height: 30, fontSize: '0.8rem' }}
                    onClick={() => setAddingUser(true)}>
                    + Crear usuario
                  </button>
                ) : (
                  <select
                    className="form-input"
                    style={{ height: 30, fontSize: '0.8rem', cursor: 'pointer', background: currentUser ? currentUser.color + '22' : 'var(--surface)', borderColor: currentUser ? currentUser.color : 'var(--border)' }}
                    value={currentUserId || ''}
                    onChange={e => setCurrentUserId(e.target.value || null)}
                  >
                    <option value="">Sin usuario</option>
                    {state.users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                )}
                {currentUserId && (
                  <button className="btn btn-sm btn-ghost" style={{ height: 30, padding: '0 4px' }}
                    onClick={() => setAddingUser(true)} title="Crear otro usuario">
                    +
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <main className="page">
        <div className="container">
          <Routes>
            <Route path="/" element={<SchedulePage />} />
            <Route path="/tareas" element={<TasksPage />} />
            <Route path="/tareas/:id" element={<TaskDetailPage />} />
            <Route path="/tarea/:id" element={<TaskDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </main>
    </BrowserRouter>
  );
}