// Utils
import { MainLayout } from "./layouts/MainLayout"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createRoot } from 'react-dom/client';
import { useEffect } from "react";
import { addLocale } from "primereact/api";
import connect from "./utils/request";

// Providers
import { PrimeReactProvider } from 'primereact/api';
import { LoadingProvider } from './contexts/LoadingContext';
import { ToastProvider } from "./contexts/ToastContext";


// Styles
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/saga-green/theme.css';
import 'primeflex/primeflex.css';
import "./index.css"

// Routes
import { RequestReport } from "./pages/Dashboards/requests"
import { DepartmentEmployeesDashboard } from "./pages/Dashboards/DepartmentEmployees"
import { Ponto48Dashboard } from "./pages/Dashboards/Ponto48Dashboard"
import { AdmissionDashboard } from "./pages/Dashboards/AdmissionDashboard.jsx"
import { Requests } from "./pages/Requisicoes/requests"
import { Request } from "./pages/Requisicoes/new.jsx"
import { Frotas } from "./pages/Frotas"
import { Auth } from "./pages/Auth"
import { Init } from "./pages/Init"
import { History } from "./pages/Requisicoes/history";
import { Products } from "./pages/Estoque/products";
import { Movements } from "./pages/Estoque/movements";
import { MobileMovement } from "./pages/Estoque/mobile_movement.jsx"
import { BarcodeGenerator } from "./pages/Estoque/barcode_generator.jsx";
import { Floaters } from "./pages/Requisicoes/floaters";
import ProjetosPage from "./pages/Projetos/ProjetosPage";
import { Vacancies } from "./pages/Admissao/vacancies.jsx"
import { Settings } from "./pages/Configuracoes"

document.documentElement.dataset.theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";

addLocale('pt-BR', {
  firstDayOfWeek: 0,
  dayNames: [
    'domingo', 'segunda', 'terça', 'quarta',
    'quinta', 'sexta', 'sábado'
  ],
  dayNamesShort: [
    'dom', 'seg', 'ter', 'qua',
    'qui', 'sex', 'sáb'
  ],
  dayNamesMin: [
    'D', 'S', 'T', 'Q', 'Q', 'S', 'S'
  ],
  monthNames: [
    'janeiro', 'fevereiro', 'março', 'abril',
    'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro'
  ],
  monthNamesShort: [
    'jan', 'fev', 'mar', 'abr',
    'mai', 'jun', 'jul', 'ago',
    'set', 'out', 'nov', 'dez'
  ],
  today: 'Hoje',
  clear: 'Limpar'
});

export function AppRoutes() {
  const token = function () { return !!sessionStorage.getItem("token") };

  useEffect(() => {
    // HMR and rerenders must never accumulate response interceptors.
    connect.interceptors.response.clear();
    const interceptor = connect.interceptors.response.use(
      (response) => response,
      (error) => {
        const isLoginRequest = String(error.config?.url || "").includes("/login");
        if (error.response?.status === 401 && !isLoginRequest) {
          sessionStorage.removeItem("token");
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );

    return () => connect.interceptors.response.eject(interceptor);
  }, []);

  return (
    <>
      <Routes>
        <Route path="" element={<Auth />} />
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/reposicoes/requisicao" element={<Request />} />
        <Route path="/estoque/movimentacao" element={<MobileMovement />} />
        <Route element={<MainLayout />}>
          {/* Init Page */}
          <Route path="/init" element={<Init />} />
          <Route path="/projetos" element={<ProjetosPage />} />
          <Route path="/configuracoes" element={<Settings />} />

          {/* Admissão */}
          <Route path="/admissao/vagas" element={<Vacancies />} />

          {/* Reposicoes */}
          <Route path="/reposicoes/requisicoes" element={<Requests />} />
          <Route path="/reposicoes/reservas" element={<Floaters />} />
          <Route path="/reposicoes/historico" element={<History />} />

          {/* Estoque */}
          <Route path="/reports/reposicoes" element={<RequestReport />} />
          <Route path="/reports/colaboradores-departamento" element={<DepartmentEmployeesDashboard />} />
          <Route path="/reports/ponto-48-horas" element={<Ponto48Dashboard />} />
          <Route path="/reports/admissoes" element={<AdmissionDashboard />} />
          <Route path="/estoque/produtos" element={<Products />} />
          <Route path="/estoque/codigos-de-barras" element={<BarcodeGenerator />} />
          <Route path="/estoque/movimentacoes" element={<Movements />} />

          {/* Frotas */}
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
