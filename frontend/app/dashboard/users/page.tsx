'use client';
import { FormInput, FormSelect } from '@/components/form/FormFields';
import SearchFilterBar from '@/components/common/SearchFilterBar';
import ImageUploadField from '@/components/form/ImageUploadField';
import ErrorMessage from '@/components/common/ErrorMessage';
import ConfirmModal from '@/components/common/ConfirmModal';
import FormModal from '@/components/common/FormModal';
import { getErrorMessage } from '@/lib/utils/errorHandler';
import { PAGE_SIZE_OPTIONS, parsePageSize, parseSortField, parseSortOrder } from '@/lib/constants/pagination';
import { useEffect, useState, useCallback } from 'react';
import { TableSkeleton } from '@/components/common/ListSkeleton';
import AdminTable, { AdminEmptyRow, AdminTd, AdminTh } from '@/components/common/AdminTable';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { usersService } from '@/lib/services/users';
import { useCurrentUser } from '@/lib/context/CurrentUserContext';
import { User, UserGender, UserRole } from '@/lib/types';
import Image from 'next/image';
import { useListQueryState } from '@/lib/hooks/useListQueryState';
import { useToast } from '@/components/common/ToastProvider';
import { getUserAvatar } from '@/lib/utils/avatar';
import SortableHeader from '@/components/common/SortableHeader';
import IconActionButton from '@/components/common/IconActionButton';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const SORT_FIELDS = ['name', 'role', 'createdAt'] as const;

export default function UsersPage() {
  const { user: currentUser } = useCurrentUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Edit form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    imageUrl: '',
    role: UserRole.USER,
    gender: UserGender.OTHER,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const { getParam, setParams } = useListQueryState();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const getDateQuery = useCallback((from: string, to: string) => {
    if (!from || !to) {
      return { startDate: '', endDate: '' };
    }
    return { startDate: from, endDate: to };
  }, []);

  useEffect(() => {
    setSearchTerm(getParam('search', ''));
    setStartDate(getParam('startDate', ''));
    setEndDate(getParam('endDate', ''));
    setPage(Number(getParam('page', '1')));
    setLimit(parsePageSize(getParam('limit', '10')));
    const sortByParam = getParam('sortBy', 'createdAt');
    setSortBy(parseSortField(sortByParam, SORT_FIELDS, 'createdAt'));
    setSortOrder(parseSortOrder(getParam('sortOrder', 'DESC')));
    setIsQueryReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersService.getAllUsers(
        searchTerm || undefined,
        startDate && endDate ? startDate : undefined,
        startDate && endDate ? endDate : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      );
      setUsers(data.data);
      setTotalPages(data.meta.totalPages);
      setTotalItems(data.meta.total);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, startDate, endDate, page, limit, sortBy, sortOrder]);

  const handleSort = useCallback((field: string) => {
    const nextOrder = sortBy === field ? (sortOrder === 'ASC' ? 'DESC' : 'ASC') : 'ASC';
    setSortBy(field);
    setSortOrder(nextOrder);
    setPage(1);
    setParams({
      search: searchTerm,
      ...getDateQuery(startDate, endDate),
      page: '1',
      limit: String(limit),
      sortBy: field,
      sortOrder: nextOrder,
    });
  }, [sortBy, sortOrder, searchTerm, startDate, endDate, limit, setParams, getDateQuery]);

  useEffect(() => {
    if (!isQueryReady) return;
    fetchUsers();
  }, [fetchUsers, isQueryReady]);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      imageUrl: user.imageUrl || '',
      role: user.role,
      gender: user.gender || UserGender.OTHER,
    });
    setImagePreview(user.imageUrl || null);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ name: '', phone: '', imageUrl: '', role: UserRole.USER, gender: UserGender.OTHER });
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
      if (formData.gender) form.append('gender', formData.gender);
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
      <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        title="Users"
        description="Manage all users" />

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} type="error" />}

      <SearchFilterBar
        searchPlaceholder="Search by name, email, phone, or ID..."
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
          setParams({
            search: value,
            ...getDateQuery(startDate, endDate),
            page: '1',
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        } }
        filters={[
          { id: 'startDate', label: 'From Date', type: 'date' },
          { id: 'endDate', label: 'To Date', type: 'date' },
        ]}
        filterValues={{ startDate, endDate }}
        onFilterChange={(id, value) => {
          const nextStart = id === 'startDate' ? value : startDate;
          const nextEnd = id === 'endDate' ? value : endDate;
          setStartDate(nextStart);
          setEndDate(nextEnd);
          setPage(1);
          setParams({
            search: searchTerm,
            ...getDateQuery(nextStart, nextEnd),
            page: '1',
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        } } />

      <div className="min-h-0 flex-1">
        {isLoading ? (
          <TableSkeleton rows={8} columns={7} />
        ) : (
          <AdminTable minWidth={980} outerClassName="h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" scrollClassName="h-full overflow-auto">
                <thead className="bg-gray-50">
                  <tr>
                    <AdminTh className="min-w-[240px]">User ID</AdminTh>
                    <AdminTh>
                      <SortableHeader field="name" label="User" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>Email</AdminTh>
                    <AdminTh>Phone</AdminTh>
                    <AdminTh>Gender</AdminTh>
                    <AdminTh>
                      <SortableHeader field="role" label="Role" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>
                      <SortableHeader field="createdAt" label="Joined" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />
                    </AdminTh>
                    <AdminTh>Actions</AdminTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.length === 0 ? (
                    <AdminEmptyRow colSpan={8} />
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <AdminTd className="min-w-[240px] break-all font-mono text-xs leading-5">{user.id}</AdminTd>
                        <AdminTd>
                          <div className="flex items-center gap-3">
                            <Image src={getUserAvatar(user.imageUrl, user.gender)} alt={user.name} width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          </div>
                        </AdminTd>
                        <AdminTd className="text-gray-600">{user.email || '-'}</AdminTd>
                        <AdminTd className="text-gray-600">{user.phone || '-'}</AdminTd>
                        <AdminTd>{user.gender}</AdminTd>
                        <AdminTd className="font-medium">{user.role}</AdminTd>
                        <AdminTd className="text-gray-600">
                          {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                        </AdminTd>
                        <AdminTd>
                          {((currentUser?.role === UserRole.SUPERADMIN) ||
                            (currentUser?.role === UserRole.ADMIN && user.role !== UserRole.SUPERADMIN)) && (
                              <div className="flex items-center gap-2">
                                <IconActionButton title="Edit user" ariaLabel="Edit user" onClick={() => openEdit(user)} icon={<Edit className="h-4 w-4" />} variant="edit" />
                                {currentUser?.id !== user.id && (
                                  <IconActionButton title="Delete user" ariaLabel="Delete user" onClick={() => setDeleteTarget(user)} icon={<Trash2 className="h-4 w-4" />} variant="delete" />
                                )}
                              </div>
                            )}
                        </AdminTd>
                      </tr>
                    ))
                  )}
                </tbody>
              </AdminTable>
        )}
      </div>
      <Pagination
        page={page}
        setPage={(value) => {
          setPage(value);
          setParams({
            search: searchTerm,
            ...getDateQuery(startDate, endDate),
            page: String(value),
            limit: String(limit),
            sortBy,
            sortOrder,
          });
        } }
        totalPages={totalPages}
        totalItems={totalItems}
        limit={limit}
        setLimit={(value) => {
          setLimit(value);
          setPage(1);
          setParams({
            search: searchTerm,
            ...getDateQuery(startDate, endDate),
            page: '1',
            limit: String(value),
            sortBy,
            sortOrder,
          });
        } }
        limitOptions={PAGE_SIZE_OPTIONS} />

      {/* Edit Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSave}
        title="Edit User"
        submitText="Save"
        loading={isSaving}
      >
        <div className="space-y-4">
          <FormInput
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="User name" />
          <FormInput
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone number" />
          <ImageUploadField
            label="Profile Image"
            preview={imagePreview}
            onFileChange={(e) => {
              const f = e.target.files?.[0] || null;
              setSelectedFile(f);
              if (f) setImagePreview(URL.createObjectURL(f));
              else setImagePreview(null);
            } }
            onRemove={() => {
              setImagePreview(null);
              setSelectedFile(null);
            } } />
          <FormSelect
            label="Gender"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as UserGender })}
            options={[
              { value: UserGender.MALE, label: 'Male' },
              { value: UserGender.FEMALE, label: 'Female' },
              { value: UserGender.OTHER, label: 'Other' },
            ]} />
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
            disabled={currentUser?.id === editingUser?.id} />
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this user'}?`}
      />
    </div>
  );
}
