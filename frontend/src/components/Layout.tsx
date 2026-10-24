import { Link, Outlet, useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="lamp" aria-hidden="true" />
            <div>
              <p className="brand-name">Pipeline Pulse</p>
              <p className="tagline">What ran, what failed, and why.</p>
            </div>
          </div>
          <Link
            to="/"
            data-testid="nav-home"
            className="home-link"
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            Home
          </Link>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
      <footer className="footer">
        <p className="footer-inner">Run status for FlashArray, FlashBlade, and Hyperscale pipelines.</p>
      </footer>
    </div>
  );
}
