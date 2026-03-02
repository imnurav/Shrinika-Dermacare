'use client';
import { FormInput, FormSelect } from '@/components/form/FormFields';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ImageUploadField from '@/components/form/ImageUploadField';
import TopLoader from '@/components/common/TopLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState, useCallback } from 'react';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { usersService } from '@/lib/services/users';
import { authService } from '@/lib/services/auth';
import Modal from '@/components/common/Modal';
import { User, UserRole } from '@/lib/types';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Edit form states
  const [formData, setFormData] = useState({ name: '', phone: '', imageUrl: '', role: UserRole.USER });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const [page, setPage] = useState(Number(getParam('page', '1')));
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setPage(Number(getParam('page', '1')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersService.getAllUsers(searchTerm || undefined, page, limit);
      setUsers(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalItems(data.meta.total);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const currentUser = authService.getCurrentUser();

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name || '', phone: user.phone || '', imageUrl: user.imageUrl || '', role: user.role });
    setImagePreview(user.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', phone: '', imageUrl: '', role: UserRole.USER });
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      setIsSaving(true);
      setError(null);
      const form = new FormData();
      if (formData.name) form.append('name', formData.name);
      if (formData.phone) form.append('phone', formData.phone);
      if (formData.role) form.append('role', formData.role);
      if (selectedFile) form.append('file', selectedFile);

      const updated = await usersService.updateUser(editingUser.id, form);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast('User updated successfully', 'success');
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setError(null);
      await usersService.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      showToast('User deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout>
      <TopLoader loading={isLoading || isSaving} />
      <div className="flex h-full min-h-0 flex-col gap-4">
        <PageHeader
          title="Users"
          description="Manage all users"
        />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        <SearchFilterBar
          searchPlaceholder="Search by name, email, phone, or ID..."
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setPage(1);
            setParams({ search: value, page: '1' });
          }}
        />

        <div className="min-h-0 flex-1">
          {isLoading ? (
            <TableSkeleton rows={8} columns={6} />
          ) : (
            <div className="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="h-full overflow-auto">
                <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No data
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.imageUrl ? (
                              <img src={user.imageUrl} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200" />
                            )}
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '-'}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">{user.role}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          {((currentUser?.role === UserRole.SUPERADMIN) ||
                            (currentUser?.role === UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title="Edit user"
                                  aria-label="Edit user"
                                  onClick={() => openEdit(user)}
                                  className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                {currentUser?.id !== user.id && (
                                  <button
                                    type="button"
                                    title="Delete user"
                                    aria-label="Delete user"
                                    onClick={() => setDeleteTarget(user)}
                                    className="rounded-lg border border-gray-300 p-2 text-gray-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <Pagination
          page={page}
          setPage={(value) => {
            setPage(value);
            setParams({ search: searchTerm, page: String(value) });
          }}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={limit}
        />

        {/* Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title="Edit User"
          size="xl"
          footer={
            <>
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <ActionButton variant="primary" onClick={handleSave} loading={isSaving}>
                Save
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <FormInput
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="User name"
            />
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
            <ImageUploadField
              label="Profile Image"
              value={formData.imageUrl}
              preview={imagePreview}
              onFileChange={(e) => {
                const f = e.target.files?.[0] || null;
                setSelectedFile(f);
                if (f) setImagePreview(URL.createObjectURL(f));
                else setImagePreview(null);
              }}
              onRemove={() => {
                setImagePreview(null);
                setSelectedFile(null);
              }}
            />
            <FormSelect
              label="Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              options={[
                { value: UserRole.USER, label: 'User' },
                ...(currentUser?.role === UserRole.SUPERADMIN || currentUser?.role === UserRole.ADMIN
                  ? [{ value: UserRole.ADMIN, label: 'Admin' }]
                  : []),
                ...(currentUser?.role === UserRole.SUPERADMIN ? [{ value: UserRole.SUPERADMIN, label: 'Super Admin' }] : []),
              ]}
              disabled={currentUser?.id === editingUser?.id}
            />
          </div>
        </Modal>

        <Modal
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Delete User"
          size="sm"
          footer={
            <>
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Delete
              </button>
            </>
          }
        >
          <p className="text-sm text-slate-700">
            Are you sure you want to delete <span className="font-semibold">{deleteTarget?.name}</span>?
          </p>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
