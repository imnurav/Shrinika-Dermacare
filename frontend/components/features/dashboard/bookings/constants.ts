import { BookingStatus } from "@/lib/types";

export const BOOKING_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: BookingStatus.PENDING, label: "Pending" },
  { value: BookingStatus.CONFIRMED, label: "Confirmed" },
  { value: BookingStatus.COMPLETED, label: "Completed" },
  { value: BookingStatus.CANCELLED, label: "Cancelled" },
];

export const BOOKING_SORT_FIELDS = [
  "personName",
  "personPhone",
  "preferredDate",
  "preferredTime",
  "status",
  "createdAt",
] as const;
