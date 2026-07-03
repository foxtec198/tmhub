// Widgets
import { Table } from "../../components/tables/Table";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup"
import { Tag } from "primereact/tag";
import { DashCard } from "../../components/Card";
import { Inplace, InplaceDisplay, InplaceContent, } from 'primereact/inplace';
import { InputText } from "primereact/inputtext";

// Utils
import { useEffect, useState } from "react"
import connect from "../../utils/request";
import { socketio } from "../../utils/socketio";
import { useNavigate } from "react-router-dom";


export function Requests() {
    const [requests, setRequests] = useState(null);
    const [refresh, setRefresh] = useState(null);
    const [reserva, setReserva] = useState("");

    const navigate = useNavigate();
    const reasonColors = {
        "AFASTAMENTO": "var(--red-900)",
        "ATESTADO": "var(--red-200)",
        "DECLARAÇÃO": "var(--pink-400)",
        "POSTO VAGO": "var(--gray-500)",
        "INJUSTIFICADA": "var(--red-900)",
    }


    const table_itens = [
        {
            field: "data",
            header: "Data",
            class: "text-truncate",
            body: (row) => new Date(row.data).toLocaleDateString("pt-br", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })
        },
        {
            field: "ausencia",
            header: "Ausente",
            class: "text-truncate",
            body: (row) => {
                return (
                    <Inplace>
                        <InplaceDisplay>{row.ausencia}</InplaceDisplay>

                        <InplaceContent>
                            <InputText
                                className="w-full"
                            />
                        </InplaceContent>
                    </Inplace>
                )
            }
        },
        {
            field: "reserva",
            header: "Reserva",
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
            header: "Motivos",
            body: (row) => {
                return <>
                    <Tag
                        value={row.motivo}
                        style={{
                            background: reasonColors[row.motivo]
                        }}
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
        socketio.on("new_request", () => setRefresh(prev => !prev));
    }, []);

    return (
        <main className="flex flex-column gap-3">
            <h2>Requisições</h2>
            <Button
                icon="pi pi-plus"
                size="large"
                className="p-4"
                rounded
                onClick={() => navigate("/reposicoes/requisicao")}
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
            <div className="flex flex-column overflow-auto h-full">
                <Table
                    data={requests}
                    tableClassName="w-full h-full"
                    style={{
                        width: "100%",
                        height: "100dvh"
                    }}
                    columns={table_itens}
                />
            </div>
        </main>
    );
};