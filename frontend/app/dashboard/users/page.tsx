'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import ErrorMessage from '@/components/common/ErrorMessage';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { Search, User as UserIcon } from 'lucide-react';
import { usersService } from '@/lib/services/users';
import { authService } from '@/lib/services/auth';
import { User, UserRole } from '@/lib/types';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Edit, X } from 'lucide-react';
import Pagination from '@/components/common/Pagination';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', imageUrl: '', role: UserRole.USER });
  const [isSaving, setIsSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({ name: '', email: '', phone: '', password: '', role: UserRole.USER, imageUrl: '' });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersService.getAllUsers(page, limit);
      if (Array.isArray(data)) {
        setUsers(data);
        setTotalPages(1);
        setTotalItems(data.length);
      } else {
        setUsers(data.data);
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name || '', phone: user.phone || '', imageUrl: user.imageUrl || '', role: user.role });
    setIsModalOpen(true);
  };

  const currentUser = authService.getCurrentUser();

  const openCreate = () => {
    setCreateData({ name: '', email: '', phone: '', password: '', role: UserRole.USER, imageUrl: '' });
    setCreateFile(null);
    setCreatePreview(null);
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
  };

  const handleCreate = async () => {
    try {
      setError(null);
      setIsSaving(true);
      // Build FormData to send multipart directly to admin endpoint
      const form = new FormData();
      form.append('name', createData.name);
      if (createData.email) form.append('email', createData.email);
      if (createData.phone) form.append('phone', createData.phone);
      if (createData.password) form.append('password', createData.password);
      if (createData.role) form.append('role', createData.role);
      if (createFile) form.append('file', createFile);

      const created = await usersService.createUser(form);
      setUsers((prev) => [created, ...prev]);
      closeCreate();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      setError(null);
      // Build FormData for update (send only changed fields)
      const form = new FormData();
      if (formData.name) form.append('name', formData.name);
      if (formData.phone) form.append('phone', formData.phone);
      if (formData.role) form.append('role', formData.role);
      if (selectedFile) form.append('file', selectedFile);

      const updated = await usersService.updateUser(editingUser.id, form as any);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={totalItems} limit={limit} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-1">Manage all users</p>
          </div>
          <div className="flex items-center gap-2">
            {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPERADMIN) && (
              <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white rounded">Create User</button>
            )}
          </div>
        </div>

        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            type="error"
          />
        )}

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 opacity-100" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No users found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt={user.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-indigo-600 opacity-100" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${user.role === UserRole.ADMIN
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {user.role}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-600">
                      {user.email && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Phone:</span>
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.createdAt && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Joined:</span>
                          <span>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      {((currentUser?.role === UserRole.SUPERADMIN) || (currentUser?.role === UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) && (
                        <button
                          onClick={() => openEdit(user)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm"
                        >
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={totalItems} limit={limit} />

        {/* Edit Modal */}
        {isModalOpen && editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Edit User</h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setSelectedFile(f);
                        if (f) setImagePreview(URL.createObjectURL(f));
                        else setImagePreview(null);
                      }}
                      className="p-1"
                    />
                    {imagePreview || formData.imageUrl ? (
                      <img src={imagePreview || formData.imageUrl} className="w-12 h-12 rounded-full object-cover" />
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  {/* Role selection rules:
                      - SUPERADMIN can set any role
                      - ADMIN can set USER or ADMIN but not SUPERADMIN
                      - Users cannot edit roles
                      - Disable role select when editing self */}
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full mt-1 p-2 border rounded"
                    disabled={currentUser?.id === editingUser?.id}
                  >
                    <option value={UserRole.USER}>USER</option>
                    {(currentUser?.role === UserRole.SUPERADMIN || currentUser?.role === UserRole.ADMIN) && <option value={UserRole.ADMIN}>ADMIN</option>}
                    {currentUser?.role === UserRole.SUPERADMIN && <option value={UserRole.SUPERADMIN}>SUPERADMIN</option>}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 rounded bg-indigo-600 text-white">{isSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
        {/* Create Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/40" onClick={closeCreate} />
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create User</h2>
                <button onClick={closeCreate} className="text-gray-500 hover:text-gray-700"><X /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input value={createData.name} onChange={(e) => setCreateData({ ...createData, name: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input value={createData.email} onChange={(e) => setCreateData({ ...createData, email: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input value={createData.phone} onChange={(e) => setCreateData({ ...createData, phone: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" value={createData.password} onChange={(e) => setCreateData({ ...createData, password: e.target.value })} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profile Image</label>
                  <div className="mt-1 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setCreateFile(f);
                        if (f) setCreatePreview(URL.createObjectURL(f));
                        else setCreatePreview(null);
                      }}
                      className="p-1"
                    />
                    {createPreview ? (
                      <img src={createPreview} className="w-12 h-12 rounded-full object-cover" />
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select value={createData.role} onChange={(e) => setCreateData({ ...createData, role: e.target.value as UserRole })} className="w-full mt-1 p-2 border rounded">
                    <option value={UserRole.USER}>USER</option>
                    {currentUser?.role === UserRole.SUPERADMIN && <option value={UserRole.ADMIN}>ADMIN</option>}
                    {currentUser?.role === UserRole.SUPERADMIN && <option value={UserRole.SUPERADMIN}>SUPERADMIN</option>}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={closeCreate} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                <button onClick={handleCreate} disabled={isSaving} className="px-4 py-2 rounded bg-indigo-600 text-white">{isSaving ? 'Creating...' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

