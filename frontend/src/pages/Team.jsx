import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, Trash2, Mail, Shield, User as UserIcon } from 'lucide-react';

function Team({ user }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/auth/users');
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleFireMember = async (memberId, name) => {
    if (!window.confirm(`Are you sure you want to fire ${name}? This will remove them from all projects and unassign all their tasks.`)) {
      return;
    }

    try {
      await api.delete(`/auth/users/${memberId}`);
      fetchMembers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing member');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-400">Manage your organization members and roles.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-2">
          <Users className="w-4 h-4 text-[#5b5cc8]" />
          <span className="text-sm font-bold text-gray-700">{members.length} Total Members</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-8 py-4 text-xs font-bold text-gray-400 border-b border-gray-100 uppercase tracking-wider bg-gray-50/50">
          <div className="col-span-4">Member</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-3">Contact</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-20 text-center">
            <div className="w-8 h-8 border-4 border-[#5b5cc8] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="p-20 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">No members found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map((m) => (
              <div key={m._id} className="grid grid-cols-12 gap-3 px-8 py-5 items-center hover:bg-gray-50/50 transition-colors group">
                <div className="col-span-4 flex items-center space-x-4">
                  {m.profilePhoto ? (
                    <img src={m.profilePhoto} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                      {m.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">Member since {new Date(m.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="col-span-3">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    m.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {m.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                    <span className="capitalize">{m.role}</span>
                  </span>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Mail className="w-4 h-4 text-gray-300" />
                    <span className="text-sm truncate">{m.email}</span>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  {m.role !== 'admin' && (
                    <button
                      onClick={() => handleFireMember(m._id, m.name)}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 font-bold text-xs transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Fire</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start space-x-4">
        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Trash2 className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h4 className="text-rose-800 font-bold text-sm mb-1">Danger Zone Info</h4>
          <p className="text-rose-600 text-xs leading-relaxed">
            Removing a member is permanent. They will lose access to all projects and their data will be cleaned up. 
            Admins cannot be removed for security reasons.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Team;
