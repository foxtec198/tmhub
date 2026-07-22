import { useEffect, useMemo, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Tag } from "primereact/tag";
import connect from "../../utils/request";
import { socketio } from "../../utils/socketio";
import { useLoading } from "../../contexts/LoadingContext";
import { useToast } from "../../contexts/ToastContext";
import "./styles.css";

const REASONS = ["ATESTADO", "AFASTAMENTO", "DECLARAÇÃO", "INJUSTIFICADA", "POSTO VAGO", "REMANEJAMENTO", "OUTROS"];
const CLASSIFICATIONS = [
  { label: "Justificada", value: "justificada" },
  { label: "Injustificada", value: "injustificada" },
];

function remaining(deadline, now) {
  if (!deadline) return null;
  const milliseconds = new Date(deadline).getTime() - now;
  if (milliseconds <= 0) return { expired: true, text: "Prazo esgotado" };
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  return { expired: false, text: `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min` };
}

export function AbsenceControl() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pendente");
  const [classificationFilter, setClassificationFilter] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [now, setNow] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const setLoading = useLoading();
  const { showToast } = useToast();

  useEffect(() => {
    connect.get("/controle-faltas")
      .then(({ data }) => { setRecords(Array.isArray(data) ? data : []); setNow(Date.now()); })
      .catch((error) => showToast("error", "Controle de Faltas", error.response?.data || "Não foi possível carregar os registros."));
  }, [refresh, showToast]);

  useEffect(() => {
    const timer = window.setInterval(() => { setNow(Date.now()); setRefresh((value) => value + 1); }, 60_000);
    const reload = () => setRefresh((value) => value + 1);
    socketio.on("absence_control_update", reload);
    socketio.on("new_request", reload);
    return () => { window.clearInterval(timer); socketio.off("absence_control_update", reload); socketio.off("new_request", reload); };
  }, []);

  const summary = useMemo(() => records.reduce((result, record) => {
    result.total += 1;
    if (record.status === "tratada") result.treated += 1;
    else result.pending += 1;
    if (record.status === "pendente" && record.motivo?.includes("ATESTADO") && remaining(record.prazo_atestado, now)?.expired) result.expired += 1;
    return result;
  }, { total: 0, pending: 0, expired: 0, treated: 0 }), [records, now]);

  const filtered = useMemo(() => records.filter((record) => {
    const term = search.trim().toLowerCase();
    if (statusFilter && record.status !== statusFilter) return false;
    if (classificationFilter && record.classificacao !== classificationFilter) return false;
    return !term || [record.colaborador, record.matricula, record.contrato, record.supervisor, record.motivo]
      .some((value) => String(value || "").toLowerCase().includes(term));
  }), [records, search, statusFilter, classificationFilter]);

  const open = (record) => {
    setEditing(record);
    setForm({
      motivo: record.motivo,
      data_falta: new Date(record.data_falta),
      classificacao: record.classificacao === "em_analise" ? null : record.classificacao,
      observacao: record.observacao || "",
    });
  };

  const save = async (treated = false) => {
    if (treated && !form.classificacao) return showToast("warn", "Tratativa", "Informe se a falta foi justificada ou injustificada.");
    setLoading(true);
    try {
      await connect.patch("/controle-faltas", {
        id: editing.id,
        motivo: form.motivo,
        data_falta: form.data_falta,
        classificacao: form.classificacao,
        observacao: form.observacao,
        status: treated ? "tratada" : undefined,
      });
      setEditing(null);
      setRefresh((value) => value + 1);
      showToast("success", "Controle de Faltas", treated ? "Falta tratada com sucesso." : "Registro atualizado.");
    } catch (error) {
      showToast("error", "Não foi possível salvar", error.response?.data || "Confira os dados informados.");
    } finally { setLoading(false); }
  };

  const timerBody = (record) => {
    if (!record.motivo?.includes("ATESTADO") || record.status === "tratada") return <span className="absence-no-timer">Sem prazo</span>;
    const timer = remaining(record.prazo_atestado, now);
    return <span className={`absence-timer ${timer?.expired ? "is-expired" : ""}`}><i className={`pi ${timer?.expired ? "pi-exclamation-triangle" : "pi-clock"}`} />{timer?.text || "—"}</span>;
  };

  const classificationBody = (record) => {
    const config = record.classificacao === "justificada"
      ? { label: "JUSTIFICADA", severity: "success" }
      : record.classificacao === "injustificada"
        ? { label: "INJUSTIFICADA", severity: "danger" }
        : { label: "EM ANÁLISE", severity: "warning" };
    return <Tag value={config.label} severity={config.severity} />;
  };

  return <section className="absence-page">
    <header className="absence-header"><div><span>Gestão de ponto</span><h1>Controle de Faltas</h1><p>Registros gerados automaticamente pelas requisições de reposição.</p></div><Button icon="pi pi-refresh" label="Atualizar" outlined onClick={() => setRefresh((value) => value + 1)} /></header>
    <div className="absence-summary">
      <article><i className="pi pi-list" /><div><small>Total</small><strong>{summary.total}</strong></div></article>
      <article><i className="pi pi-inbox" /><div><small>Pendentes</small><strong>{summary.pending}</strong></div></article>
      <article className="is-danger"><i className="pi pi-stopwatch" /><div><small>Atestados vencidos</small><strong>{summary.expired}</strong></div></article>
      <article><i className="pi pi-check-circle" /><div><small>Tratadas</small><strong>{summary.treated}</strong></div></article>
    </div>
    <div className="absence-panel">
      <div className="absence-filters">
        <span className="p-input-icon-left"><i className="pi pi-search" /><InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar colaborador, matrícula ou contrato" /></span>
        <Dropdown value={statusFilter} options={[{ label: "Todas", value: null }, { label: "Pendentes", value: "pendente" }, { label: "Tratadas", value: "tratada" }]} onChange={(event) => setStatusFilter(event.value)} placeholder="Status" />
        <Dropdown value={classificationFilter} options={[{ label: "Todas", value: null }, ...CLASSIFICATIONS, { label: "Em análise", value: "em_analise" }]} onChange={(event) => setClassificationFilter(event.value)} placeholder="Classificação" />
      </div>
      <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10, 25, 50, 100]} stripedRows emptyMessage="Nenhuma falta encontrada." dataKey="id" size="small">
        <Column field="data_falta" header="Data" sortable body={(record) => new Date(record.data_falta).toLocaleDateString("pt-BR")} />
        <Column field="colaborador" header="Colaborador" sortable body={(record) => <div className="absence-person"><strong>{record.colaborador}</strong><small>Matrícula {record.matricula}</small></div>} />
        <Column field="contrato" header="Contrato" sortable body={(record) => <div className="absence-person"><strong>{record.contrato}</strong><small>DPTO. {record.departamento ?? "—"}</small></div>} />
        <Column field="motivo" header="Motivo" sortable />
        <Column header="Prazo do atestado" body={timerBody} />
        <Column header="Classificação" field="classificacao" sortable body={classificationBody} />
        <Column field="status" header="Tratativa" sortable body={(record) => <Tag value={record.status === "tratada" ? "TRATADA" : "PENDENTE"} severity={record.status === "tratada" ? "success" : "info"} />} />
        <Column header="Ações" body={(record) => <Button icon="pi pi-pencil" rounded text aria-label={`Tratar falta de ${record.colaborador}`} onClick={() => open(record)} />} />
      </DataTable>
    </div>

    <Dialog header={`Tratativa da falta · ${editing?.colaborador || ""}`} visible={Boolean(editing)} modal className="absence-dialog" onHide={() => setEditing(null)}>
      {editing && <div className="absence-form">
        <div className="absence-context"><strong>{editing.contrato}</strong><span>{editing.supervisor} · Requisição #{editing.requisicao_id}</span></div>
        <label>Motivo</label><Dropdown value={form.motivo} options={REASONS} onChange={(event) => setForm({ ...form, motivo: event.value })} />
        <label>Data da falta</label><Calendar value={form.data_falta} onChange={(event) => setForm({ ...form, data_falta: event.value })} dateFormat="dd/mm/yy" showIcon />
        <label>Classificação final</label><Dropdown value={form.classificacao} options={CLASSIFICATIONS} onChange={(event) => setForm({ ...form, classificacao: event.value })} placeholder="Justificada ou injustificada" />
        <label>Observação da tratativa</label><InputTextarea value={form.observacao} onChange={(event) => setForm({ ...form, observacao: event.target.value })} rows={4} autoResize />
        {editing.tratado_por && <small>Última tratativa por {editing.tratado_por} em {new Date(editing.tratado_em).toLocaleString("pt-BR")}.</small>}
        <div className="dialog-actions"><Button label="Cancelar" text onClick={() => setEditing(null)} /><Button label="Salvar alterações" outlined onClick={() => save(false)} /><Button label="Marcar como tratada" icon="pi pi-check" onClick={() => save(true)} /></div>
      </div>}
    </Dialog>
  </section>;
}
