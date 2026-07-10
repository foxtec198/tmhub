// Widgets
import { Table } from "../../components/tables/Table";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup"
import { Tag } from "primereact/tag";
import { DashCard } from "../../components/Card";
import { Inplace, InplaceDisplay, InplaceContent, } from 'primereact/inplace';
import { DropdownWS } from "../../components/DropdownWithSearch";
import { Toast } from "primereact/toast";
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';

// Utils
import { useEffect, useRef, useState } from "react"
import { socketio } from "../../utils/socketio";
import { useToast } from "../../contexts/ToastContext";
import { useLoading } from "../../contexts/LoadingContext";
import { useNavigate } from "react-router-dom";
import connect from "../../utils/request";

export function Requests() {
    const [requests, setRequests] = useState(null);
    const [refresh, setRefresh] = useState(null);

    const [abertas, setAbertas] = useState(0)
    const [emAtraso, setEmAtraso] = useState(0)
    const [expiradas, setExpiradas] = useState(0)

    const [active, setActive] = useState(false);

    const { showToast } = useToast();
    const setLoading = useLoading();
    const navigate = useNavigate();
    const toast = useRef(null);

    const reasonColors = {
        "AFASTAMENTO": "var(--red-900)",
        "ATESTADO": "var(--green-600)",
        "DECLARAÇÃO": "var(--violet-600)",
        "POSTO VAGO": "var(--red-500)",
        "INJUSTIFICADA": "var(--red-900)",
        "OUTROS": "var(--gray-900)",
    }

    async function setStatus(id, status) {
        try {
            setLoading(true)
            await connect.post("/repo", { id: id, status: status })
            showToast("success", "Sucesso", "Requisilçõ salva com sucesso!")
        }
        catch (err) { showToast("error", status == "approved" ? "Erro na Aprovação" : "Erro na Reprovação", err.reponse.data) }
        finally { setLoading(false) }
    }

    const accept = (value) => {
        async function updateReq() {
            try {
                setLoading(true)
                await connect.patch('/repo/request', value)
                showToast("success", "Sucesso", "Alteração salva com sucesso!")
                setActive(false)
            }
            catch (err) { showToast("error", "Erro na requisição", err.response.data) }
            finally { setLoading(false) }
        }; updateReq();
    }

    const confirm = (campo, value) => {
        confirmDialog({
            message: `Deseja confirmar a alteração?`,
            header: `Troca de ${campo}`,
            icon: 'pi pi-exclamation-triangle',
            defaultFocus: 'accept',
            acceptLabel: "Sim",
            rejectLabel: "Não",
            accept: () => accept(value),
        });
    };

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
                        <Inplace closable className="text-sm" active={active}>
                            <InplaceDisplay>{row.ausencia}</InplaceDisplay>

                            <InplaceContent>
                                <DropdownWS
                                    uri="/funcionarios"
                                    className="w-10rem text-truncate"
                                    optionLabel="nome"
                                    onChange={(value) => {confirm("Ausente", { id: row.id, ausente_id: value }) }}
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
            body: (row) => {
                return (
                    <div className="flex">
                        <Inplace closable className="text-sm" active={active}>
                            <InplaceDisplay>{row.reserva}</InplaceDisplay>

                            <InplaceContent>
                                <DropdownWS
                                    uri="/funcionarios"
                                    className="w-10rem text-truncate"
                                    onChange={(value) => {confirm("Reserva", { id: row.id, reserva_id: value }) }}
                                />
                            </InplaceContent>
                        </Inplace>
                    </div>
                )
            }
        },
        {
            field: "local",
            header: "Local",
            class: "text-truncate",
            body: (row) => {
                return (
                    <div className="flex">
                        <Inplace closable className="text-sm">
                            <InplaceDisplay>{row.local}</InplaceDisplay>

                            <InplaceContent>
                                <DropdownWS
                                    uri="/centro"
                                    className="w-10rem text-truncate"
                                    optionsValuesForDict={{ nome: "local" }}
                                    onChange={(centro) => {confirm("Local", { id: row.id, centro_id: centro }) }}
                                />
                            </InplaceContent>
                        </Inplace>
                    </div>
                )
            }

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
                        onClick={() => { setStatus(row.id, "reproved") }}
                        data-pr-tooltip="Reprovar Solicitação"
                    />
                    <Button
                        data-pr-tooltip="Aprovar Solicitação"
                        icon="pi pi-check-circle"
                        severity="success"
                        onClick={() => { setStatus(row.id, "approved") }}
                    />
                </ButtonGroup>
            },
        },
    ];

    useEffect(() => {
        async function get_requests() {
            const res = await connect.get("/repo/request?status=pending")
            setAbertas(res.data.length)
            setRequests(res.data)
            console.log(res.data)
        }; get_requests();
    }, [refresh]);

    useEffect(() => { socketio.on("new_request", () => setRefresh(prev => !prev)); }, []);

    return (
        <main className="flex flex-column gap-1">
            <Toast ref={toast} />
            <ConfirmDialog />

            <h2 className="inter flex align-items-center gap-2" style={{ color: "var(--green-600)", fontWeight: 900 }}>
                <i className="pi pi-sync"></i>
                Requisições
            </h2>

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
                    search={true}
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