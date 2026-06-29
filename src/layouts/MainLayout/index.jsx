import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { PanelMenu } from "primereact/panelmenu";
import './main.css'
import { Avatar } from "primereact/avatar";

export function MainLayout() {
  const [displayName, setDisplayName] = useState("");
  const navigate = useNavigate();

  const items = [
    {
      label: 'Dashboards',
      icon: 'pi pi-file',
      items: [
        {
          label: 'New',
          icon: 'pi pi-plus',
          command: () => { }
        },
      ]
    },
    {
      label: "RPA's",
      icon: 'pi pi-verified',
      items: [
        {
          label: 'HK',
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
          command: () => {navigate("/requisicoes")}
        },
        {
          label: 'Histórico',
          icon: 'pi pi-history',
          command: () => {}
        },
      ]
    },
    {
      label: "Estoque",
      icon: 'pi pi-box',
      items: [
        {
          label: 'Itens',
          icon: 'pi pi-list',
          command: () => {}
        },
        {
          label: 'Movimentações',
          icon: 'pi pi-list-check',
          command: () => {}
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
    const dn = localStorage.getItem("display_name");
    const role = localStorage.getItem("role")

    if (dn && role) {
      setDisplayName(dn);
      return;
    };

    return navigate("/");
  }, [navigate]);

  const role = "admin"
  return (
    <div className="flex flex-column" style={{ minHeight: "100dvh", padding: "0px" }}>
      {/* DOCKER */}
      <div className="flex nav shadow-6 px-3 align-items-center justify-content-between">
        <div className="flex">
          <img src="/brands/main_brand.svg" width={200} className="p-5" />
        </div>
        <div className="flex gap-2 align-items-center">
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
        <div className="flex p-2 bg-primary shadow-4 w-15rem flex-column">
          <PanelMenu model={items} className="w-full md:w-20rem mt-5" />
        </div>

        {/* PANEL FRAME */}
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}