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

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
      </Routes>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <NavLink to="/" className="logo-title" style={{ textDecoration: 'none' }}>
            <span className="logo-icon material-symbols-outlined">radar</span>
            <span className="logo-text">BlackHawk</span>
          </NavLink>
        </div>
        <nav className="nav-group" aria-label="Main navigation">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/scan/new" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">add_circle</span>
            <span>New Scan</span>
          </NavLink>
          <NavLink to="/capabilities" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>Capabilities</span>
          </NavLink>
          <NavLink to="/compare" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">difference</span>
            <span>Compare</span>
          </NavLink>
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="material-symbols-outlined">home</span>
            <span>Landing</span>
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="version">
            <span className="pulse-dot" />
            <span>v2.0.0 · OWASP Core</span>
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
  );
}
