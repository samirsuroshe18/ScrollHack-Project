import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../context/auth';

// Sidebar, header and logout shared by the student and alumni dashboards
const DashboardLayout = ({ sections, active, onSelect, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-gray-800 text-white flex flex-col justify-between shadow-lg">
        <div>
          {/* Logo and name */}
          <div className="flex items-center justify-center py-8">
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
                    onClick={() => onSelect(section)}
                  >
                    {section}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Footer/Logout */}
        <div className="mb-8 px-8">
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
      <main className="flex-1 overflow-y-auto bg-gray-900 p-10">
        <header className="text-3xl font-semibold text-white mb-8">{active}</header>
        <div className="bg-gray-800 text-white shadow-md rounded-lg p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
