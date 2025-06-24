import React, { useState, useEffect } from 'react';
import { Settings, User, Database, Download, Upload, Trash2, AlertTriangle, Printer } from 'lucide-react';
import { User as UserType, LogEntry } from '../types';
import { userStorage, logStorage, productStorage, salesStorage, stockMovementStorage } from '../utils/storage';
import { format } from 'date-fns';
import POSSettings from './POSSettings';

interface SettingsTabProps {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ showToast }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeSection, setActiveSection] = useState<'users' | 'data' | 'pos' | 'logs'>('users');
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    role: 'cashier' as 'cashier' | 'manager' | 'admin',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(userStorage.getAll());
    setLogs(logStorage.getAll().sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.username || !newUser.fullName) {
      showToast('error', 'Lütfen tüm alanları doldurun!');
      return;
    }

    const existingUser = users.find(u => u.username === newUser.username);
    if (existingUser) {
      showToast('error', 'Bu kullanıcı adı zaten kayıtlı!');
      return;
    }

    const user: UserType = {
      ...newUser,
      isActive: true,
    };

    const updatedUsers = [...users, user];
    userStorage.save(updatedUsers);
    setUsers(updatedUsers);
    
    setNewUser({ username: '', fullName: '', role: 'cashier' });
    setShowAddUser(false);
    
    showToast('success', 'Kullanıcı eklendi!');
  };

  const toggleUserStatus = (username: string) => {
    const updatedUsers = users.map(user =>
      user.username === username
        ? { ...user, isActive: !user.isActive }
        : user
    );
    
    userStorage.save(updatedUsers);
    setUsers(updatedUsers);
    
    const user = updatedUsers.find(u => u.username === username);
    showToast('success', `${user?.fullName} ${user?.isActive ? 'aktif edildi' : 'devre dışı bırakıldı'}!`);
  };

  const exportData = () => {
    const data = {
      products: productStorage.getAll(),
      sales: salesStorage.getAll(),
      users: userStorage.getAll(),
      logs: logStorage.getAll(),
      stockMovements: stockMovementStorage.getAll(),
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `market-yedek-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
    link.click();
    
    showToast('success', 'Veriler başarıyla dışa aktarıldı!');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.products) productStorage.save(data.products);
        if (data.sales) salesStorage.save(data.sales);
        if (data.users) userStorage.save(data.users);
        if (data.logs) logStorage.save(data.logs);
        if (data.stockMovements) stockMovementStorage.save(data.stockMovements);
        
        loadData();
        showToast('success', 'Veriler başarıyla içe aktarıldı!');
      } catch (error) {
        showToast('error', 'Geçersiz dosya formatı!');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = () => {
    if (window.confirm('Tüm verileri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
      localStorage.clear();
      showToast('success', 'Tüm veriler silindi! Sayfa yenilenecek...');
      setTimeout(() => window.location.reload(), 2000);
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'cashier': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sections = [
    { id: 'users' as const, name: 'Kullanıcılar', icon: User },
    { id: 'pos' as const, name: 'POS Cihazı', icon: Printer },
    { id: 'data' as const, name: 'Veri Yönetimi', icon: Database },
    { id: 'logs' as const, name: 'Sistem Günlükleri', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
      </div>

      {/* Section Navigation */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-200'
                    : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Management */}
      {activeSection === 'users' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
            <button
              onClick={() => setShowAddUser(true)}
              className="btn-primary flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Kullanıcı Ekle
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input w-full"
                  placeholder="Kullanıcı adı"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="input w-full"
                  placeholder="Ad soyad"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="cashier">Kasiyer</option>
                  <option value="manager">Müdür</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>
              
              <div className="md:col-span-3 flex gap-3">
                <button type="submit" className="btn-primary">
                  Ekle
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Kullanıcı Adı</th>
                  <th>Ad Soyad</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username}>
                    <td className="font-mono">{user.username}</td>
                    <td>{user.fullName}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.isActive 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Devre Dışı'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleUserStatus(user.username)}
                        className={`btn text-sm px-3 py-1 ${
                          user.isActive ? 'btn-error' : 'btn-success'
                        }`}
                      >
                        {user.isActive ? 'Devre Dışı Bırak' : 'Aktif Et'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POS Settings */}
      {activeSection === 'pos' && <POSSettings showToast={showToast} />}

      {/* Data Management */}
      {activeSection === 'data' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="w-5 h-5" />
            Veri Yönetimi
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={exportData}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Yedek Al
            </button>
            
            <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              Yedek Yükle
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
            
            <button
              onClick={clearAllData}
              className="btn-error flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Tüm Verileri Sil
            </button>
          </div>
          
          <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <h3 className="font-medium text-warning-800">Önemli Notlar</h3>
            </div>
            <ul className="text-sm text-warning-700 list-disc list-inside space-y-1">
              <li>Yedek alma işlemi tüm ürün, satış ve kullanıcı verilerini içerir</li>
              <li>Yedek yükleme mevcut verilerin üzerine yazacaktır</li>
              <li>Tüm verileri silme işlemi geri alınamaz</li>
            </ul>
          </div>
        </div>
      )}

      {/* System Logs */}
      {activeSection === 'logs' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sistem Günlükleri</h2>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.slice(0, 50).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-600">{log.username}</span>
                    <span className="text-sm font-medium">{log.action}</span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Henüz sistem günlüğü bulunmuyor</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;