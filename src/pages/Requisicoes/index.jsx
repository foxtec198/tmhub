// Widgets
import { Table } from "../../components/tables/Table";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup"
import { Tag } from "primereact/tag";
import { DashCard } from "../../components/Card";

// Utils
import { useEffect, useState } from "react"
import connect from "../../utils/request";
import { socketio } from "../../utils/socketio";
import { useNavigate } from "react-router-dom";

export function Requisicoes() {
    const [requests, setRequests] = useState(null);
    const [refresh, setRefresh] = useState(null);
    const navigate = useNavigate();

    const table_itens = [
        {
            field: "data",
            header: "Data",
            body: (row) => new Date(row.data).toLocaleDateString("pt-br", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })
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
            header: "Advertência",
            body: (row) => {
                const waiting = row.waiting_certificate
                const warning = row.warning

                return <>
                    <Tag
                        severity={waiting ? "warning" : warning ? "info" : "danger"}
                        icon={`pi pi-${waiting ? "hourglass" : warning ? "pencil" : "tag"}`}
                        value={waiting ? "Atestado." : warning ? "Aplicado" : "Não Aplicado"}
                        rounded
                    />
                </>
            }
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
        },
    ];

    useEffect(() => {
        async function get_requests() {
            const res = await connect.get("/repo/request")
            setRequests(res.data)
        };
        get_requests();
    }, [refresh]);

    useEffect(() => {
        socketio.on("new_request", () => { console.info("EMIT RECEBIDO"); setRefresh(prev => !prev) });
    }, []);

    return (
        <main className="flex flex-column gap-3">
            <h2>Requisições</h2>
            <Button
                icon="pi pi-plus"
                size="large"
                className="p-4"
                rounded
                onClick={()=>{navigate("/reposicoes/requisicao")}}
                style={{
                    position: "absolute",
                    right: "20px",
                    bottom: "20px"
                }}
            />
            <div className="flex gap-2 align-items-center">
                <DashCard
                    title="Abertas"
                    className="border-round-lg p-1 spaceg"
                    style={{
                        background: 'var(--green-700)',
                        color: "#fff"
                    }}
                    value={0}
                />
                <DashCard
                    title="Em Atraso"
                    className="border-round-lg p-1 spaceg"
                    style={{
                        background: 'var(--yellow-700)',
                        color: "#fff"
                    }}
                    value={0}
                />
                <DashCard
                    title="Expiradas"
                    className="border-round-lg p-1 spaceg"
                    style={{
                        background: 'var(--red-700)',
                        color: "#fff"
                    }}
                    value={0}
                />
            </div>
            <div className="flex flex-column">
                <Table
                    data={requests}
                    tableClassName="w-full"
                    columns={table_itens}
                />
            </div>
        </main>
    );
};