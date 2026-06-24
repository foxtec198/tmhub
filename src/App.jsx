import { createRoot } from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import { LoadingProvider } from './contexts/LoadingContext';
import { MainLayout } from "./layouts/MainLayout"
import { Frotas } from "./pages/Frotas"
import { Auth } from "./pages/Auth"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'primereact/resources/themes/saga-green/theme.css';
import { ToastProvider } from "./contexts/ToastContext";
import "./App.css"

export function AppRoutes() {
  const token = function () { return !!sessionStorage.getItem("token") };

  return (
    <>
      <Routes>
        <Route path="" element={<Auth />} />
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Auth />} />

        <Route element={<MainLayout />}>
          <Route path="/frotas" element={<Frotas />} />
        </Route>

        <Route path="*" element={<Navigate to={token() ? "/init" : "/"} />} />
      </Routes>
    </>
  )
};

let container = null; // Variavel do container
document.addEventListener('DOMContentLoaded', function () {
  if (!container) {
    container = document.getElementById('root');
    const root = createRoot(container)
    root.render(
      <PrimeReactProvider>
        <LoadingProvider>
          <BrowserRouter>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </BrowserRouter>
        </LoadingProvider>
      </PrimeReactProvider>
    );
  }
});