import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/components/AuthContext'
import { ToastProvider } from '@/components/Toast'
import RootLayout from '@/layouts/RootLayout'
import AddCoffeePage from '@/pages/AddCoffeePage'
import CoffeeDetailPage from '@/pages/CoffeeDetailPage'
import CoffeesPage from '@/pages/CoffeesPage'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import MapPage from '@/pages/MapPage'
import StatsPage from '@/pages/StatsPage'

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
