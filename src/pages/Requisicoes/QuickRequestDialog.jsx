import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import connect from "../../utils/request";
import { useLoading } from "../../contexts/LoadingContext";
import { useToast } from "../../contexts/ToastContext";

const REASONS = ["AFASTAMENTO", "ATESTADO", "DECLARAÇÃO", "POSTO VAGO", "REMANEJAMENTO", "INJUSTIFICADA", "OUTROS"];
const EMPLOYEE_SEARCH_LIMIT = 50;
const EMPLOYEE_SEARCH_DELAY = 350;

const initialForm = () => ({ supervisor: null, absent: null, reservation: null, center: null, reason: null, warning: null, obs: "", noCoverage: false, date: new Date(), days: 1 });

export function QuickRequestDialog({ visible, onHide, onCreated }) {
  const [options, setOptions] = useState({ supervisors: [], employees: [], reservations: [], centers: [] });
  const [form, setForm] = useState(initialForm);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const setLoading = useLoading();
  const { showToast } = useToast();

  // Carrega apenas os catálogos pequenos ao abrir o diálogo. Funcionários ficam fora
  // deste lote porque a quantidade de registros tornava a abertura da tela muito lenta.
  useEffect(() => {
    if (!visible || options.supervisors.length) return;
    Promise.all([connect.get("/supervisores"), connect.get("/reservas"), connect.get("/centro")])
      .then(([supervisors, reservations, centers]) => setOptions((current) => ({
        supervisors: supervisors.data.map((item) => ({ label: item.nome, value: item.id })),
        employees: current.employees,
        reservations: reservations.data.map((item) => ({ label: item.nome, value: item.id })),
        centers: centers.data.map((item) => ({ label: `${item.id} - ${item.local} - ${item.departamento}`, value: item.id })),
      })))
      .catch(() => showToast("error", "Lançamento rápido", "Não foi possível carregar as opções."));
  }, [visible, options.supervisors.length, showToast]);

  // A busca de funcionários é processada no banco após um pequeno debounce. O limite
  // protege o navegador e o virtual scroller renderiza somente as opções visíveis.
  useEffect(() => {
    if (!visible) return;

    // Impede que uma resposta antiga sobrescreva o resultado de uma busca mais recente.
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setEmployeesLoading(true);
      try {
        const { data } = await connect.get("/funcionarios", {
          params: {
            search: employeeSearch.trim(),
            situacao: 1,
            limit: EMPLOYEE_SEARCH_LIMIT,
          },
        });

        if (!cancelled) {
          setOptions((current) => ({
            ...current,
            employees: data.map((item) => ({
              label: `${item.matricula} - ${item.nome}`,
              value: item.id,
            })),
          }));
        }
      } catch {
        if (!cancelled) showToast("error", "Lançamento rápido", "Não foi possível buscar os colaboradores.");
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    }, EMPLOYEE_SEARCH_DELAY);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [employeeSearch, showToast, visible]);

  // Mirror the full-page request payload so both entry points follow the same API contract.
  const save = async (event) => {
    event.preventDefault();
    if (!form.supervisor || !form.absent || !form.center || !form.reason || (!form.noCoverage && !form.reservation)) {
      return showToast("warn", "Lançamento rápido", "Preencha os campos obrigatórios.");
    }
    // Preserve the current clock time while allowing any absence date in quick creation.
    const date = new Date(form.date);
    const now = new Date();
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

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
      setForm(initialForm());
      setEmployeeSearch("");
      onHide();
      onCreated?.();
    } catch (error) {
      showToast("error", "Lançamento rápido", error.response?.data || "Não foi possível criar a requisição.");
    } finally { setLoading(false); }
  };

  return <Dialog header="Lançamento rápido" visible={visible} modal className="quick-request-dialog" onHide={onHide}>
    <form className="quick-request-form" onSubmit={save}>
      <Dropdown value={form.supervisor} options={options.supervisors} onChange={(e) => setForm({ ...form, supervisor: e.value })} placeholder="Supervisor" filter />
      <Dropdown
        value={form.absent}
        options={options.employees}
        onChange={(e) => setForm({ ...form, absent: e.value })}
        onFilter={(e) => setEmployeeSearch(e.filter)}
        placeholder="Colaborador ausente"
        emptyFilterMessage="Nenhum colaborador encontrado"
        emptyMessage="Digite para buscar colaboradores"
        loading={employeesLoading}
        virtualScrollerOptions={{ itemSize: 42 }}
        filter
      />
      <Dropdown value={form.center} options={options.centers} onChange={(e) => setForm({ ...form, center: e.value })} placeholder="Centro de custo" filter />
      {!form.noCoverage && <Dropdown value={form.reservation} options={options.reservations} onChange={(e) => setForm({ ...form, reservation: e.value })} placeholder="Reserva" filter />}
      <Dropdown value={form.reason} options={REASONS} onChange={(e) => setForm({ ...form, reason: e.value, days: ["ATESTADO", "AFASTAMENTO"].includes(e.value) ? form.days : 1 })} placeholder="Motivo" />
      {form.reason === "INJUSTIFICADA" && <Dropdown value={form.warning} options={["Aplicado", "Não Aplicado"]} onChange={(e) => setForm({ ...form, warning: e.value })} placeholder="Advertência" />}
      {form.reason === "OUTROS" && <InputText value={form.obs} onChange={(e) => setForm({ ...form, obs: e.target.value })} placeholder="Observação" />}
      {["ATESTADO", "AFASTAMENTO"].includes(form.reason) && <InputNumber value={form.days} onValueChange={(e) => setForm({ ...form, days: e.value || 1 })} min={1} max={365} showButtons suffix=" dias" />}
      <Calendar value={form.date} onChange={(e) => e.value && setForm({ ...form, date: e.value })} dateFormat="dd/mm/yy" placeholder="Data da ausência" showIcon readOnlyInput />
      <label className="flex align-items-center gap-2"><Checkbox checked={form.noCoverage} onChange={(e) => setForm({ ...form, noCoverage: e.checked, reservation: e.checked ? null : form.reservation })} />Sem cobertura</label>
      <div className="flex justify-content-end gap-2"><Button type="button" label="Cancelar" text onClick={onHide}/><Button type="submit" label="Criar requisição" icon="pi pi-check"/></div>
    </form>
  </Dialog>;
}
