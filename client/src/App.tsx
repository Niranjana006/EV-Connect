import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import AppRoutes from './routes';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app flex min-h-screen">
          <Sidebar />
          <div className="flex flex-col flex-grow">
            <Navbar />
            <main className="flex-grow">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;