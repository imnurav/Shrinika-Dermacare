'use client';
import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { BookingStatus } from '@/lib/types';

export interface StatusBadgeProps {
    status: BookingStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const getStatusBadge = (): { badge: string; icon: React.ReactNode } => {
        switch (status) {
            case BookingStatus.PENDING:
                return {
                    badge: 'bg-yellow-100 text-yellow-800',
                    icon: <Clock className="w-4 h-4" />,
                };
            case BookingStatus.CONFIRMED:
                return {
                    badge: 'bg-blue-100 text-blue-800',
                    icon: <CheckCircle className="w-4 h-4" />,
                };
            case BookingStatus.COMPLETED:
                return {
                    badge: 'bg-green-100 text-green-800',
                    icon: <CheckCircle className="w-4 h-4" />,
                };
            case BookingStatus.CANCELLED:
                return {
                    badge: 'bg-red-100 text-red-800',
                    icon: <XCircle className="w-4 h-4" />,
                };
            default:
                return {
                    badge: 'bg-gray-100 text-gray-800',
                    icon: <Clock className="w-4 h-4" />,
                };
        }
    };

    const { badge, icon } = getStatusBadge();

    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge}`}>
            {icon}
            {status}
        </span>
    );
};

export default StatusBadge;
