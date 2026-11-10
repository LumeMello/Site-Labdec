import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Toaster from '../components/feedback/Toaster';

export default function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar aberta={menuAberto} aoFechar={() => setMenuAberto(false)} />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header aoAbrirMenu={() => setMenuAberto(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}
