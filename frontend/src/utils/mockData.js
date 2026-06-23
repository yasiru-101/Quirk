/**
 * @file mockData.js
 * @description In-memory and local-storage data simulator for offline demonstration mode.
 */

const INITIAL_USERS = [
  {
    id: 1,
    name: 'Demo Admin',
    email: 'admin@quirk.com',
    role: 'Admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Demo Project Manager',
    email: 'pm@quirk.com',
    role: 'Project Manager',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Demo Collaborator',
    email: 'collab@quirk.com',
    role: 'Collaborator',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_TASKS = [
  {
    _id: 'mock-task-1',
    title: 'Update Brand Colors & Design System',
    description: 'Ensure the theme uses the Quirk Duet (Mint #75EE8F & Ink #0D120F) with grayscale canvas backdrops.',
    status: 'Completed',
    priority: 'High',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    creator: { id: 1, name: 'Demo Admin' },
    assignees: [INITIAL_USERS[1], INITIAL_USERS[2]],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-task-2',
    title: 'Resolve Login Loading and Redirection Issue',
    description: 'Fix the role uppercase mapping mismatch and intercept network requests when database is offline.',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    creator: { id: 2, name: 'Demo Project Manager' },
    assignees: [INITIAL_USERS[2]],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-task-3',
    title: 'Fix Invisible Text & Missing Card Borders',
    description: 'Map --bg-base and --bg-surface CSS variables and declare class-based .card selector in index.css.',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    creator: { id: 1, name: 'Demo Admin' },
    assignees: [INITIAL_USERS[1]],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-task-4',
    title: 'Scrub Exposed Secrets from Kubernetes Templates',
    description: 'Replace the hardcoded connection string in k8s/secret.yaml comment notes with dynamic variables.',
    status: 'Completed',
    priority: 'High',
    dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 1, name: 'Demo Admin' },
    assignees: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-task-5',
    title: 'Integrate WebP Illustration and Favicon',
    description: 'Display login screen.webp as left column background cover, use BrandLogo with dynamic mode, and set favicon.',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    creator: { id: 2, name: 'Demo PM' },
    assignees: [INITIAL_USERS[2]],
    createdAt: new Date().toISOString()
  }
];

const INITIAL_COMMENTS = {
  'mock-task-2': [
    {
      id: 101,
      text: 'Role case mismatch (ADMIN vs Admin) was forcing redirects to login. Fixing role structure now.',
      user: INITIAL_USERS[0],
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 102,
      text: 'Offline mode adapter will prevent 401 refresh logout cycle.',
      user: INITIAL_USERS[1],
      createdAt: new Date().toISOString()
    }
  ]
};

const INITIAL_PROJECTS = [
  { id: 1, name: 'hackX 2026', description: 'Main project board', columns: [] }
];

export function initMockData() {
  if (!localStorage.getItem('quirk_mock_users')) {
    localStorage.setItem('quirk_mock_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('quirk_mock_tasks')) {
    localStorage.setItem('quirk_mock_tasks', JSON.stringify(INITIAL_TASKS));
  }
  if (!localStorage.getItem('quirk_mock_comments')) {
    localStorage.setItem('quirk_mock_comments', JSON.stringify(INITIAL_COMMENTS));
  }
  if (!localStorage.getItem('quirk_mock_projects')) {
    localStorage.setItem('quirk_mock_projects', JSON.stringify(INITIAL_PROJECTS));
  }
}

export function handleMockRequest(config) {
  // Normalize url relative path (remove base /api)
  let url = config.url || '';
  if (url.startsWith('/api')) {
    url = url.replace('/api', '');
  }
  if (url.startsWith('/')) {
    url = url.slice(1);
  }

  const method = (config.method || 'get').toLowerCase();

  // Load latest state
  initMockData();
  const users = JSON.parse(localStorage.getItem('quirk_mock_users') || '[]');
  const tasks = JSON.parse(localStorage.getItem('quirk_mock_tasks') || '[]');
  const comments = JSON.parse(localStorage.getItem('quirk_mock_comments') || '{}');
  const projects = JSON.parse(localStorage.getItem('quirk_mock_projects') || '[]');
  const currentUser = JSON.parse(localStorage.getItem('quirk_user') || 'null');

  // Helper to save state
  const saveTasks = (newTasks) => {
    localStorage.setItem('quirk_mock_tasks', JSON.stringify(newTasks));
  };
  const saveUsers = (newUsers) => {
    localStorage.setItem('quirk_mock_users', JSON.stringify(newUsers));
  };
  const saveComments = (newComments) => {
    localStorage.setItem('quirk_mock_comments', JSON.stringify(newComments));
  };

  // 1. GET /auth/me
  if (url === 'auth/me' && method === 'get') {
    return { user: currentUser };
  }

  // 2. POST /auth/login (direct mock option)
  if (url === 'auth/login' && method === 'post') {
    const data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const email = data?.email || 'admin@quirk.com';
    let role = 'Admin';
    let name = 'Demo Admin';
    if (email.startsWith('pm')) {
      role = 'Project Manager';
      name = 'Demo PM';
    } else if (email.startsWith('collab')) {
      role = 'Collaborator';
      name = 'Demo Collaborator';
    }
    const mockUser = { id: 1, name, email, role, mustResetPassword: false };
    localStorage.setItem('quirk_user', JSON.stringify(mockUser));
    return { user: mockUser };
  }

  // 3. GET /tasks
  if (url === 'tasks' && method === 'get') {
    const params = config.params || {};
    let filtered = [...tasks];
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (params.status) {
      filtered = filtered.filter(t => t.status === params.status);
    }
    if (params.priority) {
      filtered = filtered.filter(t => t.priority === params.priority);
    }
    // Collaborator role scopes tasks
    if (currentUser && currentUser.role === 'Collaborator') {
      filtered = filtered.filter(t => t.assignees.some(a => a.email === currentUser.email));
    }
    return { tasks: filtered };
  }

  // 4. POST /tasks (create)
  if (url === 'tasks' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const newTask = {
      _id: `mock-task-${Date.now()}`,
      title: body.title || 'Untitled Task',
      description: body.description || '',
      status: body.status || 'To Do',
      priority: body.priority || 'Medium',
      dueDate: body.dueDate || null,
      creator: { id: currentUser?.id || 1, name: currentUser?.name || 'Admin' },
      assignees: (body.assignees || []).map(id => users.find(u => u.id === parseInt(id)) || null).filter(Boolean),
      createdAt: new Date().toISOString()
    };
    tasks.unshift(newTask);
    saveTasks(tasks);
    return newTask;
  }

  // 5. GET /tasks/:id
  const singleTaskMatch = url.match(/^tasks\/([^\/]+)$/);
  if (singleTaskMatch && method === 'get') {
    const taskId = singleTaskMatch[1];
    const task = tasks.find(t => t._id === taskId);
    if (!task) return null;
    return { task };
  }

  // 6. PUT /tasks/:id
  if (singleTaskMatch && method === 'put') {
    const taskId = singleTaskMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const index = tasks.findIndex(t => t._id === taskId);
    if (index === -1) return null;
    
    const updated = {
      ...tasks[index],
      title: body.title || tasks[index].title,
      description: body.description || tasks[index].description,
      status: body.status || tasks[index].status,
      priority: body.priority || tasks[index].priority,
      dueDate: body.dueDate || tasks[index].dueDate,
      assignees: (body.assignees || []).map(id => users.find(u => u.id === parseInt(id)) || null).filter(Boolean),
      updatedAt: new Date().toISOString()
    };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  }

  // 7. DELETE /tasks/:id
  if (singleTaskMatch && method === 'delete') {
    const taskId = singleTaskMatch[1];
    const updated = tasks.filter(t => t._id !== taskId);
    saveTasks(updated);
    return { success: true };
  }

  // 8. PATCH /tasks/:id/status
  const statusMatch = url.match(/^tasks\/([^\/]+)\/status$/);
  if (statusMatch && method === 'patch') {
    const taskId = statusMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const index = tasks.findIndex(t => t._id === taskId);
    if (index === -1) return null;

    tasks[index].status = body.status;
    saveTasks(tasks);
    return tasks[index];
  }

  // 9. GET /users
  if (url === 'users' && method === 'get') {
    return { users };
  }

  // 10. POST /users (create)
  if (url === 'users' && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const newUser = {
      id: Date.now(),
      name: body.name || 'New User',
      email: body.email || '',
      role: body.role || 'Collaborator',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
  }

  // 11. PUT /users/:id
  const singleUserMatch = url.match(/^users\/([^\/]+)$/);
  if (singleUserMatch && method === 'put') {
    const userId = parseInt(singleUserMatch[1]);
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      name: body.name || users[index].name,
      role: body.role || users[index].role,
      email: body.email || users[index].email
    };
    saveUsers(users);
    return users[index];
  }

  // 12. PATCH /users/:id/deactivate
  const deactivateUserMatch = url.match(/^users\/([^\/]+)\/deactivate$/);
  if (deactivateUserMatch && method === 'patch') {
    const userId = parseInt(deactivateUserMatch[1]);
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    users[index].isActive = false;
    saveUsers(users);
    return users[index];
  }

  // 13. GET /tasks/:id/comments
  const commentsMatch = url.match(/^tasks\/([^\/]+)\/comments$/);
  if (commentsMatch && method === 'get') {
    const taskId = commentsMatch[1];
    return { comments: comments[taskId] || [] };
  }

  // 14. POST /tasks/:id/comments (add)
  if (commentsMatch && method === 'post') {
    const taskId = commentsMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    
    if (!comments[taskId]) {
      comments[taskId] = [];
    }

    const newComment = {
      id: Date.now(),
      text: body.text || '',
      user: currentUser || INITIAL_USERS[0],
      createdAt: new Date().toISOString()
    };

    comments[taskId].push(newComment);
    saveComments(comments);
    return newComment;
  }

  // 15. GET /projects
  if (url === 'projects' && method === 'get') {
    return { projects };
  }

  // 16. Stubs for other new entities
  if (url === 'epics' && method === 'get') return { epics: [] };
  if (url === 'activity' && method === 'get') return { logs: [] };
  if (url === 'timeLogs' && method === 'get') return { timeLogs: [] };

  return null;
}
