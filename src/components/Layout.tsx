import React from 'react';
import { ShoppingCart, User, LogOut, Settings } from 'lucide-react';
import { User as UserType, TabType } from '../types';
import { userStorage } from '../utils/storage';
import { logger } from '../utils/logger';

interface LayoutProps {
  currentUser: UserType;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentUser, activeTab, onTabChange, onLogout, children }) => {
  const handleLogout = () => {
    logger.logAuth('LOGOUT', currentUser.username);
    userStorage.logout();
    onLogout();
  };

  const tabs = [
    { id: 'sales' as TabType, name: 'Satış', visible: true },
    { id: 'products' as TabType, name: 'Ürünler', visible: currentUser.role !== 'cashier' },
    { id: 'stock' as TabType, name: 'Stok', visible: currentUser.role !== 'cashier' },
    { id: 'reports' as TabType, name: 'Raporlar', visible: currentUser.role !== 'cashier' },
    { id: 'settings' as TabType, name: 'Ayarlar', visible: currentUser.role === 'admin' },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Yönetici';
      case 'manager': return 'Müdür';
      case 'cashier': return 'Kasiyer';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Market Otomasyon</h1>
                <p className="text-sm text-gray-600">Satış ve Stok Yönetim Sistemi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser.fullName}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(currentUser.role)}`}>
                    {getRoleName(currentUser.role)}
                  </span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.filter(tab => tab.visible).map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative py-4 px-1 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout;