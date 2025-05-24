import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import GlobalSettings from './components/GlobalSettings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './layouts/DashboardLayout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import Profile from './pages/Profile';
import Investments from './pages/Investments';
import Tasks from './pages/Tasks';
import InvestmentProducts from './pages/InvestmentProducts';
import Wallet from './pages/Wallet';
import Earnings from './pages/Earnings';
import Team from './pages/Team';
import AdminInvestmentProducts from './pages/AdminInvestmentProducts';
import AdminWalletRequests from './pages/AdminWalletRequests';
import AdminUsers from './pages/AdminUsers';
import AdminDashboardOverview from './pages/AdminDashboardOverview';
import AdminSettings from './pages/AdminSettings';
import AdminTasks from './pages/AdminTasks';
import AdminWithdrawals from './pages/AdminWithdrawals';
// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // If admin-only route and user is not admin, redirect to user dashboard
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // If children is a function, call it with the user
  if (typeof children === 'function') {
    return children({ user });
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SettingsProvider>
            <GlobalSettings />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<Login />} />

            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<Signup />} />

            {/* Protected user routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                    <InvestmentProducts />
                </ProtectedRoute>
              }
            />
            <Route
                  path="/user/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/investments"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Investments />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/investment-products"
              element={
                <ProtectedRoute>
                  <InvestmentProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/tasks"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Tasks />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/withdrawl"
              element={
                <ProtectedRoute>
                  <Earnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/team"
              element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              }
            />

            {/* Protected admin routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                        <AdminDashboardOverview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute adminOnly>
                        <AdminInvestmentProducts />
                    </ProtectedRoute>
                  }
                />
                    <Route
                      path="/admin/wallet-requests"
                      element={
                        <ProtectedRoute adminOnly>
                            <AdminWalletRequests />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/withdrawals"
                      element={
                        <ProtectedRoute adminOnly>
                            <AdminWithdrawals />
                        </ProtectedRoute>
                      }
                    />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute adminOnly>
                        <AdminUsers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute adminOnly>
                        <AdminSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/tasks"
                  element={
                    <ProtectedRoute adminOnly>
                        <AdminTasks />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard or login */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                      {({ user }) => (
                        <Navigate to={user.isAdmin ? "/admin/dashboard" : "/dashboard"} />
                      )}
                </ProtectedRoute>
              }
            />
          </Routes>
          </SettingsProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
