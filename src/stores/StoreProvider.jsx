import React, { createContext, useContext, useEffect } from 'react';
import { rootStore } from './index';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  useEffect(() => {
    // 初始化应用
    rootStore.initApp();
  }, []);

  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const useAuthStore = () => {
  const { authStore } = useStore();
  return authStore;
};

export const useSearchHistoryStore = () => {
  const { searchHistoryStore } = useStore();
  return searchHistoryStore;
}; 