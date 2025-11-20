import { useMemo } from 'react';
import { useAuthStore } from '../stores';
import { hasWorkspaceFromAuthStore } from '../utils/workspaceUtils';

/**
 * Custom hook to check if user has workspace
 * @returns {boolean} true if user has workspace, false otherwise
 */
export const useHasWorkspace = () => {
  const authStore = useAuthStore();
  
  return useMemo(() => {
    return hasWorkspaceFromAuthStore(authStore);
  }, [authStore.user?.workspace]);
};

