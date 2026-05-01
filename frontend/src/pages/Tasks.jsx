import React, { useState, useEffect } from 'react';
import api from '../api';
import { FileText, Trash2, Plus, Filter, FolderKanban, X, Clock, CheckCircle2, AlertCircle, Search } from 'lucide-react';

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignedTo: '', deadline: '', priority: 'medium' });

  const fetchData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);

      if (user.role === 'admin') {
        const usersRes = await api.get('/auth/users');
        setUsers(usersRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateTaskStatus = async (id, status) => {
    try {
      await api.patch(`/tasks/${id}`, { status });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating task');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', newTask);
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', projectId: '', assignedTo: '', deadline: '', priority: 'medium' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating task');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'in-progress': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-rose-50 text-rose-600 border border-rose-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'low': return 'bg-sky-100 text-sky-700 border border-sky-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const searchedTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = filter === 'all' ? searchedTasks : searchedTasks.filter(t => t.status === filter);

  const priorityMap = { high: 0, medium: 1, low: 2 };
  const sortedTasks = [...filteredTasks].sort((a, b) => priorityMap[a.priority] - priorityMap[b.priority]);

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const getProjectMembers = (projectId) => {
    const project = projects.find(p => p._id === projectId);
    if (!project || !project.membersData) return [];
    return project.membersData;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#5b5cc8] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filter Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tasks or projects..." 
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          {['all', 'todo', 'in-progress', 'done'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-[#5b5cc8] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
          {user.role === 'admin' && (
            <button onClick={() => setShowCreateModal(true)} className="ml-2 bg-[#5b5cc8] text-white p-2.5 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100">
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: stats.total, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Pending', value: stats.todo, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: stats.done, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} p-4 rounded-2xl border border-gray-100/50`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Task</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Project</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-sm italic">No tasks found</td>
                </tr>
              ) : (
                sortedTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">{task.title}</span>
                        <span className="text-[11px] text-gray-400 line-clamp-1">{task.description || 'No description'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                        <FolderKanban className="w-3 h-3" />
                        <span className="truncate max-w-[80px]">{task.projectName || '—'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {task.assigneeData?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">{task.assigneeData?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={task.status} 
                        onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        disabled={user.role === 'member' && task.assignedTo !== user.id}
                        className={`text-[11px] font-black uppercase tracking-wider rounded-lg px-2 py-1.5 outline-none cursor-pointer border transition-all ${getStatusColor(task.status)} ${user.role === 'member' && task.assignedTo !== user.id ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-indigo-100'}`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role === 'admin' && (
                        <button onClick={() => deleteTask(task._id)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Title</label>
                <input required type="text" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" placeholder="Task title..." value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Project</label>
                  <select required className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={newTask.projectId} onChange={e => setNewTask({...newTask, projectId: e.target.value})}>
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Priority</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Assignee</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {getProjectMembers(newTask.projectId).map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Deadline</label>
                  <input type="date" className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100" rows="3" placeholder="Task description..." value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-500">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-[#5b5cc8] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
