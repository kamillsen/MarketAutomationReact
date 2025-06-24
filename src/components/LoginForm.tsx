import React, { useState } from 'react';
import { ShoppingCart, User, Lock, LogIn } from 'lucide-react';
import { User as UserType } from '../types';
import { userStorage } from '../utils/storage';
import { logger } from '../utils/logger';

interface LoginFormProps {
  onLogin: (user: UserType) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, showToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = userStorage.getAll();
    const user = users.find(u => u.username === username && u.isActive);

    // Simple password check (in real app, use proper authentication)
    const validCredentials = [
      { username: 'admin', password: '1234' },
      { username: 'manager', password: '1234' },
      { username: 'cashier', password: '1234' },
    ];

    const credential = validCredentials.find(c => c.username === username && c.password === password);

    if (user && credential) {
      userStorage.setCurrentUser(user);
      logger.logAuth('LOGIN', username);
      onLogin(user);
      showToast('success', `Hoş geldiniz, ${user.fullName}!`);
    } else {
      showToast('error', 'Geçersiz kullanıcı adı veya şifre!');
    }

    setIsLoading(false);
  };

  const quickLogin = (role: 'admin' | 'manager' | 'cashier') => {
    setUsername(role);
    setPassword('1234');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-bounce-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
            <ShoppingCart className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Market Otomasyon</h1>
          <p className="text-gray-600">Sisteme giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kullanıcı Adı
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input pl-10 w-full"
                placeholder="Kullanıcı adınızı girin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10 w-full"
                placeholder="Şifrenizi girin"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4 text-center">Hızlı giriş için:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => quickLogin('admin')}
              className="btn-secondary text-xs p-2 hover:bg-gray-100"
            >
              Admin
            </button>
            <button
              onClick={() => quickLogin('manager')}
              className="btn-secondary text-xs p-2 hover:bg-gray-100"
            >
              Müdür
            </button>
            <button
              onClick={() => quickLogin('cashier')}
              className="btn-secondary text-xs p-2 hover:bg-gray-100"
            >
              Kasiyer
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Şifre: 1234</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;