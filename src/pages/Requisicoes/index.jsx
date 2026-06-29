// Widgets
import { Table } from "../../components/tables/Table";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup"

// Utils
import { useEffect, useState } from "react"
import connect from "../../utils/request";
import { socketio } from "../../utils/socketio";

export function Requisicoes() {
    const [requests, setRequests] = useState(null);
    const [refresh, setRefresh] = useState(null);

    socketio.on("new_request", ()=> setRefresh(prev => !prev))
    
    const table_itens = [
        {
            field: "data",
            header: "Data",
            body: (row) => new Date(row.data).toLocaleDateString("pt-br")
        },
        {
            field: "ausencia",
            header: "Ausência",
            class: "text-truncate",
        },
        {
            field: "reserva",
            header: "Reserva Sol.",
            class: "text-truncate",
        },
        {
            field: "local",
            header: "Local",
            class: "text-truncate",
        },
        {
            field: "supervisor",
            header: "Supervisor",
            class: "text-truncate",
        },
        {
            field: "status",
            header: "Medida"
        },
        {
            header: "Ações",
            body: (row) => {
                return <ButtonGroup>
                    <Button
                        icon="pi pi-times"
                        severity="danger"
                        onClick={(e) => { row }}
                        data-pr-tooltip="Reprovar Solicitação"
                        />
                    <Button
                        data-pr-tooltip="Aprovar Solicitação"
                        icon="pi pi-check-circle"
                        severity="success"
                        onClick={(e) => { row }}
                    />
                </ButtonGroup>
            },
            // style: { width: "80px" }
        },
    ];

    useEffect(() => {
        async function get_requests() {
            const res = await connect.get("/repo/request")
            setRequests(res.data)
        };
        get_requests();
    }, [refresh]);

    return (
        <>
            <h2>Requisições</h2>
            <div className="flex">
                <Table
                    data={requests}
                    tableClassName="w-full"
                    columns={table_itens}
                />
            </div>
        </>
    );
};