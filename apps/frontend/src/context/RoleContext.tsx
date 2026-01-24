'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'admin' | 'analyst' | 'operator' | 'auditor';

export interface Permissions {
    read: boolean;
    write: boolean;
    delete: boolean;
    config: boolean;
    execute: boolean;
    export: boolean;
}

interface RoleContextType {
    role: Role;
    permissions: Permissions;
    setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const ROLE_PERMISSIONS: Record<Role, Permissions> = {
    admin: {
        read: true,
        write: true,
        delete: true,
        config: true,
        execute: true,
        export: true,
    },
    analyst: {
        read: true,
        write: false,
        delete: false,
        config: false,
        execute: false,
        export: false,
    },
    operator: {
        read: true,
        write: false,
        delete: false,
        config: false,
        execute: true,
        export: false,
    },
    auditor: {
        read: true,
        write: false,
        delete: false,
        config: false,
        execute: false,
        export: true,
    },
};

export function RoleProvider({ children }: { children: ReactNode }) {
    const [role, setRoleState] = useState<Role>('admin');

    // Load role from localStorage on mount
    useEffect(() => {
        const savedRole = localStorage.getItem('obs_user_role') as Role;
        if (savedRole && ROLE_PERMISSIONS[savedRole]) {
            setRoleState(savedRole);
        }
    }, []);

    const setRole = (newRole: Role) => {
        setRoleState(newRole);
        localStorage.setItem('obs_user_role', newRole);
    };

    return (
        <RoleContext.Provider
            value={{
                role,
                permissions: ROLE_PERMISSIONS[role],
                setRole,
            }}
        >
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
