import React from 'react';
import { Outlet } from 'react-router-dom';
import ThemeProvider from './theme/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <Outlet />
    </ThemeProvider>
  );
}

export default App;
