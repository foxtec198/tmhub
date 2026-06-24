import { Outlet, useNavigate } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="app-wrapper">
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}