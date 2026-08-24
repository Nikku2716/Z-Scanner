import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import NewScan from './pages/NewScan';
import ScanProgress from './pages/ScanProgress';
import Report from './pages/Report';
import Capabilities from './pages/Capabilities';
import AttackSurface from './pages/AttackSurface';
import SecurityOverview from './pages/SecurityOverview';
import ComparePage from './pages/Compare';
import CursorFX from './components/CursorFX';

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return (
      <>
        <CursorFX />
        <Routes>
          <Route path="/" element={<Landing />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <CursorFX />
      <div className="layout">
        <aside className="sidebar">
          <div className="logo">
            <span className="logo-title">
              <span className="logo-text-black">Black</span>
              <span className="logo-text-hawk">Hawk</span>
            </span>
          </div>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
            <span className="material-symbols-outlined">grid_view</span>
            Dashboard
          </NavLink>
          <NavLink to="/scan/new" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">add_circle</span>
            New Scan
          </NavLink>
          <NavLink to="/capabilities" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">auto_awesome</span>
            Capabilities
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">difference</span>
            Compare
          </NavLink>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">home</span>
            Landing
          </NavLink>
          <div className="sidebar-footer">
            <div className="version">
              <span className="material-symbols-outlined">terminal</span>
              v0.1.0
            </div>
          </div>
        </aside>
        <main className="main">
          {/* Keyed wrapper re-runs enter animation on every route change */}
          <div className="fade-in" key={location.pathname}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/scan/new" element={<NewScan />} />
              <Route path="/scan/:id" element={<ScanProgress />} />
              <Route path="/report/:id" element={<Report />} />
              <Route path="/scan/:id/surface" element={<AttackSurface />} />
              <Route path="/scan/:id/analytics" element={<SecurityOverview />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/capabilities" element={<Capabilities />} />
            </Routes>
          </div>
        </main>
      </div>
    </>
  );
}
