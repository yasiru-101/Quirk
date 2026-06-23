/**
 * @file TaskModal.jsx
 * @description Form dialogue allowing Project Managers to create or modify tasks.
 */
import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { TASK_PRIORITY_LIST, ROLES } from '../../utils/constants';
import { normalizeError } from '../../services/api';
import { taskService } from '../../services/taskService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { getInitials } from '../../utils/helpers';

const EMPTY_FORM = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
  projectId: '',
  columnId: '',
  assigneeIds: [],
};

export default function TaskModal({ open, onClose, task = null, projects = [], columns = [], onSaved }) {
  const { role, user } = useAuth();
  const { canManageWorkspace } = useProject();
  const { success, error: toastError } = useToast();
  const isEdit = !!task;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const canManageProject = (project) =>
    role === ROLES.ADMIN ||
    canManageWorkspace ||
    project?.members?.some((member) => (member.userId === user?.id || member.user?.id === user?.id) && member.role === ROLES.PROJECT_MANAGER);

  useEffect(() => {
    if (open) {
      if (task) {
        setForm({
          title:       task.title ?? '',
          description: task.description ?? '',
          dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : '',
          priority:    task.priority ?? 'Medium',
          projectId:   task.projectId ?? '',
          columnId:    task.columnId ?? '',
          assigneeIds: (task.assignees ?? []).map((u) => u._id),
        });
      } else {
        const defaultProject = projects.find(canManageProject) || projects[0];
        const defaultColumn = columns.find((column) => column.projectId === defaultProject?.id);
        setForm({
          ...EMPTY_FORM,
          projectId: defaultProject?.id || '',
          columnId: defaultColumn?.id || '',
        });
      }
      setErrors({});
    }
  }, [open, task, projects, columns]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId),
    [projects, form.projectId]
  );

  const projectMembership = useMemo(
    () => selectedProject?.members?.find((member) => member.userId === user?.id || member.user?.id === user?.id),
    [selectedProject, user?.id]
  );

  const canManageTask = role === ROLES.ADMIN || canManageWorkspace || projectMembership?.role === ROLES.PROJECT_MANAGER;

  const availableUsers = useMemo(() => {
    const members = selectedProject?.members || [];
    return members
      .map((member) => member.user)
      .filter(Boolean);
  }, [selectedProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      if (name === 'projectId') {
        const firstProjectColumn = columns.find((column) => column.projectId === value);
        return { ...f, projectId: value, columnId: firstProjectColumn?.id || '' };
      }
      return { ...f, [name]: value };
    });
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const toggleAssignee = (userId) => {
    setForm((f) => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(userId)
        ? f.assigneeIds.filter((id) => id !== userId)
        : [...f.assigneeIds, userId],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.length < 3) errs.title = 'Title must be at least 3 characters';
    if (form.dueDate && new Date(form.dueDate) < new Date(new Date().toDateString())) {
      errs.dueDate = 'Due date cannot be in the past';
    }
    if (!form.projectId) errs.projectId = 'Project is required';
    else if (!canManageTask) errs.projectId = 'You need Project Manager access to create tasks in this project';
    if (!form.columnId) errs.columnId = 'Column is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      let saved;
      if (isEdit) {
        const { data } = await taskService.updateTask(task._id, form);
        saved = data.task;
        success('Task updated successfully');
      } else {
        const { data } = await taskService.createTask(form);
        saved = data.task;
        success('Task created successfully');
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      const { message, fieldErrors } = normalizeError(err);
      if (fieldErrors) setErrors(fieldErrors);
      else toastError(message, isEdit ? 'Update failed' : 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const readOnly = isEdit && !canManageTask;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={readOnly ? 'Task Details' : isEdit ? 'Edit Task' : 'New Task'}
      size="lg"
      footer={
        !readOnly && (
          <div className="flex justify-end gap-3 w-full">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit}>
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <Input
          id="task-title"
          label="Title *"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          placeholder="What needs to be done?"
          disabled={readOnly}
        />

        <Input
          id="task-description"
          label="Description"
          type="textarea"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Add more context or details"
          rows={3}
          disabled={readOnly}
        />

        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--colors-ink)]">Priority</label>
            <div className="relative">
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                disabled={readOnly}
                className="w-full h-11 px-3 rounded-[var(--radius-md)] bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] text-sm text-[var(--colors-ink)] outline-none focus-ring appearance-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {TASK_PRIORITY_LIST.map((p) => <option key={p}>{p}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--colors-mute)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--colors-ink)]">Project</label>
            <div className="relative">
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                disabled={readOnly || isEdit}
                className="w-full h-11 px-3 rounded-[var(--radius-md)] bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] text-sm text-[var(--colors-ink)] outline-none focus-ring appearance-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select project</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--colors-mute)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
            </div>
            {errors.projectId && <p className="text-sm text-red-500">{errors.projectId}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--colors-ink)]">Column</label>
          <div className="relative">
            <select
              name="columnId"
              value={form.columnId}
              onChange={handleChange}
              disabled={readOnly || !form.projectId}
              className="w-full h-11 px-3 rounded-[var(--radius-md)] bg-[var(--colors-canvas-soft)] border border-[var(--colors-hairline)] text-sm text-[var(--colors-ink)] outline-none focus-ring appearance-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select column</option>
              {columns
                .filter((column) => column.projectId === form.projectId)
                .map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--colors-mute)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>
          {errors.columnId && <p className="text-sm text-red-500">{errors.columnId}</p>}
        </div>

        <Input
          id="task-duedate"
          label="Due Date"
          type="date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
          error={errors.dueDate}
          disabled={readOnly}
        />

        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold text-[var(--colors-ink)]">
            Assignees {readOnly && <span className="text-[var(--colors-mute)] font-normal ml-1">(read-only)</span>}
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {!availableUsers.length && (
              <div className="rounded-xl border border-[var(--colors-hairline)] bg-[var(--colors-canvas-soft)] px-4 py-3 text-sm text-[var(--colors-body)]">
                Select a project with members before assigning work.
              </div>
            )}
            {availableUsers.map((u) => {
              const selected = form.assigneeIds.includes(u._id);
              return (
                <label
                  key={u._id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all
                    ${selected ? 'border-[var(--colors-primary)] bg-[var(--colors-primary-glow)]' : 'border-[var(--colors-hairline)] bg-[var(--colors-canvas)] hover:border-[var(--colors-mute)]'}
                    ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleAssignee(u._id)}
                    disabled={readOnly}
                    className="accent-[var(--colors-primary)] w-4 h-4 cursor-pointer"
                  />
                  <div className="w-8 h-8 rounded-full bg-[var(--colors-canvas-soft)] text-[var(--colors-ink)] border border-[var(--colors-hairline)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {getInitials(u.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--colors-ink)] leading-tight">{u.name}</p>
                    <p className="text-[11px] font-medium text-[var(--colors-mute)] mt-0.5 uppercase tracking-wide">{u.role}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
