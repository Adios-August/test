/**
 * Utility functions for workspace checking
 */

/**
 * Check if user has workspace from localStorage (for use outside React components)
 * @returns {boolean} true if user has workspace, false otherwise
 */
export const hasWorkspaceFromStorage = () => {
  try {
    const authStoreData = localStorage.getItem("authStore");
    if (authStoreData) {
      const parsedData = JSON.parse(authStoreData);
      const userWorkspace = parsedData?.user?.workspace;
      return userWorkspace && userWorkspace.trim().length > 0;
    }
  } catch (e) {
    return false;
  }
  return false;
};

/**
 * Check if user has workspace from authStore object
 * @param {Object} authStore - The authStore object with user property
 * @returns {boolean} true if user has workspace, false otherwise
 */
export const hasWorkspaceFromAuthStore = (authStore) => {
  if (!authStore?.user) return false;
  const userWorkspace = authStore.user?.workspace;
  return userWorkspace && userWorkspace.trim().length > 0;
};

/**
 * Universal function to check if user has workspace
 * Works with both authStore object or checks localStorage
 * @param {Object|null} authStore - Optional authStore object
 * @returns {boolean} true if user has workspace, false otherwise
 */
export const hasWorkspace = (authStore = null) => {
  if (authStore) {
    return hasWorkspaceFromAuthStore(authStore);
  }
  return hasWorkspaceFromStorage();
};

