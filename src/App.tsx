import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/components/AuthContext'
import { ToastProvider } from '@/components/Toast'
import RootLayout from '@/layouts/RootLayout'
import AddCoffeePage from '@/pages/AddCoffeePage'
import CoffeeDetailPage from '@/pages/CoffeeDetailPage'
import CoffeesPage from '@/pages/CoffeesPage'
import DiaryDetailPage from '@/pages/DiaryDetailPage'
import DiaryFormPage from '@/pages/DiaryFormPage'
import DiaryPage from '@/pages/DiaryPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import MapPage from '@/pages/MapPage'
import StatsPage from '@/pages/StatsPage'
import UserManagementPage from '@/pages/UserManagementPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="coffees" element={<CoffeesPage />} />
              <Route path="coffees/:id" element={<CoffeeDetailPage />} />
              <Route path="add" element={<AddCoffeePage />} />
              <Route path="diary" element={<DiaryPage />} />
              <Route path="diary/new" element={<DiaryFormPage />} />
              <Route path="diary/:id" element={<DiaryDetailPage />} />
              <Route path="diary/:id/edit" element={<DiaryFormPage />} />
              <Route path="admin/users" element={<UserManagementPage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="login" element={<LoginPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
