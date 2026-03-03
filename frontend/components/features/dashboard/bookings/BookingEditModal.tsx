'use client';
import { FormInput, FormTextArea } from '@/components/form/FormFields';
import FormModal from '@/components/common/FormModal';
import { ServiceOption } from '@/lib/types';
import { BookingFormData } from './types';
import { Plus, X } from 'lucide-react';

type AddressOption = { id: string; label: string };

type Props = {
  isOpen: boolean;
  loading: boolean;
  minDate?: string;
  minTime?: string;
  onClose: () => void;
  onSubmit: () => void;
  isMetaLoading: boolean;
  onAddService: () => void;
  formData: BookingFormData;
  serviceSelectValue: string;
  serviceOptions: ServiceOption[];
  addressOptions: AddressOption[];
  onRemoveService: (serviceId: string) => void;
  setServiceSelectValue: (value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
};

export default function BookingEditModal({
  isOpen,
  loading,
  isMetaLoading,
  formData,
  setFormData,
  serviceSelectValue,
  setServiceSelectValue,
  serviceOptions,
  addressOptions,
  minDate,
  minTime,
  onClose,
  onSubmit,
  onAddService,
  onRemoveService,
}: Props) {
  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSubmit={onSubmit} title="Edit Booking" submitText="Save" loading={loading}>
      <div className="space-y-4">
        <FormInput label="Person Name" required value={formData.personName} onChange={(e) => setFormData((prev) => ({ ...prev, personName: e.target.value }))} placeholder="Full name" />
        <FormInput label="Person Phone" required value={formData.personPhone} onChange={(e) => setFormData((prev) => ({ ...prev, personPhone: e.target.value }))} placeholder="Phone number" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput label="Preferred Date" type="date" min={minDate} value={formData.preferredDate} onChange={(e) => setFormData((prev) => ({ ...prev, preferredDate: e.target.value }))} />
          <FormInput label="Preferred Time" type="time" min={minTime} value={formData.preferredTime} onChange={(e) => setFormData((prev) => ({ ...prev, preferredTime: e.target.value }))} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Address</label>
          <select
            value={formData.addressId}
            onChange={(e) => setFormData((prev) => ({ ...prev, addressId: e.target.value }))}
            disabled={isMetaLoading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">{isMetaLoading ? 'Loading addresses...' : 'Select address'}</option>
            {addressOptions.map((address) => <option key={address.id} value={address.id}>{address.label}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Services</label>
          <div className="flex gap-2">
            <select
              value={serviceSelectValue}
              onChange={(e) => setServiceSelectValue(e.target.value)}
              disabled={isMetaLoading}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">{isMetaLoading ? 'Loading services...' : 'Select service'}</option>
              {serviceOptions.map((service) => <option key={service.id} value={service.id}>{service.title}</option>)}
            </select>
            <button type="button" onClick={onAddService} disabled={isMetaLoading} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" /> Add
            </button>
          </div>

          {formData.serviceIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.serviceIds.map((serviceId) => {
                const service = serviceOptions.find((item) => item.id === serviceId);
                return (
                  <div key={serviceId} className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
                    <span>{service?.title || serviceId}</span>
                    <button type="button" onClick={() => onRemoveService(serviceId)} className="rounded-full p-0.5 text-indigo-700 hover:bg-indigo-200">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No services selected.</p>
          )}
        </div>

        <FormTextArea label="Notes" value={formData.notes} onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Additional notes" rows={3} />
      </div>
    </FormModal>
  );
}

