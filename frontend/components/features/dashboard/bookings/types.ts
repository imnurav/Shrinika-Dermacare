"use client";

export type BookingFormData = {
  notes: string;
  addressId: string;
  personName: string;
  personPhone: string;
  serviceIds: string[];
  preferredDate: string;
  preferredTime: string;
};
