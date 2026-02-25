# Component Quick Reference

## 🎨 Common Components

### LoadingSpinner
```tsx
import { LoadingSpinner } from '@/components/common';

<LoadingSpinner />
```

### PageHeader
```tsx
<PageHeader
  title="Items"
  description="Manage all items"
  actionButton={<ActionButton>Add Item</ActionButton>}
/>
```

### Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Edit Item"
  size="lg"
  footer={
    <>
      <button onClick={() => setIsOpen(false)}>Cancel</button>
      <ActionButton onClick={handleSave}>Save</ActionButton>
    </>
  }
>
  {/* Content */}
</Modal>
```

### ActionButton
```tsx
// Primary variant
<ActionButton onClick={handleClick}>Save</ActionButton>

// With icon
<ActionButton icon={<Plus />}>Add Item</ActionButton>

// With loading
<ActionButton loading={isSaving}>Saving...</ActionButton>

// Different variants
<ActionButton variant="primary">Primary</ActionButton>
<ActionButton variant="secondary">Secondary</ActionButton>
<ActionButton variant="danger">Delete</ActionButton>
<ActionButton variant="success">Confirm</ActionButton>
```

### SearchFilterBar
```tsx
<SearchFilterBar
  searchPlaceholder="Search by name..."
  searchValue={search}
  onSearchChange={setSearch}
  filters={[
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ]}
  filterValues={{ status }}
  onFilterChange={(id, value) => setFilter(value)}
/>
```

### StatusBadge
```tsx
import { StatusBadge } from '@/components/common';
import { BookingStatus } from '@/lib/types';

<StatusBadge status={BookingStatus.CONFIRMED} />
```

## 📝 Form Components

### FormInput
```tsx
import { FormInput } from '@/components/form';

<FormInput
  label="Full Name"
  placeholder="John Doe"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  required
/>
```

### FormTextArea
```tsx
<FormTextArea
  label="Description"
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### FormSelect
```tsx
<FormSelect
  label="Category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  options={[
    { value: '1', label: 'Electronics' },
    { value: '2', label: 'Books' }
  ]}
/>
```

### ImageUploadField
```tsx
<ImageUploadField
  label="Profile Photo"
  value={imageUrl}
  preview={preview}
  onFileChange={(e) => {
    const file = e.target.files?.[0];
    setPreview(URL.createObjectURL(file));
  }}
  onRemove={() => setPreview(null)}
/>
```

## 🪝 Custom Hooks

### useCRUDList
```tsx
import { useCRUDList } from '@/lib/hooks';

const {
  items,
  isLoading,
  error,
  setError,
  page,
  setPage,
  limit,
  totalPages,
  totalItems,
  fetchItems,
  addItem,
  updateItem,
  removeItem,
} = useCRUDList({
  initialPage: 1,
  initialLimit: 10,
  onFetch: async () => {
    return await categoriesService.getCategories();
  },
  onError: (err) => console.error(err),
});
```

### useForm
```tsx
import { useForm } from '@/lib/hooks';

const {
  formData,
  setFormData,
  errors,
  setErrors,
  isSaving,
  error,
  setError,
  handleChange,
  handleSubmit,
  resetForm,
} = useForm({
  initialData: { name: '', email: '' },
  onSubmit: async (data) => {
    await apiService.create(data);
  },
  onSuccess: () => {
    resetForm();
    showNotification('Success!');
  },
  onError: (err) => console.error(err),
});
```

## 🏭 Service Factory

### Create a CRUD Service
```tsx
import { createCRUDService } from '@/lib/services/crudFactory';
import { Item } from '@/lib/types';

const itemsService = createCRUDService<Item>('/api/items');

// Use it
await itemsService.list({ page: 1, limit: 10 });
await itemsService.get(id);
await itemsService.create(data);
await itemsService.update(id, data);
await itemsService.delete(id);
```

## 📦 Pattern Examples

### Basic CRUD Page
```tsx
'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  PageHeader,
  LoadingSpinner,
  Modal,
  ActionButton,
  SearchFilterBar,
} from '@/components/common';
import { FormInput } from '@/components/form';
import Pagination from '@/components/common/Pagination';

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [name, setName] = useState('');

  if (isLoading) {
    return <DashboardLayout><LoadingSpinner /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Items"
          description="Manage items"
          actionButton={
            <ActionButton onClick={() => setIsModalOpen(true)}>
              Add Item
            </ActionButton>
          }
        />

        <SearchFilterBar
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* List content */}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Item"
          footer={
            <>
              <button onClick={() => setIsModalOpen(false)}>Cancel</button>
              <ActionButton>Save</ActionButton>
            </>
          }
        >
          <FormInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Modal>

        <Pagination page={page} setPage={setPage} totalPages={10} />
      </div>
    </DashboardLayout>
  );
}
```

## 🎯 Import Shortcuts

Use barrel exports for cleaner imports:

```tsx
// ✅ Good
import { PageHeader, Modal, ActionButton } from '@/components/common';
import { FormInput, FormSelect, ImageUploadField } from '@/components/form';
import { useCRUDList, useForm } from '@/lib/hooks';

// ❌ Avoid
import PageHeader from '@/components/common/PageHeader';
import Modal from '@/components/common/Modal';
// ... etc
```

## 🔄 Migration Checklist

Converting a page to use new components:

- [ ] Replace custom loading spinner with `<LoadingSpinner />`
- [ ] Replace page header markup with `<PageHeader />`
- [ ] Replace manual modals with `<Modal />`
- [ ] Replace form inputs with `FormInput`, `FormSelect`, etc.
- [ ] Replace custom buttons with `<ActionButton />`
- [ ] Replace custom search/filters with `<SearchFilterBar />`
- [ ] Extract status display to use `<StatusBadge />`
- [ ] Test all functionality
- [ ] Verify accessibility (keyboard navigation, ARIA labels)

---

**Last Updated:** December 19, 2025
**Version:** 1.0
