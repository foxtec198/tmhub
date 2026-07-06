// Widgets
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

// Utils
import { useEffect, useState } from "react";
import { useLoading } from "../../contexts/LoadingContext";
import connect from "../../utils/request";

// Login and UI (uiiii)
export function Floaters() {
    const [reservas, setReservas] = useState([]);
    const [todosColaboradores, setTodosColaboradores] = useState([])
    const setLoading = useLoading();

    useEffect(() => {
        async function get_all_emps() {
            setLoading(true)
            try {
                const res = await connect.get("/funcionarios?situacao=1")
                setTodosColaboradores(res.data)
            } catch (erro) { showToast("erro", "Erro na consulta", erro.response.data) }
            finally { setLoading(false) }
        }; get_all_emps();
    }, [])

    return (
        <main className="h-full p-2">
            <h2 className="inter flex align-items-center gap-2">
                <i className="pi pi-users"></i>
                Reservas Tecnicas
            </h2>
            <div className="flex h-full w-full p-4" style={{ maxHeight: "75dvh" }}>
                <div className="flex flex-column flex-grow-1 gap-2 p-2 overflow-y-auto">
                    {todosColaboradores.map(colaborador => {
                        const data = new Date(colaborador.data_admissao)

                        return (
                            <div
                                key={colaborador.id}
                                className="flex flex-grow-1 justify-content-between align-items-center border-round-lg p-2 shadow-5"
                                style={{
                                    background: "ghostwhite",
                                    color: "#333",
                                }}
                            >
                                <div className="flex flex-column">
                                    <div className="flex gap-2">
                                        <span className="inter font-bold">{colaborador.nome}</span>
                                        <span className="inter">{data.toLocaleDateString("pt-br", { day: "2-digit", month: "2-digit", year: "2-digit" })}</span>
                                    </div>
                                    <div className="flex gap-2 align-items-center">
                                        <Tag
                                            className="text-truncate bg-primary"
                                            rounded
                                        >
                                            {colaborador.cargo}
                                        </Tag>
                                        <Tag
                                            className="text-truncate"
                                            rounded
                                        >
                                            {colaborador.situacao.toUpperCase()}
                                        </Tag>
                                    </div>
                                </div>
                                <Button
                                    className="bg-primary"
                                    icon="pi pi-caret-right"
                                />
                            </div>
                        )
                    })}
                </div>
                <Divider layout="vertical" align="center">
                    <i className="pi pi-arrows-h p-2 border-circle bg-primary"></i>
                </Divider>
                <div className="flex flex-column flex-grow-1">
                    .

                </div>
            </div>
        </main>
    )
}