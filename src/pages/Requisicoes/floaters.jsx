import { useEffect, useState } from "react";
import { FloatPicker } from "../../components/FloatPicker"
import connect from "../../utils/request";
import { Divider } from "primereact/divider";
import { ListBox } from "primereact/listbox";

export function Floaters() {
    const [reservas, setReservas] = useState([]);
    const [todosColaboradores, setTodosColaboradores] = useState([])

    useEffect(() => {
        async function get_all_emps(){
            const res = await connect.get("/funcionarios")
            setTodosColaboradores(res.data)
        }; get_all_emps();
    }, [])

    return (
        <main className="h-full p-2">
            <h2 className="inter flex align-items-center gap-2">
                <i className="pi pi-users"></i>
                Reservas Tecnicas
            </h2>
            <Divider />
            <div className="flex bg-primary h-full w-full p-4 overflow-y-auto" style={{ maxHeight: "75dvh" }}>
                <div className="flex flex-column flex-grow-1 gap-2 w-10rem">
                    {todosColaboradores.map(colaborador => {
                        return (
                            <div 
                                className="flex flex-grow-1d border-round-lg p-2 shadow-6"
                                style={{
                                    background: "ghostwhite",
                                    color: "#333",
                                }}
                            >
                                <span>{colaborador.nome}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="flex flex-column flex-grow-1">
                    .

                </div>
            </div>
        </main>
    )
}