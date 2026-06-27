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
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => { }
    }
  ];

  useEffect(() => {
    const dn = localStorage.getItem("display_name");
    const role = localStorage.getItem("role") || true

    if(dn && role){
      setDisplayName(dn);
      // setRole(role);
      return;
    };

    return navigate("/");
  }, [navigate]);

  const role = "admin"
  return (
    <div className="flex flex-column" style={{ minHeight: "100dvh", padding: "0px" }}>
      {/* DOCKER */}
      <div className="flex nav shadow-6 px-3 align-items-center justify-content-between">
        <img src="/logo.png" width={200} />
        <div className="flex gap-2 align-items-center">
          <span>{displayName}</span>
          <span>{role}</span>
          <Avatar 
            label={displayName[0]}
            shape="circle"
            size="small"
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