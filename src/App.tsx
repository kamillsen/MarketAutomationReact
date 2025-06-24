import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Layout from './components/Layout';
import SalesTab from './components/SalesTab';
import ProductsTab from './components/ProductsTab';
import StockTab from './components/StockTab';
import ReportsTab from './components/ReportsTab';
import SettingsTab from './components/SettingsTab';
import Toast from './components/Toast';
import { User, TabType } from './types';
import { userStorage, initializeDefaultData } from './utils/storage';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Initialize default data
    initializeDefaultData();
    
    // Check for existing session
    const savedUser = userStorage.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveTab('sales');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('sales');
  };

  const renderActiveTab = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'sales':
        return <SalesTab currentUser={currentUser} showToast={showToast} />;
      case 'products':
        return <ProductsTab showToast={showToast} />;
      case 'stock':
        return <StockTab currentUser={currentUser} showToast={showToast} />;
      case 'reports':
        return <ReportsTab showToast={showToast} />;
      case 'settings':
        return <SettingsTab showToast={showToast} />;
      default:
        return <SalesTab currentUser={currentUser} showToast={showToast} />;
    }
  };

  if (!currentUser) {
    return <LoginForm onLogin={handleLogin} showToast={showToast} />;
  }

  return (
    <>
      <Layout
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      >
        {renderActiveTab()}
      </Layout>

      {/* Toast Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </>
  );
}

export default App;