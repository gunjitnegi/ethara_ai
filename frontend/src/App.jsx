import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FolderKanban, Settings as SettingsIcon, Bell, Mail, Briefcase, X, Users } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import SettingsPage from './pages/Settings';
import Team from './pages/Team';
import api from './api';

function Sidebar({ user, onLogout }) {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Projects', path: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { name: 'Tasks', path: '/tasks', icon: <Briefcase className="w-5 h-5" /> },
    user.role === 'admin' && { name: 'Team', path: '/team', icon: <Users className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon className="w-5 h-5" /> },
  ].filter(Boolean);

  return (
    <div className="w-64 bg-[#5b5cc8] text-white flex flex-col min-h-screen rounded-r-3xl my-4 ml-4 relative shadow-2xl">
      <div className="p-8 flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-[#5b5cc8] font-bold text-lg leading-none">E</span>
        </div>
        <span className="text-2xl font-bold tracking-wide">Ethara</span>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all ${
                isActive ? 'bg-white text-[#5b5cc8] shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6">
        <button
          onClick={onLogout}
          className="flex items-center justify-center w-full space-x-2 text-white/70 hover:text-white transition-colors py-3 rounded-2xl hover:bg-white/10"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}

function Header({ user }) {
  const location = useLocation();
  const [showMailDropdown, setShowMailDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [members, setMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) { /* silent */ }
  };

  const fetchMailContacts = async () => {
    try {
      if (user.role === 'admin') {
        // Admin sees all users
        const { data } = await api.get('/auth/users');
        setMembers(data);
      } else {
        // Member sees teammates from their projects + project admin
        const { data: projects } = await api.get('/projects');
        const contactMap = {};
        projects.forEach(p => {
          // Add project members
          if (p.membersData) {
            p.membersData.forEach(m => {
              if (m._id !== user.id) contactMap[m._id] = m;
            });
          }
          // Add project admin/creator
          if (p.creatorData && p.creatorData._id !== user.id) {
            contactMap[p.creatorData._id] = p.creatorData;
          }
        });
        setMembers(Object.values(contactMap));
      }
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    fetchMailContacts();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user.role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err) { /* silent */ }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) { /* silent */ }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard';
      case '/projects': return 'Projects';
      case '/tasks': return 'Tasks';
      case '/team': return 'Team Management';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 text-gray-400">
          {/* Mail dropdown */}
          <div className="relative">
            <button
              onClick={() => { setShowMailDropdown(!showMailDropdown); setShowNotifDropdown(false); }}
              className="hover:text-gray-600 transition-colors relative"
            >
              <Mail className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {showMailDropdown && (
              <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <span className="font-bold text-gray-800 text-sm">Mail a Member</span>
                  <button onClick={() => setShowMailDropdown(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {members.length === 0 ? (
                    <div className="p-4 text-sm text-gray-400 text-center">No members found</div>
                  ) : (
                    members.map(m => (
                      <a
                        key={m._id}
                        href={`mailto:${m.email}`}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowMailDropdown(false)}
                      >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-800 truncate">
                            <span className="font-bold">{m.name}</span>
                            <span className="text-gray-400 ml-1">· {m.role || 'member'}</span>
                          </p>
                          <p className="text-xs text-gray-400 truncate">{m.email}</p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowMailDropdown(false); }}
              className="hover:text-gray-600 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <span className="font-bold text-gray-800 text-sm">Notifications</span>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-[#5b5cc8] font-bold hover:text-indigo-700">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifDropdown(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n._id}
                        className={`flex items-start space-x-3 px-4 py-3 transition-colors cursor-pointer ${
                          n.read ? 'bg-white hover:bg-gray-50' : 'bg-indigo-50/50 hover:bg-indigo-50'
                        }`}
                        onClick={() => !n.read && markOneRead(n._id)}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          n.type === 'task_complete' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          {n.type === 'task_complete' ? '✓' : '↻'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${n.read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-[#5b5cc8] rounded-full mt-2 flex-shrink-0"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Link to="/settings" className="flex items-center space-x-3 pl-6 border-l border-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{user.email}</p>
          </div>
          {user.profilePhoto ? (
            <img src={user.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover border border-white shadow-sm" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-white shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#edf3fd]">Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />

        <Route path="/*" element={
          user ? (
            <div className="flex min-h-screen bg-[#edf3fd] font-sans">
              <Sidebar user={user} onLogout={handleLogout} />

              <main className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                  <Header user={user} />
                  <Routes>
                    <Route path="/" element={<Dashboard user={user} />} />
                    <Route path="/projects" element={<Projects user={user} />} />
                    <Route path="/tasks" element={<Tasks user={user} />} />
                    <Route path="/team" element={user.role === 'admin' ? <Team user={user} /> : <Navigate to="/" />} />
                    <Route path="/settings" element={<SettingsPage user={user} />} />
                  </Routes>
                </div>
              </main>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}

export default App;
