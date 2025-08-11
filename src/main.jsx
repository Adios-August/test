import React from 'react';
import { createRoot } from 'react-dom/client';
import '@ant-design/v5-patch-for-react-19';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './stores';
import router from './router';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  </React.StrictMode>
);
