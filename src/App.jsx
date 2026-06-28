import { createRoot } from 'react-dom/client';
import { PrimeReactProvider } from 'primereact/api';
import { LoadingProvider } from './contexts/LoadingContext';
import { MainLayout } from "./layouts/MainLayout"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";

import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import 'primereact/resources/themes/saga-green/theme.css';
import "./index.css"

// Routes
import { Requisicoes } from "./pages/Requisicoes"
import { Request } from "./pages/Requisicoes/request.jsx"
import { Frotas } from "./pages/Frotas"
import { Auth } from "./pages/Auth"
import { Init } from "./pages/Init"

export function AppRoutes() {
  const token = function () { return !!sessionStorage.getItem("token") };

  return (
    <>
      <Routes>
        <Route path="" element={<Auth />} />
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/reposicoes/requisicao" element={<Request />} />

        <Route element={<MainLayout />}>
          <Route path="/frotas" element={<Frotas />} />
          <Route path="/requisicoes" element={<Requisicoes />} />
          <Route path="/init" element={<Init />} />
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