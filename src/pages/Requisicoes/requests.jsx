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

// Opção sentinela usada quando a requisição será concluída sem substituto.
const NO_REPLACEMENT_OPTION = [
    { id: 0, nome: "SEM COBERTURA" },
];

const REQUEST_STATUS = {
    pending: { label: "PENDENTE", color: "var(--yellow-600)" },
    updated: { label: "ALTERADA", color: "var(--blue-600)" },
};

function hasValidReplacement(row) {
    // Centraliza a regra de negócio usada nos botões e na representação do status.
    if (row.reserva_id !== undefined && Number(row.reserva_id) === 0) {
        return false;
    }

    const replacement = String(row.reserva || "").trim().toUpperCase();
    return Boolean(replacement) && !["SEM COBERTURA", "SEM INFORMAÇÃO", "NONE", "NULL"].includes(replacement);
}

export function Requests() {
    // Dados da fila, totais de resumo e estado de operações destrutivas.
    const [requests, setRequests] = useState(null);
    const [refresh, setRefresh] = useState(0);

    const [abertas, setAbertas] = useState(0)
    const [emAtraso] = useState(0)
    const [expiradas] = useState(0)
    const [deletingId, setDeletingId] = useState(null)

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
            setRefresh(prev => prev + 1)
        }
        catch (err) { showToast("error", status === "approved" ? "Erro na Aprovação" : "Erro na Reprovação", err.response?.data || "Não foi possível alterar o status.") }
        finally { setLoading(false) }
    }

    const accept = (value) => {
        async function updateReq() {
            try {
                setLoading(true)
                await connect.patch('/repo/request', value)
                setRefresh(prev => prev + 1)
                showToast("success", "Sucesso", "Alteração salva com sucesso!")
            }
            catch (err) { showToast("error", "Erro na requisição", err.response?.data || "Não foi possível atualizar a requisição.") }
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

    async function deleteRequest(row) {
        try {
            setDeletingId(row.id)
            await connect.delete("/repo/request", {
                data: { id: row.id }
            })
            showToast("success", "Requisição excluída", "A requisição foi excluída com sucesso.")
            setRefresh(prev => prev + 1)
        }
        catch (err) {
            showToast("error", "Erro ao excluir requisição", err.response?.data?.message || err.response?.data || "Não foi possível excluir a requisição.")
        }
        finally {
            setDeletingId(null)
        }
    }

    function confirmRequestDeletion(row) {
        confirmDialog({
            header: `Excluir requisição #${row.id}`,
            message: "Essa ação também pode excluir o histórico e a timeline vinculados. Deseja continuar?",
            icon: "pi pi-exclamation-triangle",
            acceptLabel: "Excluir",
            rejectLabel: "Cancelar",
            acceptClassName: "p-button-danger",
            defaultFocus: "reject",
            accept: () => deleteRequest(row),
        })
    }

    // Definição das colunas e ações disponíveis em cada fase da requisição.
    const table_itens = [
        {
            field: "data",
            header: "Data",
            class: "text-truncate",
            body: (row) => new Date(row.data).toLocaleDateString("pt-br")
        },
        {
            field: "status",
            header: "Status",
            body: (row) => {
                const status = REQUEST_STATUS[row.status] || {
                    label: row.status?.toUpperCase() || "DESCONHECIDO",
                    color: "var(--gray-600)",
                };

                return <Tag value={status.label} style={{ background: status.color }} rounded />;
            }
        },
        {
            field: "ausencia",
            header: "Ausente",
            class: "text-truncate",
            body: (row) => {
                return (
                    <div className="flex">
                        <Inplace closable className="text-sm">
                            <InplaceDisplay>{row.ausencia}</InplaceDisplay>

                            <InplaceContent>
                                <DropdownWS
                                    uri="/funcionarios"
                                    fetchAll
                                    className="w-10rem text-truncate"
                                    optionLabel="nome"
                                    onChange={(value) => { confirm("Ausente", { id: row.id, ausente_id: value }) }}
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
                        <Inplace closable className="text-sm">
                            <InplaceDisplay>{row.reserva}</InplaceDisplay>

                            <InplaceContent>
                                <DropdownWS
                                    uri="/reservas"
                                    staticOptions={NO_REPLACEMENT_OPTION}
                                    className="w-10rem text-truncate"
                                    onChange={(value) => { confirm("Reserva", { id: row.id, reserva_id: value }) }}
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
                                    onChange={(centro) => { confirm("Local", { id: row.id, centro_id: centro }) }}
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
                        severity="help"
                        onClick={() => { setStatus(row.id, "reproved") }}
                        data-pr-tooltip="Reprovar Solicitação"
                    />
                    <Button
                        data-pr-tooltip="Aprovar Solicitação"
                        icon="pi pi-check-circle"
                        severity="success"
                        disabled={!hasValidReplacement(row)}
                        title={hasValidReplacement(row) ? "Aprovar solicitação" : "Selecione uma reserva antes de aprovar"}
                        onClick={() => { setStatus(row.id, "approved") }}
                    />
                    <Button
                        icon="pi pi-trash"
                        severity="danger"
                        loading={deletingId === row.id}
                        disabled={deletingId !== null}
                        aria-label={`Excluir requisição ${row.id}`}
                        title="Excluir requisição"
                        onClick={() => confirmRequestDeletion(row)}
                    />
                </ButtonGroup>
            },
        },
    ];

    // Busca a fila novamente depois de qualquer alteração bem-sucedida.
    useEffect(() => {
        async function get_requests() {
            const res = await connect.get("/repo/request?status=pending,updated")
            setAbertas(res.data.length)
            setRequests(res.data)
            console.log(res.data)
        }; get_requests();
    }, [refresh]);

    // Mantém os indicadores superiores sincronizados com a fila carregada.
    useEffect(() => {
        const refreshRequests = () => {
            setRefresh(prev => prev + 1)
        }

        socketio.on("new_request", refreshRequests);
        socketio.on("new_history", refreshRequests);

        return () => {
            socketio.off("new_request", refreshRequests)
            socketio.off("new_history", refreshRequests)
        }
    }, []);

    // Renderiza indicadores, tabela operacional e diálogos de confirmação.
    return (
        <main className="flex flex-column gap-1 p-2">
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
