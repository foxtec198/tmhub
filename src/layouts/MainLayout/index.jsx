import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { PanelMenu } from "primereact/panelmenu";
import { Avatar } from "primereact/avatar";
import { capitalize, deny_roles, allow_roles } from "../../utils/ui";
import './main.css'

export function MainLayout() {
  
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const deny = deny_roles.includes(role)

  const items = [
    {
      label: 'Dashboards',
      icon: 'pi pi-file',
      items: [
        {
          label: 'Reposições',
          icon: 'pi pi-sync',
          command: () => {navigate("/reports/reposicoes")}
        },
        {
          label: 'Logística',
          icon: 'pi pi-truck',
          command: () => {navigate("/reports/logistica")}
        },
        {
          label: "Novo",
          icon: "pi pi-plus",
          className: role != allow_roles? "hidden" : null
        }
      ]
    },
    {
      label: "RPA Center",
      icon: 'pi pi-verified',
      className: deny ? "hidden" : null,
      items: [
        {
          label: 'HK Bot',
          icon: 'pi pi-clock',
          command: () => {}
        },
      ]
    },
    {
      label: "Reposições",
      icon: 'pi pi-sync',
      items: [
        {
          label: 'Requisições',
          icon: 'pi pi-question',
          command: () => {navigate("/reposicoes/requisicoes")}
        },
        {
          label: 'Histórico',
          icon: 'pi pi-history',
          command: () => {navigate("/reposicoes/historico")}
        },
        {
          label: 'Reservas Tecnicas',
          icon: 'pi pi-users',
          command: () => {navigate("/reposicoes/reservas")}
        },
      ]
    },
    {
      label: "Estoque",
      icon: 'pi pi-box',
      items: [
        {
          label: 'Produtos',
          icon: 'pi pi-list',
          command: () => {navigate("/estoque/produtos")}
        },
        {
          label: 'Movimentações',
          icon: 'pi pi-list-check',
          command: () => {navigate("/estoque/movimentacoes")}
        },
      ]
    },
    {
      label: 'Frotas',
      disabled: "True",
      icon: 'pi pi-car',
      command: () => { navigate("/frotas") }
    },
    {
      label: 'Sair',
      icon: 'pi pi-sign-out',
      command: () => { localStorage.clear(); navigate("/") }
    },
  ];

  useEffect(() => {
    const dn = localStorage.getItem("display_name") || null;
    const rl = localStorage.getItem("role") || null

    if (dn && rl) {
      setDisplayName(dn);
      setRole(capitalize(rl));
      return;
    };

    return navigate("/");
  }, [navigate]);

  return (
    <div className="flex flex-column" style={{ minHeight: "100dvh", padding: "0px" }}>
      {/* DOCKER */}
      <div className="flex nav shadow-6 px-3 align-items-center justify-content-between">
        <a className="cursor-pointer fadein animation-duration-2000" onClick={() => {navigate("/init")}}>
          <img src="/brands/main_brand.svg" width={180} className="p-5" />
        </a>
        <div className="flex gap-2 align-items-center flipup animation-duration-500">
          <div className="flex flex-column text-right">
            <span className="font-bold">{displayName}</span>
            <span className="text-700 font-italic">{role}</span>
          </div>
          <Avatar
            label={displayName[0]}
            shape="circle"
            size="large"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="w-full frame flex gap-2">
        {/* MENU BAR */}
        <div className="flex p-2 bg-primary overflow-x-hidden shadow-4 flex-column">
          <PanelMenu model={items} className="w-full md:w-20rem mt-5" />
        </div>

        {/* PANEL FRAME */}
        <div className="w-full h-full"><Outlet /></div>
      </main>
    </div>
  );
}