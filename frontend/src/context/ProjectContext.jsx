/**
 * @file ProjectContext.jsx
 * @description Global state for projects and active project scope.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('activeWorkspaceId') || '';
  });
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) || null;
  const activeWorkspaceRole = activeWorkspace?.myRole || null;
  const canManageWorkspace = ['Owner', 'Admin'].includes(activeWorkspaceRole);

  const setActiveWorkspaceId = (workspaceId) => {
    setActiveWorkspaceIdState(workspaceId || '');
    if (workspaceId) localStorage.setItem('activeWorkspaceId', workspaceId);
    else localStorage.removeItem('activeWorkspaceId');
  };

  const fetchWorkspaces = async () => {
    try {
      setWorkspaceLoading(true);
      const { data } = await api.get('/workspaces');
      const nextWorkspaces = data.workspaces || [];
      setWorkspaces(nextWorkspaces);

      const saved = typeof window !== 'undefined' ? localStorage.getItem('activeWorkspaceId') : '';
      const savedStillValid = nextWorkspaces.some((workspace) => workspace.id === saved);
      const nextActiveId = savedStillValid ? saved : nextWorkspaces[0]?.id || '';
      setActiveWorkspaceId(nextActiveId);
      return nextActiveId;
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setWorkspaces([]);
      setActiveWorkspaceId('');
      return '';
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {};
      const { data } = await api.get('/projects', { params });
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceMembers = async () => {
    if (!activeWorkspaceId) {
      setWorkspaceMembers([]);
      setPendingInvites([]);
      return;
    }
    try {
      const { data } = await api.get(`/workspaces/${activeWorkspaceId}/members`);
      setWorkspaceMembers(data.members || []);
      setPendingInvites(data.pendingInvites || []);
    } catch (err) {
      console.error('Failed to load workspace members:', err);
      setWorkspaceMembers([]);
      setPendingInvites([]);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchWorkspaceMembers();
  }, [activeWorkspaceId]);

  const refreshProjects = () => fetchProjects();
  const refreshWorkspaces = () => fetchWorkspaces();

  const createWorkspace = async (payload) => {
    const { data } = await api.post('/workspaces', payload);
    await refreshWorkspaces();
    setActiveWorkspaceId(data.workspace.id);
    return data.workspace;
  };

  const createProject = async (payload) => {
    const { data } = await api.post('/projects', {
      ...payload,
      workspaceId: payload.workspaceId || activeWorkspaceId,
    });
    await refreshProjects();
    return data.project;
  };

  const updateProject = async (projectId, payload) => {
    const { data } = await api.put(`/projects/${projectId}`, payload);
    await refreshProjects();
    return data.project;
  };

  const deleteProject = async (projectId) => {
    await api.delete(`/projects/${projectId}`);
    await refreshProjects();
  };

  const inviteWorkspaceMember = async (payload) => {
    const { data } = await api.post(`/workspaces/${activeWorkspaceId}/invitations`, payload);
    return data;
  };

  const updateWorkspaceMemberRole = async (userId, role) => {
    await api.patch(`/workspaces/${activeWorkspaceId}/members/${userId}`, { role });
    await fetchWorkspaceMembers();
    await refreshWorkspaces();
  };

  const removeWorkspaceMember = async (userId) => {
    await api.delete(`/workspaces/${activeWorkspaceId}/members/${userId}`);
    await fetchWorkspaceMembers();
    await refreshWorkspaces();
  };

  const addProjectMember = async (projectId, payload) => {
    await api.post(`/projects/${projectId}/members`, payload);
    await refreshProjects();
  };

  const removeProjectMember = async (projectId, userId) => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
    await refreshProjects();
  };

  return (
    <ProjectContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeWorkspaceId,
        activeWorkspaceRole,
        workspaceMembers,
        pendingInvites,
        workspaceLoading,
        canManageWorkspace,
        setActiveWorkspaceId,
        projects,
        activeProject,
        setActiveProject,
        loading,
        refreshProjects,
        refreshWorkspaces,
        fetchWorkspaceMembers,
        createWorkspace,
        inviteWorkspaceMember,
        updateWorkspaceMemberRole,
        removeWorkspaceMember,
        createProject,
        updateProject,
        deleteProject,
        addProjectMember,
        removeProjectMember,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);
