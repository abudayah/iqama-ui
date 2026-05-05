import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigGate } from './components/ConfigGate';
import { AdminAuthGate } from './components/AdminAuthGate';
import { PrayerViewerPage } from './pages/PrayerViewerPage';
import { AdminPage } from './pages/AdminPage';
import { OverridesPage } from './pages/OverridesPage';
import { ScheduleRangePage } from './pages/ScheduleRangePage';
import { RamadanEidPage } from './pages/RamadanEidPage';

function App() {
  return (
    <BrowserRouter>
      <ConfigGate>
        <Routes>
          <Route path="/" element={<PrayerViewerPage />} />
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
    </BrowserRouter>
  );
}

export default App;
