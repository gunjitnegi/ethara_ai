import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, Palette, Camera, Bell, Globe, LogOut, Key, Mail, Briefcase, Volume2, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import api from '../api';

function SettingsPage({ user }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user.profilePhoto || '');
  const fileRef = useRef(null);

  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Session states
  const [sessions, setSessions] = useState([]);

  // Preferences states
  const [prefs, setPrefs] = useState({
    notifications: true,
    sounds: true,
    compactView: false
  });

  const togglePref = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'preferences', label: 'Preferences', icon: <Palette className="w-4 h-4" /> },
  ];

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/auth/sessions');
      setSessions(data);
    } catch (err) { /* silent */ }
  };

  useEffect(() => {
    if (activeTab === 'security') fetchSessions();
  }, [activeTab]);

  const handlePasswordUpdate = async () => {
    setPasswordError('');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError('Password must be at least 8 characters, include uppercase, number, and symbol');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.patch('/auth/change-password', { password: newPassword });
      alert('Password updated successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out from all other devices?')) return;
    try {
      await api.delete('/auth/sessions/logout-all');
      fetchSessions();
      alert('Logged out from other devices');
    } catch (err) {
      alert('Failed to log out');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPhotoPreview(base64);
      setUploading(true);
      try {
        const { data } = await api.post('/auth/upload-photo', { photo: base64 });
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.profilePhoto = data.profilePhoto;
        localStorage.setItem('user', JSON.stringify(storedUser));
        window.location.reload();
      } catch (err) {
        alert('Failed to upload photo');
        setPhotoPreview(user.profilePhoto || '');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex space-x-2 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#5b5cc8] text-white shadow-md shadow-indigo-200'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Profile Information</h3>
          <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-100">
            <div className="relative group">
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              {uploading && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-3 border-[#5b5cc8] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 capitalize">{user.name}</p>
              <p className="text-sm text-gray-400 capitalize">{user.role}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Full Name</label>
              <input type="text" value={user.name} readOnly className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 outline-none capitalize" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Email Address</label>
              <input type="email" value={user.email} readOnly className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-800 outline-none" />
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Key className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Change Password</p>
                  <p className="text-xs text-gray-400">Update your password regularly</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(true)} className="px-4 py-2 bg-[#5b5cc8] text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
                Update
              </button>
            </div>

            <div className="p-5 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Active Sessions</p>
                    <p className="text-xs text-gray-400">Devices currently logged in</p>
                  </div>
                </div>
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-200">
                  {sessions.length} Active
                </span>
              </div>
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.sessionId} className="flex items-center justify-between text-xs p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Globe className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">{s.browser} on {s.device}</p>
                        <p className="text-gray-400">{s.ip} · {s.sessionId === user.sessionId ? 'Current' : 'Active'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Sign Out Everywhere</p>
                  <p className="text-xs text-gray-400">Log out from all other devices</p>
                </div>
              </div>
              <button onClick={handleLogoutAll} className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors">
                Sign Out All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">System Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Desktop Notifications</p>
                  <p className="text-xs text-gray-400">Receive system alerts for task updates</p>
                </div>
              </div>
              <div 
                onClick={() => togglePref('notifications')}
                className={`w-12 h-7 rounded-full relative cursor-pointer shadow-sm transition-all duration-300 ${prefs.notifications ? 'bg-[#5b5cc8]' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${prefs.notifications ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Sound Effects</p>
                  <p className="text-xs text-gray-400">Play sounds on task completion</p>
                </div>
              </div>
              <div 
                onClick={() => togglePref('sounds')}
                className={`w-12 h-7 rounded-full relative cursor-pointer shadow-sm transition-all duration-300 ${prefs.sounds ? 'bg-[#5b5cc8]' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${prefs.sounds ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Compact View</p>
                  <p className="text-xs text-gray-400">Show more tasks on one screen</p>
                </div>
              </div>
              <div 
                onClick={() => togglePref('compactView')}
                className={`w-12 h-7 rounded-full relative cursor-pointer shadow-sm transition-all duration-300 ${prefs.compactView ? 'bg-[#5b5cc8]' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${prefs.compactView ? 'right-0.5' : 'left-0.5'}`}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-2">Update Password</h3>
            {passwordError && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold text-center">{passwordError}</div>}
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="New Password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none pr-12" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm outline-none pr-12" 
                />
              </div>
              <div className="flex space-x-3">
                <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500">Cancel</button>
                <button onClick={handlePasswordUpdate} disabled={passwordLoading} className="flex-1 py-3 text-sm font-bold bg-[#5b5cc8] text-white rounded-xl">{passwordLoading ? 'Updating...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
