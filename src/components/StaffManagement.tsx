import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, CreditCard as Edit, Trash2, Shield, User } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff, loading } = useData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'staff' as 'admin' | 'staff' | 'artist',
    permissions: [] as string[]
  });

  const rolePermissions = {
    admin: ['reservations', 'staff', 'settings'],
    staff: ['reservations'],
    artist: ['reservations']
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      permissions: name === 'role' ? rolePermissions[value as keyof typeof rolePermissions] : prev.permissions
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    
    const submitAction = async () => {
      try {
        if (editingStaff) {
          await updateStaff(editingStaff, formData);
          setEditingStaff(null);
        } else {
          await addStaff(formData);
        }
        resetForm();
      } catch (error) {
        console.error('Error submitting staff form:', error);
        alert('Error saving staff member. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };
    
    submitAction();
  };

  const handleDelete = async (staffId: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteStaff(staffId);
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff member. Please try again.');
      }
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      password: '',
      role: 'staff',
      permissions: ['reservations']
    });
    setShowAddForm(false);
    setEditingStaff(null);
  };

  const handleEdit = (staffMember: any) => {
    setEditingStaff(staffMember.id);
    setShowAddForm(true);
    setFormData({
      name: staffMember.name,
      username: staffMember.username,
      password: staffMember.password,
      role: staffMember.role,
      permissions: staffMember.permissions
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 border border-red-900 rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="text-red-300 mt-2 font-metal">Loading staff...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-black border border-red-900 rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">Staff Management</h1>
            <p className="text-white">Manage your studio team members</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-yellow-600 to-amber-700 text-black px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-amber-600 transition-all flex items-center space-x-2 font-semibold"
          >
            <Plus size={20} />
            <span>Add Staff Member</span>
          </button>
        </div>

        {showAddForm && (
          <div className="mb-8 bg-gray-900 border border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">
              {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  >
                    <option value="staff">Staff</option>
                    <option value="artist">Tattoo Artist</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-700 text-black rounded-lg hover:from-yellow-500 hover:to-amber-600 transition-all font-semibold"
                >
                  {submitting ? 'Saving...' : editingStaff ? 'Update' : 'Add'} Staff Member
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-red-900">
                <th className="text-left py-4 px-4 font-semibold text-white">Name</th>
                <th className="text-left py-4 px-4 font-semibold text-white">Username</th>
                <th className="text-left py-4 px-4 font-semibold text-white">Role</th>
                <th className="text-left py-4 px-4 font-semibold text-white">Permissions</th>
                <th className="text-left py-4 px-4 font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((staffMember) => (
                <tr key={staffMember.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-orange-800 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{staffMember.name}</div>
                        <div className="text-sm text-gray-400">
                          Added {new Date(staffMember.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-white">{staffMember.username}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      staffMember.role === 'admin' ? 'bg-yellow-600/30 text-yellow-400' :
                      staffMember.role === 'artist' ? 'bg-purple-900/30 text-purple-400' :
                      'bg-blue-900/30 text-blue-400'
                    }`}>
                      <Shield size={14} className="mr-1" />
                      {staffMember.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {staffMember.permissions.map((permission) => (
                        <span key={permission} className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(staffMember.id)}
                        className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};