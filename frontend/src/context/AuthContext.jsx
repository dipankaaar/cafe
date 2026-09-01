import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialStaff } from '../services/seedData';
import { dbService, DB_KEYS } from '../services/dbService';

const AuthContext = createContext();

export const ROLE_PERMISSIONS = {
  Admin: [
    'dashboard', 'orders', 'pos', 'kitchen', 'menu', 'tables', 'reservations',
    'customers', 'loyalty', 'coupons', 'inventory', 'suppliers', 'purchases',
    'expenses', 'staff', 'reports', 'notifications', 'audit', 'settings'
  ],
  Manager: [
    'dashboard', 'orders', 'pos', 'kitchen', 'menu', 'tables', 'reservations',
    'customers', 'loyalty', 'coupons', 'inventory', 'suppliers', 'purchases',
    'expenses', 'reports', 'notifications', 'audit'
  ],
  Cashier: [
    'dashboard', 'pos', 'orders', 'customers', 'tables', 'reservations', 'notifications'
  ],
  'Kitchen Staff': [
    'kitchen', 'orders', 'notifications'
  ],
  Waiter: [
    'tables', 'orders', 'pos', 'reservations', 'notifications'
  ]
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('dinenos_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialStaff[0]; // Admin by default
      }
    }
    return initialStaff[0]; // Default: Alex Walker (Admin)
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('dinenos_auth_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('dinenos_auth_user');
    }
  }, [currentUser]);

  const login = (email, password) => {
    const staffList = dbService.get(DB_KEYS.STAFF, initialStaff);
    const user = staffList.find(
      (s) => s.email.toLowerCase() === email.toLowerCase() && s.status === 'Active'
    );

    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      dbService.logAudit({
        user: `${user.name} (${user.role})`,
        action: 'USER_LOGIN',
        category: 'Auth',
        details: `${user.name} logged into system with role ${user.role}`
      });
      return { success: true, user };
    }
    return { success: false, message: 'Invalid credentials or inactive staff account.' };
  };

  const logout = () => {
    if (currentUser) {
      dbService.logAudit({
        user: `${currentUser.name} (${currentUser.role})`,
        action: 'USER_LOGOUT',
        category: 'Auth',
        details: `${currentUser.name} logged out from session`
      });
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Quick switch role helper for instant testing
  const switchRole = (roleName) => {
    const staffList = dbService.get(DB_KEYS.STAFF, initialStaff);
    const targetUser = staffList.find((s) => s.role === roleName) || {
      id: `staff-${Date.now()}`,
      name: `Test ${roleName}`,
      email: `${roleName.toLowerCase().replace(/\s+/g, '')}@dinenos.com`,
      role: roleName,
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    };

    setCurrentUser(targetUser);
    setIsAuthenticated(true);
    dbService.logAudit({
      user: `${targetUser.name} (${targetUser.role})`,
      action: 'ROLE_SWITCH',
      category: 'Auth',
      details: `Switched active session role to ${roleName}`
    });
  };

  const hasPermission = (moduleKey) => {
    if (!currentUser || !currentUser.role) return false;
    const permissions = ROLE_PERMISSIONS[currentUser.role] || [];
    return permissions.includes(moduleKey);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        logout,
        switchRole,
        hasPermission,
        role: currentUser?.role || 'Guest'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
