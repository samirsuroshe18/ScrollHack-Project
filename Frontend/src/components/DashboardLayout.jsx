import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/logo.png';
import { useAuth } from '../context/auth';

// Sidebar, header and logout shared by the student and alumni dashboards.
// On small screens the sidebar is a drawer opened from a top bar.
const DashboardLayout = ({ sections, active, onSelect, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleSelect = (section) => {
    onSelect(section);
    setMenuOpen(false);
  };

  // Escape closes the drawer
  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  return (
    <div className="flex h-dvh bg-gray-900">
      {/* Top bar, small screens only */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 px-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center min-w-0">
          <img src={logo} alt="" className="w-9 h-9 mr-2" />
          <span className="text-lg font-bold truncate">AlumniNest</span>
        </div>
        <button
          type="button"
          className="p-2 -mr-2 rounded-lg hover:bg-gray-700"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="dashboard-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Dims the page behind the open drawer; tapping it closes the drawer */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 z-30 bg-black/60"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: a drawer below the top bar on small screens, a fixed column from md up */}
      <aside
        id="dashboard-menu"
        className={`fixed top-14 bottom-0 left-0 z-40 w-64 shrink-0 bg-gray-800 text-white flex flex-col justify-between shadow-lg overflow-y-auto transition-transform duration-200 md:static md:translate-x-0 md:visible ${menuOpen ? 'translate-x-0' : '-translate-x-full max-md:invisible'}`}
      >
        <div>
          {/* Logo and name */}
          <div className="hidden md:flex items-center justify-center py-8">
            <img src={logo} alt="AlumniNest Logo" className="w-16 h-16 mr-2" />
            <span className="text-2xl font-bold">AlumniNest</span>
          </div>

          {/* Sidebar menu */}
          <nav>
            <ul className="mt-4 space-y-2 px-2">
              {sections.map((section) => (
                <li key={section}>
                  <button
                    type="button"
                    aria-current={active === section ? 'page' : undefined}
                    className={`w-full text-left px-6 py-3 rounded-lg hover:bg-purple-700 transition-all ${active === section ? 'bg-yellow-600' : ''}`}
                    onClick={() => handleSelect(section)}
                  >
                    {section}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Footer/Logout */}
        <div className="my-8 px-8">
          <p className="text-sm text-gray-400 mb-3 truncate" title={user.email}>
            {user.userName}
            <span className="block capitalize">{user.role}</span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg shadow-md transition duration-200"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-gray-900 p-4 pt-[4.5rem] md:p-10">
        <header className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">{active}</header>
        <div className="bg-gray-800 text-white shadow-md rounded-lg p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
