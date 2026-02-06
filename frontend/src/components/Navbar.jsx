import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const [theme, setTheme] = useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { label: 'Features', to: '#features' },
    { label: 'About', to: '#about' },
    { label: 'Team', to: '#team' },
  ];

  // Theme setup
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(initial);
  }, []);

  // Lock scroll + clicks when mobile menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.pointerEvents = 'auto';
    }
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(next);
    localStorage.setItem('theme', next);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const NavLinks = ({ mobile = false }) =>
    links.map(link =>
      mobile ? (
        <a
          key={link.label}
          href={link.to}
          className="text-lg hover:text-blue-400"
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.label}
        </a>
      ) : (
        <li key={link.label}>
          <a href={link.to} className="hover:text-blue-400">
            {link.label}
          </a>
        </li>
      )
    );

  const AuthButtons = ({ mobile = false }) => {
    if (isAuthenticated) {
      return mobile ? (
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      ) : (
        <li className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-primary"
          >
            {user?.name || 'User'} ▼
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow z-[9999]">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </li>
      );
    }

    return mobile ? (
      <>
        <Link
          to="/login"
          onClick={() => setMobileMenuOpen(false)}
          className="btn btn-secondary"
        >
          Login
        </Link>
        <Link
          to="/signup"
          onClick={() => setMobileMenuOpen(false)}
          className="btn btn-primary"
        >
          Sign Up
        </Link>
      </>
    ) : (
      <>
        <li>
          <Link to="/login" className="btn btn-secondary">
            Login
          </Link>
        </li>
        <li>
          <Link to="/signup" className="btn btn-primary">
            Sign Up
          </Link>
        </li>
      </>
    );
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="bg-gray-900 text-white fixed w-full z-[9999] pointer-events-auto">
        <div className="container mx-auto flex justify-between items-center px-4 py-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <div className="logo-icon">C</div>
            <span>ProjectX</span>
          </Link>

          {/* Desktop Menu */}
          <ul className="hidden md:flex gap-6 items-center">
            <li>
              <button onClick={toggleTheme} className="text-xl">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </li>
            <NavLinks />
            <AuthButtons />
          </ul>

          {/* Hamburger */}
          <button
            className="md:hidden text-3xl"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[9998] md:hidden
                     bg-black/40 backdrop-blur-md
                     pointer-events-auto"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-72
        bg-gray-900/90 backdrop-blur-xl
        border-l border-white/10
        p-6 pt-16 flex flex-col gap-6
        z-[9999] pointer-events-auto
        transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-3xl"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>

        <button onClick={toggleTheme} className="text-2xl">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <NavLinks mobile />
        <AuthButtons mobile />
      </div>
    </>
  );
}
