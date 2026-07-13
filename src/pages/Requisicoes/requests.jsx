// Widgets
import { Table } from "../../components/tables/Table";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup"
import { Tag } from "primereact/tag";
import { DashCard } from "../../components/DashCard";
import { Inplace, InplaceDisplay, InplaceContent, } from 'primereact/inplace';
import { DropdownWS } from "../../components/DropdownWithSearch";
import { Toast } from "primereact/toast";
import { confirmDialog } from 'primereact/confirmdialog';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { SpeedDial } from "primereact/speeddial";
import { Dialog } from "primereact/dialog";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { QuickRequestDialog } from "./QuickRequestDialog";
import { RequestImportDialog } from "./RequestImportDialog";
import "./requests.css";

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

function withCurrentTime(value) {
    const date = new Date(value)
    const now = new Date()
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
    return date
}

export function Requests() {
    // Dados da fila, totais de resumo e estado de operações destrutivas.
    const [requests, setRequests] = useState(null);
    const [refresh, setRefresh] = useState(0);

    const [abertas, setAbertas] = useState(0)
    const [emAtraso] = useState(0)
    const [expiradas] = useState(0)
    const [deletingId, setDeletingId] = useState(null)
    const [quickDialog, setQuickDialog] = useState(false)
    const [importDialog, setImportDialog] = useState(false)
    const [usageDialog, setUsageDialog] = useState(false)
    const [usageDate, setUsageDate] = useState(new Date())
    const [reservationUsage, setReservationUsage] = useState({ usadas: [], disponiveis: [] })

    const { showToast } = useToast();
    const setLoading = useLoading();
    const navigate = useNavigate();
    const toast = useRef(null);

    // Blob downloads avoid navigating away from the operational queue.
    const exportRequests = async () => {
        try {
            const { data } = await connect.get("/repo/request/export", { responseType: "blob" })
            const url = URL.createObjectURL(data)
            const anchor = document.createElement("a")
            anchor.href = url
            anchor.download = "requisicoes_abertas.xlsx"
            anchor.click()
            setTimeout(() => URL.revokeObjectURL(url), 0)
        } catch (error) { showToast("error", "Exportação", error.response?.data || "Não foi possível exportar.") }
    }

    // Query a single business day; the backend accounts for multi-day request overlaps.
    const loadReservationUsage = async (date = usageDate) => {
        const value = new Date(date)
        const yyyyMmDd = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
        try {
            const { data } = await connect.get("/repo/reservas-uso", { params: { data: yyyyMmDd } })
            setReservationUsage(data)
        } catch (error) { showToast("error", "Uso das reservas", error.response?.data || "Não foi possível consultar as reservas.") }
    }

    // Quarter-circle actions keep the mobile trigger accessible without covering the table.
    const speedDialItems = [
        { label: "Nova página", icon: "pi pi-external-link", command: () => navigate("/reposicoes/requisicao") },
        { label: "Lançamento rápido", icon: "pi pi-plus-circle", command: () => setQuickDialog(true) },
        { label: "Importar planilha", icon: "pi pi-upload", command: () => setImportDialog(true) },
        { label: "Exportar planilha", icon: "pi pi-file-excel", command: exportRequests },
        { label: "Uso diário das reservas", icon: "pi pi-calendar", command: () => { setUsageDialog(true); loadReservationUsage() } },
    ]

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
            body: (row) => <Inplace closable><InplaceDisplay>{new Date(row.data).toLocaleDateString("pt-br")}</InplaceDisplay><InplaceContent><Calendar value={new Date(row.data)} onChange={(e) => e.value && confirm("Data", { id: row.id, data: withCurrentTime(e.value) })} dateFormat="dd/mm/yy" showIcon /></InplaceContent></Inplace>
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
                                    className="w-10rem text-truncate"
                                    optionLabel="nome"
                                    onChange={(value) => { confirm("Ausente", { id: row.id, ausente_id: value }) }}
                                    fetchAll
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
            header: "Dias",
            field: "quantidade_dias",
            body: (row) => ["ATESTADO", "AFASTAMENTO"].includes(row.motivo)
                ? <Inplace closable><InplaceDisplay>{row.quantidade_dias || 1}</InplaceDisplay><InplaceContent><InputNumber value={row.quantidade_dias || 1} min={1} max={365} showButtons onValueChange={(e) => e.value && confirm("Duração", { id: row.id, quantidade_dias: e.value })} /></InplaceContent></Inplace>
                : "—",
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
            <p className="mt-0 mb-3 text-secondary">Acompanhe as reposições abertas, atualize os dados e acesse rapidamente novos lançamentos e relatórios.</p>

            <div className="requests-speed-dial"><SpeedDial model={speedDialItems} type="quarter-circle" direction="up-left" radius={132} showIcon="pi pi-plus" hideIcon="pi pi-times" /></div>

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
            <QuickRequestDialog visible={quickDialog} onHide={() => setQuickDialog(false)} onCreated={() => setRefresh((value) => value + 1)} />
            <RequestImportDialog visible={importDialog} onHide={() => setImportDialog(false)} onImported={() => setRefresh((value) => value + 1)} />
            <Dialog header="Uso diário das reservas" visible={usageDialog} modal className="reserve-usage-dialog" onHide={() => setUsageDialog(false)}>
                <Calendar value={usageDate} onChange={(e) => { if (e.value) { setUsageDate(e.value); loadReservationUsage(e.value) } }} dateFormat="dd/mm/yy" showIcon readOnlyInput />
                <div className="reserve-usage-grid">
                    <section><h3>Usadas ({reservationUsage.usadas.length})</h3><div className="reserve-usage-list">{reservationUsage.usadas.length ? reservationUsage.usadas.map((item) => <div className="reserve-usage-item" key={item.id}><strong>{item.nome}</strong><span>{item.matricula}</span></div>) : <span className="reserve-usage-empty">Nenhuma reserva usada nesta data.</span>}</div></section>
                    <section><h3>Disponíveis ({reservationUsage.disponiveis.length})</h3><div className="reserve-usage-list">{reservationUsage.disponiveis.length ? reservationUsage.disponiveis.map((item) => <div className="reserve-usage-item" key={item.id}><strong>{item.nome}</strong><span>{item.matricula}</span></div>) : <span className="reserve-usage-empty">Nenhuma reserva disponível nesta data.</span>}</div></section>
                </div>
            </Dialog>
        </main>
    );
};
