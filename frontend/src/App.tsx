import { NavLink, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import NewScan from './pages/NewScan';
import ScanProgress from './pages/ScanProgress';
import Report from './pages/Report';
import Capabilities from './pages/Capabilities';

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark" aria-hidden="true">bh</span>
          <div>
            BLACKHAWK
            <span>vulnerability scanner</span>
          </div>
        </div>
        <NavLink to="/" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end>
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
        <div className="sidebar-footer">
          <div className="version">
            <span className="material-symbols-outlined">draw</span>
            v0.1.0-stable
          </div>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/scan/new" element={<NewScan />} />
          <Route path="/scan/:id" element={<ScanProgress />} />
          <Route path="/report/:id" element={<Report />} />
          <Route path="/capabilities" element={<Capabilities />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>Developed by ghostblade</span>
        <span>opensource.</span>
      </footer>
    </div>
  );
}
