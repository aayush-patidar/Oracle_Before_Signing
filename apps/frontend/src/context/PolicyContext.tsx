'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiCall } from '@/lib/api';

interface PolicyContextType {
    policyMode: string;
    setPolicyMode: (mode: string) => Promise<void>;
    isLoading: boolean;
}

const PolicyContext = createContext<PolicyContextType | undefined>(undefined);

export function PolicyProvider({ children }: { children: ReactNode }) {
    const [policyMode, setPolicyModeState] = useState<string>('MONITOR');
    const [isLoading, setIsLoading] = useState(true);

    const fetchPolicyMode = async () => {
        try {
            // Fetch policies to determine the global mode
            const policies = await apiCall<any[]>('/policies');
            if (policies && policies.length > 0) {
                // Strict check: Global Mode is ENFORCE only if ALL policies are ENFORCE.
                const allEnforce = policies.every((p: any) => p.mode === 'ENFORCE');
                setPolicyModeState(allEnforce ? 'ENFORCE' : 'MONITOR');
            }
        } catch (error) {
            console.error('Failed to fetch policy mode', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updatePolicyMode = async (mode: string) => {
        // Optimistic update
        setPolicyModeState(mode);
        try {
            await apiCall('/policies/global-mode', {
                method: 'POST',
                body: JSON.stringify({ mode })
            });
            // We can optionally refetch to confirm, but optimistic is usually fine if no error
            fetchPolicyMode();
        } catch (error) {
            console.error('Failed to update policy mode:', error);
            // Revert in case of error (optional, but good practice)
            fetchPolicyMode();
        }
    };

    useEffect(() => {
        fetchPolicyMode();
    }, []);

    return (
        <PolicyContext.Provider value={{ policyMode, setPolicyMode: updatePolicyMode, isLoading }}>
            {children}
        </PolicyContext.Provider>
    );
}

export function usePolicy() {
    const context = useContext(PolicyContext);
    if (context === undefined) {
        throw new Error('usePolicy must be used within a PolicyProvider');
    }
    return context;
}
