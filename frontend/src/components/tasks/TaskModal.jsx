/**
 * @file TaskModal.jsx
 * @description Form dialogue allowing Project Managers to create or modify tasks.
 */
import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { TASK_STATUS_LIST, TASK_PRIORITY_LIST, ROLES } from '../../utils/constants';
import { normalizeError } from '../../services/api';
import { taskService } from '../../services/taskService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const EMPTY_FORM = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'Medium',
  status: 'To Do',
  assigneeIds: [],
};

/**
 * Create / Edit task modal. Visible to Project Managers only.
 * @param {boolean} open
 * @param {Function} onClose
 * @param {object|null} task - null = create mode, object = edit mode
 * @param {Function} onSaved(savedTask)
 */
/**
 * Form modal handling title, description details, priority ranges, dates, and user assignments.
 * Displays read-only templates to Collaborator roles.
 *
 * @param {boolean} props.open - Modal toggler state
 * @param {Function} props.onClose - Action closing modal elements
 * @param {object|null} props.task - Pre-loaded task values (null creates a task)
 * @param {Function} props.onSaved - Saved status dispatcher callback
 */
export default function TaskModal({ open, onClose, task = null, onSaved }) {
  const { role } = useAuth();
  const { success, error: toastError } = useToast();
  const isEdit = !!task;
  const isPM = role === ROLES.PROJECT_MANAGER;

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);

  // Fetch assignable users when modal opens
  useEffect(() => {
    if (!open) return;
    userService
      .getUsers()
      .then(({ data }) => setAvailableUsers(data.users ?? []))
      .catch(() => setAvailableUsers([]));
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (open) {
      if (task) {
        setForm({
          title:       task.title ?? '',
          description: task.description ?? '',
          dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : '',
          priority:    task.priority ?? 'Medium',
          status:      task.status ?? 'To Do',
          assigneeIds: (task.assignees ?? []).map((u) => u._id),
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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

  // Collaborators see read-only task detail if they somehow open this
  const readOnly = !isPM;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={readOnly ? 'Task Details' : isEdit ? 'Edit Task' : 'New Task'}
      size="lg"
      footer={
        !readOnly && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" loading={loading} onClick={handleSubmit}>
              {isEdit ? 'Save changes' : 'Create task'}
            </Button>
          </div>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
          placeholder="Add more context or details…"
          rows={3}
          disabled={readOnly}
        />

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              disabled={readOnly}
              className="h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-700/50 text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {TASK_PRIORITY_LIST.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="h-10 px-3 rounded-lg bg-zinc-900 border border-zinc-700/50 text-sm text-zinc-100 outline-none focus:border-indigo-500 transition-colors"
            >
              {TASK_STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Due date */}
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

        {/* Assignees */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-400">
            Assign To {readOnly && <span className="text-zinc-600">(read-only)</span>}
          </label>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {availableUsers.map((u) => {
              const selected = form.assigneeIds.includes(u._id);
              return (
                <label
                  key={u._id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${selected ? 'bg-indigo-500/10 ring-1 ring-indigo-500/30' : 'hover:bg-zinc-800'}
                    ${readOnly ? 'pointer-events-none opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleAssignee(u._id)}
                    disabled={readOnly}
                    className="accent-indigo-500 w-3.5 h-3.5"
                  />
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                    {u.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-xs text-zinc-200">{u.name}</p>
                    <p className="text-[10px] text-zinc-500">{u.role}</p>
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
