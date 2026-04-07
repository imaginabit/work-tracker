import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const TASK_COLORS = [
  '#059669', '#7C3AED', '#2563EB', '#DB2777', '#EA580C',
  '#16A34A', '#4F46E5', '#9333EA', '#DC2626', '#0891B2'
];

const API = 'http://localhost:3001/api';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function getTaskColor(tasks, taskId, clients = []) {
  const task = tasks.find(t => t.id === taskId);
  if (task?.clientId) {
    const client = clients.find(c => c.id === task.clientId);
    if (client?.color) return client.color;
  }
  const idx = tasks.findIndex(t => t.id === taskId);
  return TASK_COLORS[idx % TASK_COLORS.length];
}

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, entriesRes, clientsRes, usersRes] = await Promise.all([
        fetch(`${API}/tasks`),
        fetch(`${API}/time-entries`),
        fetch(`${API}/clients`),
        fetch(`${API}/users`)
      ]);
      const tasksData = await tasksRes.json();
      const entriesData = await entriesRes.json();
      const clientsData = await clientsRes.json();
      const usersData = await usersRes.json();
      setTasks(tasksData);
      setTimeEntries(entriesData);
      setClients(clientsData);
      setUsers(usersData);
      // Auto-select first user if none selected
      if (usersData.length > 0 && !currentUserId) {
        setCurrentUserId(usersData[0].id);
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const addTask = async (payload) => {
    const task = { id: generateId(), ...payload, createdAt: new Date().toISOString() };
    await fetch(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    setTasks(prev => [task, ...prev]);
    return task;
  };

  const updateTask = async (id, payload) => {
    await fetch(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
  };

  const deleteTask = async (id) => {
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
    setTimeEntries(prev => prev.filter(e => e.taskId !== id));
  };

  const addTimeEntry = async (payload) => {
    const entry = { id: generateId(), ...payload };
    await fetch(`${API}/time-entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    setTimeEntries(prev => [...prev, entry]);
    return entry;
  };

  const updateTimeEntry = async (id, payload) => {
    await fetch(`${API}/time-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setTimeEntries(prev => prev.map(e => e.id === id ? { ...e, ...payload } : e));
  };

  const deleteTimeEntry = async (id) => {
    await fetch(`${API}/time-entries/${id}`, { method: 'DELETE' });
    setTimeEntries(prev => prev.filter(e => e.id !== id));
  };

  const toggleRequirement = async (taskId, index) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const requirements = task.requirements.map((r, i) =>
      i === index ? { ...r, completed: !r.completed } : r
    );
    await updateTask(taskId, { requirements });
  };

  const setTaskStatus = async (taskId, status) => {
    await updateTask(taskId, { status });
  };

  const addClient = async (payload) => {
    const client = { id: generateId(), ...payload, createdAt: new Date().toISOString() };
    await fetch(`${API}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
    setClients(prev => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    return client;
  };

  const updateClient = async (id, payload) => {
    await fetch(`${API}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
  };

  const deleteClient = async (id) => {
    await fetch(`${API}/clients/${id}`, { method: 'DELETE' });
    setClients(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.map(t => t.clientId === id ? { ...t, clientId: null } : t));
  };

  const addUser = async (payload) => {
    const user = { id: generateId(), ...payload, createdAt: new Date().toISOString() };
    await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    setUsers(prev => [...prev, user].sort((a, b) => a.name.localeCompare(b.name)));
    return user;
  };

  const updateUser = async (id, payload) => {
    await fetch(`${API}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setUsers(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
  };

  const deleteUser = async (id) => {
    await fetch(`${API}/users/${id}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(c => c.id !== id));
    setTimeEntries(prev => prev.filter(e => e.userId !== id));
    if (currentUserId === id) {
      const remaining = users.filter(u => u.id !== id);
      setCurrentUserId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  return (
    <AppContext.Provider value={{
      state: { tasks, timeEntries, clients, users },
      currentUserId,
      setCurrentUserId,
      loading,
      dispatch: {
        addTask, updateTask, deleteTask,
        addTimeEntry, updateTimeEntry, deleteTimeEntry,
        toggleRequirement, setTaskStatus,
        addClient, updateClient, deleteClient,
        addUser, updateUser, deleteUser
      },
      getTaskColor
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export { TASK_COLORS };