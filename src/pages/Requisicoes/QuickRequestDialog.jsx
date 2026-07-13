import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { SelectButton } from "primereact/selectbutton";
import connect from "../../utils/request";
import { useLoading } from "../../contexts/LoadingContext";
import { useToast } from "../../contexts/ToastContext";

const REASONS = ["AFASTAMENTO", "ATESTADO", "DECLARAÇÃO", "POSTO VAGO", "REMANEJAMENTO", "INJUSTIFICADA", "OUTROS"];
const DATE_OPTIONS = [{ label: "Hoje", value: "today" }, { label: "Amanhã", value: "tomorrow" }];

export function QuickRequestDialog({ visible, onHide, onCreated }) {
  const [options, setOptions] = useState({ supervisors: [], employees: [], reservations: [], centers: [] });
  const [form, setForm] = useState({ supervisor: null, absent: null, reservation: null, center: null, reason: null, warning: null, obs: "", noCoverage: false, date: "today", days: 1 });
  const setLoading = useLoading();
  const { showToast } = useToast();

  // Load selectors lazily and cache them while the quick-create dialog remains mounted.
  useEffect(() => {
    if (!visible || options.supervisors.length) return;
    Promise.all([connect.get("/supervisores"), connect.get("/funcionarios"), connect.get("/reservas"), connect.get("/centro")])
      .then(([supervisors, employees, reservations, centers]) => setOptions({
        supervisors: supervisors.data.map((item) => ({ label: item.nome, value: item.id })),
        employees: employees.data.map((item) => ({ label: item.nome, value: item.id })),
        reservations: reservations.data.map((item) => ({ label: item.nome, value: item.id })),
        centers: centers.data.map((item) => ({ label: `${item.id} - ${item.local} - ${item.departamento}`, value: item.id })),
      }))
      .catch(() => showToast("error", "Lançamento rápido", "Não foi possível carregar as opções."));
  }, [visible, options.supervisors.length, showToast]);

  // Mirror the full-page request payload so both entry points follow the same API contract.
  const save = async (event) => {
    event.preventDefault();
    if (!form.supervisor || !form.absent || !form.center || !form.reason || (!form.noCoverage && !form.reservation)) {
      return showToast("warn", "Lançamento rápido", "Preencha os campos obrigatórios.");
    }
    const date = new Date();
    if (form.date === "tomorrow") date.setDate(date.getDate() + 1);

    setLoading(true);
    try {
      await connect.post("/repo/request", {
        supervisor_id: form.supervisor,
        ausente_id: form.absent,
        reserva_id: form.noCoverage ? 0 : form.reservation,
        centro_id: form.center,
        motivo: form.reason,
        advertencia: form.warning,
        obs: form.obs,
        data: date,
        quantidade_dias: ["ATESTADO", "AFASTAMENTO"].includes(form.reason) ? form.days : 1,
      });
      showToast("success", "Lançamento rápido", "Requisição criada com sucesso.");
      setForm({ supervisor: null, absent: null, reservation: null, center: null, reason: null, warning: null, obs: "", noCoverage: false, date: "today", days: 1 });
      onHide();
      onCreated?.();
    } catch (error) {
      showToast("error", "Lançamento rápido", error.response?.data || "Não foi possível criar a requisição.");
    } finally { setLoading(false); }
  };

  return <Dialog header="Lançamento rápido" visible={visible} modal className="quick-request-dialog" onHide={onHide}>
    <form className="quick-request-form" onSubmit={save}>
      <Dropdown value={form.supervisor} options={options.supervisors} onChange={(e) => setForm({ ...form, supervisor: e.value })} placeholder="Supervisor" filter />
      <Dropdown value={form.absent} options={options.employees} onChange={(e) => setForm({ ...form, absent: e.value })} placeholder="Colaborador ausente" filter />
      <Dropdown value={form.center} options={options.centers} onChange={(e) => setForm({ ...form, center: e.value })} placeholder="Centro de custo" filter />
      {!form.noCoverage && <Dropdown value={form.reservation} options={options.reservations} onChange={(e) => setForm({ ...form, reservation: e.value })} placeholder="Reserva" filter />}
      <Dropdown value={form.reason} options={REASONS} onChange={(e) => setForm({ ...form, reason: e.value, days: ["ATESTADO", "AFASTAMENTO"].includes(e.value) ? form.days : 1 })} placeholder="Motivo" />
      {form.reason === "INJUSTIFICADA" && <Dropdown value={form.warning} options={["Aplicado", "Não Aplicado"]} onChange={(e) => setForm({ ...form, warning: e.value })} placeholder="Advertência" />}
      {form.reason === "OUTROS" && <InputText value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Observação" />}
      {["ATESTADO", "AFASTAMENTO"].includes(form.reason) && <InputNumber value={form.days} onValueChange={(e) => setForm({ ...form, days: e.value || 1 })} min={1} max={365} showButtons suffix=" dias" />}
      <SelectButton value={form.date} options={DATE_OPTIONS} onChange={(e) => e.value && setForm({ ...form, date: e.value })} allowEmpty={false} />
      <label className="flex align-items-center gap-2"><Checkbox checked={form.noCoverage} onChange={(e) => setForm({ ...form, noCoverage: e.checked, reservation: e.checked ? null : form.reservation })} />Sem cobertura</label>
      <div className="flex justify-content-end gap-2"><Button type="button" label="Cancelar" text onClick={onHide}/><Button type="submit" label="Criar requisição" icon="pi pi-check"/></div>
    </form>
  </Dialog>;
}
