'use client';
import { FormInput, FormSelect } from '@/components/form/FormFields';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ImageUploadField from '@/components/form/ImageUploadField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionButton from '@/components/common/ActionButton';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { useEffect, useState, useCallback } from 'react';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { usersService } from '@/lib/services/users';
import { authService } from '@/lib/services/auth';
import Modal from '@/components/common/Modal';
import { User, UserRole } from '@/lib/types';
import { Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Edit form states
  const [formData, setFormData] = useState({ name: '', phone: '', imageUrl: '', role: UserRole.USER });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Create form states
  const [createData, setCreateData] = useState({ name: '', email: '', phone: '', password: '', role: UserRole.USER, imageUrl: '' });
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersService.getAllUsers(searchTerm || undefined, page, limit);
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
      closeModal();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

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

  const filteredUsers = users;

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage all users"
          actionButton={
            (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPERADMIN) && (
              <ActionButton variant="primary" onClick={openCreate}>
                Create User
              </ActionButton>
            )
          }
        />

        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

        <SearchFilterBar
          searchPlaceholder="Search by name, email, phone, or ID..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Edit className="w-8 h-8 text-indigo-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {user.role}
                      </span>
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
                    <div className="mt-4">
                      {((currentUser?.role === UserRole.SUPERADMIN) ||
                        (currentUser?.role === UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) && (
                          <ActionButton
                            variant="secondary"
                            size="sm"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </ActionButton>
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

        {/* Create Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={closeCreate}
          title="Create User"
          size="md"
          footer={
            <>
              <button
                onClick={closeCreate}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <ActionButton variant="primary" onClick={handleCreate} loading={isSaving}>
                Create
              </ActionButton>
            </>
          }
        >
          <div className="space-y-4">
            <FormInput
              label="Name"
              required
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              placeholder="User name"
            />
            <FormInput
              label="Email"
              required
              type="email"
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              placeholder="Email address"
            />
            <FormInput
              label="Phone"
              value={createData.phone}
              onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
              placeholder="Phone number"
            />
            <FormInput
              label="Password"
              required
              type="password"
              value={createData.password}
              onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
              placeholder="Password"
            />
            <ImageUploadField
              label="Profile Image"
              value={createData.imageUrl}
              preview={createPreview}
              onFileChange={(e) => {
                const f = e.target.files?.[0] || null;
                setCreateFile(f);
                if (f) setCreatePreview(URL.createObjectURL(f));
                else setCreatePreview(null);
              }}
            />
            <FormSelect
              label="Role"
              value={createData.role}
              onChange={(e) => setCreateData({ ...createData, role: e.target.value as UserRole })}
              options={[
                { value: UserRole.USER, label: 'User' },
                ...(currentUser?.role === UserRole.SUPERADMIN ? [{ value: UserRole.ADMIN, label: 'Admin' }] : []),
                ...(currentUser?.role === UserRole.SUPERADMIN ? [{ value: UserRole.SUPERADMIN, label: 'Super Admin' }] : []),
              ]}
            />
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

