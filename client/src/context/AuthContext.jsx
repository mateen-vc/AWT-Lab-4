import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDemoUsers } from '../services/api';

const AuthContext = createContext();

export const DEMO_PROFILES = {
  customer: {
    id: 'cust_01',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  agent: {
    id: 'agent_01',
    name: 'Agent Marcus Ray',
    email: 'marcus.support@logistics.io',
    role: 'agent',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('demo_user_role');
    return saved === 'agent' ? DEMO_PROFILES.agent : DEMO_PROFILES.customer;
  });

  const [availableUsers, setAvailableUsers] = useState([
    DEMO_PROFILES.customer,
    DEMO_PROFILES.agent,
  ]);

  useEffect(() => {
    // Optionally fetch dynamic demo accounts from server
    getDemoUsers()
      .then((res) => {
        if (res?.data?.length > 0) {
          setAvailableUsers(res.data);
        }
      })
      .catch((err) => console.log('Using default local demo accounts:', err.message));
  }, []);

  const switchRole = (role) => {
    const user = role === 'agent' ? DEMO_PROFILES.agent : DEMO_PROFILES.customer;
    setCurrentUser(user);
    localStorage.setItem('demo_user_role', role);
  };

  const selectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('demo_user_role', user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        isAgent: currentUser.role === 'agent',
        isCustomer: currentUser.role === 'customer',
        switchRole,
        selectUser,
        availableUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
