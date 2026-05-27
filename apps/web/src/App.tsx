import '@/styles/theme.css';
import '@/styles/brand.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppShell } from '@/components/AppShell';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import DashboardPage from '@/pages/DashboardPage';
import ConstructionPage from '@/pages/ConstructionPage';
import ElectionsPage from '@/pages/ElectionsPage';
import LeviesPage from '@/pages/LeviesPage';
import DocumentsPage from '@/pages/DocumentsPage';
import IwiPage from '@/pages/IwiPage';
import NotFoundPage from '@/pages/NotFoundPage';

function ProtectedShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedShell>
              <DashboardPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/construction"
          element={
            <ProtectedShell>
              <ConstructionPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/elections"
          element={
            <ProtectedShell>
              <ElectionsPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/levies"
          element={
            <ProtectedShell>
              <LeviesPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedShell>
              <DocumentsPage />
            </ProtectedShell>
          }
        />
        <Route
          path="/iwi"
          element={
            <ProtectedShell>
              <IwiPage />
            </ProtectedShell>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}
