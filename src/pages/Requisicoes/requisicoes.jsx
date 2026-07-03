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

    const [abertas, setAbertas] = useState(0)
    const [emAtraso, setEmAtraso] = useState(0)
    const [expiradas, setExpiradas] = useState(0)

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
            body: (row) => new Date(row.data).toLocaleDateString("pt-br")
        },
        {
            field: "ausencia",
            header: "Ausente",
            class: "text-truncate",
            body: (row) => {
                return (
                    <div className="flex">
                        <Inplace closable>
                            <InplaceDisplay>{row.ausencia}</InplaceDisplay>

                            <InplaceContent>
                                <InputText
                                    className="w-min"
                                />
                                <Button
                                    icon="pi pi-check"
                                />
                            </InplaceContent>
                        </Inplace>
                    </div>
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
                return <ButtonGroup className="flex">
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
            console.log(
            )
            setAbertas(res.data.length)

            res.data.filter(item => {
                const date = new Date(item.data);
                const today = new Date()
                if (date > today) {
                    const hour = date.toLocaleTimeString("pt-br", { hour: "numeric" })
                    const hour2 = today.toLocaleTimeString("pt-br", { hour: "numeric" })

                    console.log(
                        hour, hour2, item
                    )
                }
            })

            setEmAtraso(res.data.filter(item => new Date(item.data).getDate() > new Date().getDate()).length)

            setRequests(res.data)
        }; get_requests();
    }, [refresh]);

    useEffect(() => { socketio.on("new_request", () => setRefresh(prev => !prev)); }, []);

    return (
        <main className="flex flex-column gap-1">
            <h2 className="spaceg">Requisições</h2>

            <Button 
                icon="pi pi-plus"
                size="large"
                className="p-4 btn-float"
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
                    className="border-round-lg p-1 spaceg flex-grow-1"
                    style={{
                        background: 'var(--green-700)',
                        color: "#fff"
                    }}
                    value={abertas}
                />
                <DashCard
                    title="Em Atraso"
                    className="border-round-lg p-1 spaceg flex-grow-1"
                    style={{
                        background: 'var(--yellow-700)',
                        color: "#fff"
                    }}
                    value={emAtraso}
                />
                <DashCard
                    title="Expiradas"
                    className="border-round-lg p-1 spaceg flex-grow-1"
                    style={{
                        background: 'var(--red-700)',
                        color: "#fff"
                    }}
                    value={expiradas}
                />
            </div>
            <div className="flex flex-column overflow-auto h-full">
                <Table
                    data={requests}
                    tableClassName="w-full h-full"
                    rows={5}
                    style={{
                        width: "100%",
                        height: "100dvh",
                        fontSize: "12px  "
                    }}
                    columns={table_itens}
                    setRefresh={setRefresh}
                />
            </div>
        </main>
    );
};