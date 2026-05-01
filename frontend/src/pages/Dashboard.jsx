import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Mail, FileText, ChevronLeft, ChevronRight, Briefcase, FolderKanban, Search } from 'lucide-react';

// Memoized SVG Donut Chart
const DonutChart = React.memo(({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="60" fill="none" stroke="#f3f4f6" strokeWidth="20" />
          <text x="80" y="76" textAnchor="middle" className="fill-gray-400" fontSize="14" fontWeight="bold">No</text>
          <text x="80" y="94" textAnchor="middle" className="fill-gray-400" fontSize="14" fontWeight="bold">Tasks</text>
        </svg>
      </div>
    );
  }
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 160 160" className="-rotate-90">
        {data.map((segment, i) => {
          const segLen = (segment.value / total) * circumference;
          const gap = data.filter(d => d.value > 0).length > 1 ? 3 : 0;
          const el = (
            <circle
              key={i}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="20"
              strokeDasharray={`${segLen - gap} ${circumference - segLen + gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          );
          offset += segLen;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-gray-800">{total}</span>
        <span className="text-xs text-gray-400 font-medium">Total</span>
      </div>
    </div>
  );
});

function Dashboard({ user }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/projects'),
        ]);
        if (!cancelled) {
          setTasks(tasksRes.data);
          setProjects(projectsRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const updateTaskStatus = useCallback(async (id, status) => {
    try {
      await api.patch(`/tasks/${id}`, { status });
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating task');
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'done': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'in-progress': return 'bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'bg-rose-50 text-rose-600 border border-rose-200';
    }
  }, []);

  const { pendingCount, inProgressCount, doneCount } = useMemo(() => ({
    pendingCount: tasks.filter(t => t.status === 'todo').length,
    inProgressCount: tasks.filter(t => t.status === 'in-progress').length,
    doneCount: tasks.filter(t => t.status === 'done').length,
  }), [tasks]);

  const donutData = useMemo(() => [
    { label: 'To Do', value: pendingCount, color: '#f43f5e' },
    { label: 'In Progress', value: inProgressCount, color: '#f59e0b' },
    { label: 'Done', value: doneCount, color: '#10b981' },
  ], [pendingCount, inProgressCount, doneCount]);

  const today = useMemo(() => new Date(), []);

  const calendarContent = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return { year, month, monthNames, days, firstDay, daysInMonth };
  }, [calendarDate]);

  const formatJoinedDate = useMemo(() => {
    const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${mn[today.getMonth()]}, ${today.getFullYear()}`;
  }, [today]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tasks, searchTerm]);

  const recentTasks = useMemo(() => filteredTasks.slice(0, 5), [filteredTasks]);

  // Assignee avatar helper — shows the ASSIGNEE's photo, not the current user
  const renderAssigneeAvatar = (task) => {
    if (task.assigneeData) {
      if (task.assigneeData.profilePhoto) {
        return <img src={task.assigneeData.profilePhoto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
      }
      return (
        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold flex-shrink-0 text-xs">
          {task.assigneeData.name.charAt(0).toUpperCase()}
        </div>
      );
    }
    // Unassigned
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0 text-xs">?</div>
    );
  };

  const memberPerformance = useMemo(() => {
    const stats = {};
    tasks.forEach(t => {
      if (!t.assigneeData) return;
      const name = t.assigneeData.name;
      if (!stats[name]) stats[name] = { total: 0, done: 0, photo: t.assigneeData.profilePhoto };
      stats[name].total++;
      if (t.status === 'done') stats[name].done++;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.done - a.done)
      .slice(0, 4);
  }, [tasks]);

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Left Column */}
      <div className="flex-1 space-y-8">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-[#5b5cc8] via-[#696bcf] to-[#7c7ed6] rounded-3xl p-8 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl"></div>
          <div className="absolute bottom-0 left-1/4 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 blur-xl"></div>

          <div className="relative z-10">
            <p className="text-indigo-200 text-sm mb-2 font-medium">Welcome back,</p>
            <h2 className="text-3xl font-black text-white mb-4 capitalize">{user.name} 👋</h2>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-white/70 text-xs">Task Pending</p>
                <p className="text-white text-xl font-black">{pendingCount + inProgressCount}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-white/70 text-xs">Task Completed</p>
                <p className="text-white text-xl font-black">{doneCount}</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                <p className="text-white/70 text-xs">Projects</p>
                <p className="text-white text-xl font-black">{projects.length}</p>
              </div>
            </div>

            {/* Project Breakdown */}
            {projects.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-6">
                {projects.map(p => {
                  const pTasks = tasks.filter(t => t.projectId === p._id);
                  const pDone = pTasks.filter(t => t.status === 'done').length;
                  const pPending = pTasks.length - pDone;
                  return (
                    <div key={p._id} className="text-[10px] bg-black/20 text-white/90 px-3 py-1 rounded-full border border-white/10">
                      <span className="font-bold opacity-70">{p.name}:</span> {pDone} Done · {pPending} Pending
                    </div>
                  );
                })}
              </div>
            )}

            <button onClick={() => navigate('/projects')} className="bg-[#facc15] hover:bg-yellow-500 text-yellow-900 font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-lg hover:shadow-xl">
              View Projects →
            </button>
          </div>
        </div>

        {/* Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donut Chart */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Task Overview</h3>
            <div className="flex items-center justify-around">
              <DonutChart data={donutData} />
              <div className="space-y-4">
                {donutData.map(d => (
                  <div key={d.label} className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">{d.label}</p>
                      <p className="text-xs text-gray-400">{d.value} task{d.value !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Member Leaderboard (Admin Only) */}
          {user.role === 'admin' && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Team Performance</h3>
              <div className="space-y-5">
                {memberPerformance.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8 italic">No task data yet</p>
                ) : (
                  memberPerformance.map((m, i) => (
                    <div key={m.name} className="flex items-center space-x-4">
                      <div className="relative">
                        {m.photo ? (
                          <img src={m.photo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-sm">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#facc15] text-yellow-900 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">
                          {i + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between mb-1.5">
                          <p className="text-sm font-bold text-gray-800 truncate capitalize">{m.name}</p>
                          <p className="text-xs font-bold text-[#5b5cc8]">{m.done}/{m.total} Done</p>
                        </div>
                        <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                          <div className="h-full bg-[#5b5cc8] transition-all duration-1000" style={{ width: `${(m.done / m.total) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800">Recent Tasks</h3>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search recent tasks..." 
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button onClick={() => navigate('/tasks')} className="bg-[#5b5cc8] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100 whitespace-nowrap">
                View All
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
            <div className="grid grid-cols-12 gap-3 px-6 py-3 text-xs font-bold text-gray-400 border-b border-gray-50 uppercase tracking-wider">
              <div className="col-span-4">Task Name</div>
              <div className="col-span-3">Project</div>
              <div className="col-span-2">Deadline</div>
              <div className="col-span-3">Status</div>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="w-6 h-6 border-3 border-[#5b5cc8] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No tasks yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentTasks.map(task => (
                  <div key={task._id} className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center hover:bg-indigo-50/30 transition-colors rounded-xl group">
                    <div className="col-span-4 flex items-center space-x-3">
                      {renderAssigneeAvatar(task)}
                      <span className="font-bold text-gray-800 text-sm truncate">{task.title}</span>
                    </div>
                    <div className="col-span-3">
                      <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold border border-purple-100">
                        <FolderKanban className="w-3 h-3" />
                        <span className="truncate max-w-[70px]">{task.projectName || '—'}</span>
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <select 
                        value={task.status} 
                        onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                        disabled={user.role === 'member' && task.assignedTo !== user.id}
                        className={`text-xs font-bold rounded-full px-3 py-1.5 outline-none cursor-pointer transition-opacity ${
                          user.role === 'member' && task.assignedTo !== user.id ? 'opacity-50 cursor-not-allowed' : 'hover:ring-2 hover:ring-indigo-100'
                        } ${getStatusColor(task.status)}`}
                      >
                        <option value="todo">○ To Do</option>
                        <option value="in-progress">⏳ In Progress</option>
                        <option value="done">✓ Done</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="w-full xl:w-80 flex flex-col space-y-8">
        {/* Calendar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">{calendarContent.monthNames[calendarContent.month]}, {calendarContent.year}</h3>
            <div className="flex space-x-2">
              <button onClick={() => setCalendarDate(new Date(calendarContent.year, calendarContent.month - 1, 1))} className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCalendarDate(new Date(calendarContent.year, calendarContent.month + 1, 1))} className="w-8 h-8 rounded-lg bg-[#5b5cc8] flex items-center justify-center text-white hover:bg-indigo-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {calendarContent.days.map(day => <div key={day} className="text-center text-xs font-bold text-gray-400">{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-y-3 gap-x-2">
            {Array.from({ length: calendarContent.firstDay }).map((_, i) => <div key={`e-${i}`}></div>)}
            {Array.from({ length: calendarContent.daysInMonth }, (_, i) => i + 1).map(date => (
              <div key={date} className={`text-center text-sm w-8 h-8 flex items-center justify-center mx-auto rounded-full transition-colors ${
                date === today.getDate() && calendarContent.month === today.getMonth() && calendarContent.year === today.getFullYear()
                  ? 'bg-[#5b5cc8] text-white font-bold shadow-md shadow-indigo-200'
                  : 'text-gray-600 font-medium hover:bg-gray-100 cursor-pointer'
              }`}>{date}</div>
            ))}
          </div>
        </div>

        {/* Profile Widget */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center flex flex-col items-center">
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="" className="w-20 h-20 rounded-2xl object-cover mb-4 shadow-lg shadow-indigo-200" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-black mb-4 shadow-lg shadow-indigo-200 relative">
              {user.name.charAt(0).toUpperCase()}
              <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
          )}
          <h3 className="font-bold text-lg text-gray-900 mb-0.5 capitalize">{user.name}</h3>
          <p className="text-xs font-medium text-gray-400 capitalize mb-1">{user.role}</p>
          <p className="text-[11px] text-gray-300 mb-5">{user.email}</p>

          <div className="flex space-x-3 mb-6">
            <a href={`mailto:${user.email}`} className="w-9 h-9 rounded-full bg-[#5b5cc8] flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200" title="Email">
              <Mail className="w-3.5 h-3.5" />
            </a>
            <button onClick={() => navigate('/tasks')} className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors" title="Tasks">
              <Briefcase className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-full space-y-3 text-left">
            {[
              { label: 'Role', value: user.role },
              { label: 'Joined', value: formatJoinedDate },
              { label: 'Tasks', value: `${tasks.length} Active` },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 px-3 rounded-xl bg-gray-50">
                <span className="text-xs font-bold text-gray-400">{item.label}</span>
                <span className="text-xs font-bold text-gray-700 capitalize">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
