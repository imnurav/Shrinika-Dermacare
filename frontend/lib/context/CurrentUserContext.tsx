'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import { authService } from '@/lib/services/auth';
import { User } from '@/lib/types';

type CurrentUserContextValue = {
    user: User | null;
    setUser: (user: User | null) => void;
    refreshUser: () => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | undefined>(undefined);

export function CurrentUserProvider({ children, initialUser = null }: { children: React.ReactNode; initialUser?: User | null }) {
    const [user, setUser] = useState<User | null>(() => initialUser ?? authService.getCurrentUser());

    const refreshUser = () => {
        setUser(authService.getCurrentUser());
    };

    const value = useMemo(
        () => ({
            user,
            setUser,
            refreshUser,
        }),
        [user],
    );

    return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

export function useCurrentUser() {
    const context = useContext(CurrentUserContext);
    if (!context) {
        throw new Error('useCurrentUser must be used within CurrentUserProvider');
    }
    return context;
}
