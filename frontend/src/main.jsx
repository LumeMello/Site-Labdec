import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LabProvider } from './context/LabContext';
import router from './routes';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LabProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </LabProvider>
  </React.StrictMode>,
);
