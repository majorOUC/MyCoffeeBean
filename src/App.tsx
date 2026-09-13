import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/components/AuthContext'
import { ToastProvider } from '@/components/Toast'
import RootLayout from '@/layouts/RootLayout'
import AddCoffeePage from '@/pages/AddCoffeePage'
import BrewCardFormPage from '@/pages/BrewCardFormPage'
import CoffeeDetailPage from '@/pages/CoffeeDetailPage'
import CoffeesPage from '@/pages/CoffeesPage'
import DiaryDetailPage from '@/pages/DiaryDetailPage'
import DiaryFormPage from '@/pages/DiaryFormPage'
import DiaryPage from '@/pages/DiaryPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import ProfilePage from '@/pages/ProfilePage'
import StatsPage from '@/pages/StatsPage'
import UserManagementPage from '@/pages/UserManagementPage'

// 地图页携带 ~108KB 地理数据，按需加载，避免拖慢首屏
const MapPage = lazy(() => import('@/pages/MapPage'))

function LazyMapPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8">
          <div className="h-64 animate-pulse rounded-3xl bg-coffee-100/60" />
        </div>
      }
    >
      <MapPage />
    </Suspense>
  )
}

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
              <Route path="brew-card/edit" element={<BrewCardFormPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="stats" element={<StatsPage />} />
              <Route path="map" element={<LazyMapPage />} />
              <Route path="login" element={<LoginPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
