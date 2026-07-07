// Utils
import { MainLayout } from "./layouts/MainLayout"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { createRoot } from 'react-dom/client';
import { addLocale } from "primereact/api";
import { useToast } from "./contexts/ToastContext";
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
import { Requests } from "./pages/Requisicoes/requests"
import { Request } from "./pages/Requisicoes/new_request.jsx"
import { Frotas } from "./pages/Frotas"
import { Auth } from "./pages/Auth"
import { Init } from "./pages/Init"
import { History } from "./pages/Requisicoes/history";
import { Products } from "./pages/Estoque/products";
import { Movements } from "./pages/Estoque/movements";
import { Floaters } from "./pages/Requisicoes/floaters";
import ProjetosPage from "./pages/Projetos/ProjetosPage";

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
  const { showToast } = useToast();
  const token = function () { return !!sessionStorage.getItem("token") };

  connect.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        sessionStorage.removeItem("token");
        window.location.href = "/login";
      }

      if (error.code === 'ERR_NETWORK' || !error.response) {
        showToast("warn", "Erro!", 'Não foi possível conectar ao servidor. Ele pode estar fora do ar!');
      }

      else if (error.response && error.response.status === 500) {
        showToast("error", "Erro!", 'Internal Error: Erro no servidor, tente novamnte mais tarde.');
      }

      return Promise.reject(error);
    }
  );

  return (
    <>
      <Routes>
        <Route path="" element={<Auth />} />
        <Route path="/" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/reposicoes/requisicao" element={<Request />} />

        <Route element={<MainLayout />}>
          {/* Init Page */}
          <Route path="/init" element={<Init />} />

          <Route path="/projetos" element={<ProjetosPage />} />

          {/* Reposicoes */}
          <Route path="/reposicoes/requisicoes" element={<Requests />} />
          <Route path="/reposicoes/reservas" element={<Floaters />} />
          <Route path="/reposicoes/historico" element={<History />} />

          {/* Estoque */}
          <Route path="/reports/reposicoes" element={<RequestReport />} />
          <Route path="/estoque/produtos" element={<Products />} />
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