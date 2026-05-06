import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigGate } from './components/ConfigGate';
import { AdminAuthGate } from './components/AdminAuthGate';
import { PrayerViewerPage } from './pages/PrayerViewerPage';
import { AdminPage } from './pages/AdminPage';
import { OverridesPage } from './pages/OverridesPage';
import { ScheduleRangePage } from './pages/ScheduleRangePage';
import { RamadanEidPage } from './pages/RamadanEidPage';
import { WidgetPage } from './pages/WidgetPage';
import { useFavicon } from './hooks/useFavicon';

function AppRoutes() {
  useFavicon();
  return (
    <ConfigGate>
      <Routes>
        <Route path="/" element={<PrayerViewerPage />} />
        <Route path="/widget" element={<WidgetPage />} />
        <Route
          path="/admin"
          element={
            <AdminAuthGate>
              <AdminPage />
            </AdminAuthGate>
          }
        >
          <Route index element={<OverridesPage />} />
          <Route path="schedule" element={<ScheduleRangePage />} />
          <Route path="eid" element={<RamadanEidPage />} />
        </Route>
      </Routes>
    </ConfigGate>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
