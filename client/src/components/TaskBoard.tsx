import React from 'react';
import { api } from '../services/api';

export interface Task {
  id: string;
  taskNumber: number;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dueDate: string;
  isOverdue: boolean;
  assignedDeveloper?: { name: string };
}

const columns = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'DONE', label: 'Done' },
];

export const TaskBoard: React.FC<{ tasks: Task[]; onUpdate: () => void }> = ({
  tasks,
  onUpdate,
}) => {
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      onUpdate();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((col) => (
        <div key={col.key} className="bg-slate-100/70 p-4 rounded-xl flex flex-col gap-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
            {col.label} ({tasks.filter((t) => t.status === col.key).length})
          </h4>
          <div className="space-y-3">
            {tasks
              .filter((t) => t.status === col.key)
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-200/60 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      #{task.taskNumber}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        task.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                    <span className="text-slate-500 truncate max-w-[120px]">
                      {task.assignedDeveloper?.name || 'Unassigned'}
                    </span>
                    {task.isOverdue && (
                      <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="mt-1 text-xs border border-slate-200 rounded p-1 bg-slate-50 text-slate-700"
                  >
                    {columns.map((c) => (
                      <option key={c.key} value={c.key}>
                        Move to {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
