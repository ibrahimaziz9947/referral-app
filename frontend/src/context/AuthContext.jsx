import { createContext, useContext, useState, useEffect } from 'react';
import { auth, wallet } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      auth.getCurrentUser()
        .then(response => {
          const userData = response.data;
          setUser(userData);
          
          return wallet.getBalance() 
            .then(balanceResponse => {
              setUser(currentUser => ({
                ...currentUser,
                walletBalance: balanceResponse.data?.balance
              }));
            })
            .catch(balanceError => {
              console.error("AuthContext: Failed to fetch wallet balance", balanceError);
               setUser(currentUser => ({
                ...currentUser,
                walletBalance: undefined
              }));
            });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
      setUser(null);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await auth.login({ email, password });
      const { token, referralCode, isAdmin } = response.data;
      localStorage.setItem('token', token);

      const userProfileResponse = await auth.getCurrentUser();
      const initialUserData = userProfileResponse.data;
      
      let finalUserData = { ...initialUserData, isAdmin: !!isAdmin };

      try {
        const balanceResponse = await wallet.getBalance();
        finalUserData.walletBalance = balanceResponse.data?.balance;
      } catch (balanceError) {
        console.error("AuthContext (Login): Failed to fetch wallet balance", balanceError);
        finalUserData.walletBalance = undefined;
      }

      setUser(finalUserData);

      return { 
        success: true,
        isAdmin: !!isAdmin
      };
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await auth.register(userData);
      const { token, isAdmin, yourReferralCode } = response.data;
      localStorage.setItem('token', token);
      
      const userProfileResponse = await auth.getCurrentUser();
      const initialUserData = userProfileResponse.data;
      
      let finalUserData = { 
         ...initialUserData, 
         isAdmin: !!isAdmin,
         referralCode: yourReferralCode
      };

      try {
        const balanceResponse = await wallet.getBalance();
        finalUserData.walletBalance = balanceResponse.data?.balance;
      } catch (balanceError) {
        console.error("AuthContext (Signup): Failed to fetch wallet balance", balanceError);
        finalUserData.walletBalance = undefined;
      }

      setUser(finalUserData);

      return { success: true };
    } catch (error) {
      setUser(null);
      localStorage.removeItem('token');
      return { 
        success: false, 
        error: error.response?.data?.message || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 