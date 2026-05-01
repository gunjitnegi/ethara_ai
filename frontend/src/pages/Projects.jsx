import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Users, Folder, Trash2, X, FileText, Clock, Search } from 'lucide-react';

function Projects({ user }) {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', deadline: '' });

  const [activeProject, setActiveProject] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', projectId: '', assignedTo: '', deadline: '' });

  const fetchData = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
      ]);
      setProjects(projectsRes.data);
      setTasks(tasksRes.data);

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

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowCreateModal(false);
      setNewProject({ name: '', description: '', deadline: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating project');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting project');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUser || !activeProject) return;
    try {
      await api.post(`/projects/${activeProject._id}/members`, { userId: selectedUser });
      setActiveProject(null);
      setSelectedUser('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding member');
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    if (!window.confirm('Remove member from project?')) return;
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`);
      fetchData();
    } catch (err) {
      alert('Error removing member');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', newTask);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', projectId: '', assignedTo: '', deadline: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating task');
    }
  };

  const getProjectTaskCount = (projectId) => tasks.filter(t => t.projectId === projectId).length;
  const getProjectDoneCount = (projectId) => tasks.filter(t => t.projectId === projectId && t.status === 'done').length;

  const projectColors = [
    { bg: 'bg-gradient-to-br from-indigo-500 to-purple-600', light: 'bg-indigo-50', text: 'text-indigo-600' },
    { bg: 'bg-gradient-to-br from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-600' },
    { bg: 'bg-gradient-to-br from-amber-500 to-orange-600', light: 'bg-amber-50', text: 'text-amber-600' },
    { bg: 'bg-gradient-to-br from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-600' },
    { bg: 'bg-gradient-to-br from-cyan-500 to-blue-600', light: 'bg-cyan-50', text: 'text-cyan-600' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-[#5b5cc8] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search projects..."
            className="block w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-100"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {user.role === 'admin' && (
          <button onClick={() => setShowCreateModal(true)} className="bg-[#5b5cc8] hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center shadow-md shadow-indigo-100">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Folder className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-500">{searchTerm ? 'No projects match your search' : 'No projects yet'}</p>
          </div>
        )}
        {filteredProjects.map((project, index) => {
          const color = projectColors[index % projectColors.length];
          const taskCount = getProjectTaskCount(project._id);
          const doneCount = getProjectDoneCount(project._id);
          const progress = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

          return (
            <div key={project._id} className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col hover:shadow-lg transition-all group overflow-hidden">
              <div className={`${color.bg} p-5 relative`}>
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Folder className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-lg truncate">{project.name}</h3>
                  </div>
                  {user.role === 'admin' && (
                    <button onClick={() => handleDeleteProject(project._id)} className="text-white/50 hover:text-white p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{project.description || 'No description provided.'}</p>
                {project.deadline && (
                  <div className="flex items-center space-x-1.5 mb-4 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100 w-fit">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600">Due {new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex space-x-4 mb-4 text-xs font-bold text-gray-500">
                  <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-1" /> {taskCount} tasks</span>
                  <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> {project.members?.length || 0} members</span>
                </div>
                {taskCount > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-400 font-medium">Progress</span>
                      <span className="text-gray-600 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color.bg}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Members</span>
                    {user.role === 'admin' && <button onClick={() => setActiveProject(project)} className="text-xs text-[#5b5cc8] font-bold">+ Add</button>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {project.membersData?.map(m => (
                      <span key={m._id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] mr-1.5">{m.name?.charAt(0)?.toUpperCase()}</span>
                        {m.name}
                        {user.role === 'admin' && <button onClick={() => handleRemoveMember(project._id, m._id)} className="ml-1.5 text-gray-300 hover:text-red-500">&times;</button>}
                      </span>
                    ))}
                  </div>
                  {user.role === 'admin' && (
                    <button onClick={() => { setNewTask({ ...newTask, projectId: project._id }); setShowTaskModal(true); }} className="mt-4 w-full text-center text-sm text-[#5b5cc8] border border-indigo-100 hover:bg-indigo-50 py-2.5 rounded-xl font-bold transition-colors">
                      + Create Task
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals remain the same but use the restored logic */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-5">
              <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" placeholder="Project Name" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              <textarea className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" placeholder="Description" rows="3" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})}></textarea>
              <input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#5b5cc8] text-white rounded-xl font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => { setActiveProject(null); setSelectedUser(''); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Add Member to {activeProject.name}</h2>
            <form onSubmit={handleAddMember} className="space-y-5">
              <select required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                <option value="">Select a member...</option>
                {users.filter(u => !activeProject.members?.includes(u._id)).map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => { setActiveProject(null); setSelectedUser(''); }} className="px-5 py-2.5 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#5b5cc8] text-white rounded-xl font-bold">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowTaskModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Create Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <input required className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" placeholder="Task Title" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              <textarea className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" placeholder="Description" rows="2" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}></textarea>
              <select className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}>
                <option value="">Unassigned</option>
                {projects.find(p => p._id === newTask.projectId)?.membersData?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
              <input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none text-sm" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-5 py-2.5 font-bold text-gray-500">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-[#5b5cc8] text-white rounded-xl font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
