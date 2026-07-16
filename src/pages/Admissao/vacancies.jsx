import './vacancies.css';

// Widgets
import { Accordion, AccordionTab } from 'primereact/accordion';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { SelectButton } from 'primereact/selectbutton';
import { FloatLabel } from 'primereact/floatlabel';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DashCard } from '../../components/DashCard';

// Utils
import { useEffect, useMemo, useRef, useState } from 'react';
import connect from '../../utils/request';
import { useLoading } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';

const VACANCIES_ENDPOINT = '/admissao/vagas';

const STATUS_OPTIONS = [
    { value: 'aberta', label: 'Aberta', color: 'var(--gray-600)' },
    { value: 'entrevista', label: 'Entrevista', color: 'var(--blue-600)' },
    { value: 'certidoes_tj', label: 'Certidões TJ', color: 'var(--purple-600)' },
    { value: 'aguardando_aso', label: 'Aguardando ASO', color: 'var(--yellow-700)' },
    { value: 'unico', label: 'Único', color: 'var(--cyan-700)' },
    { value: 'concluido', label: 'Concluído', color: 'var(--green-700)' },
];

const MOTIVO_OPTIONS = [
    'PEDIDO DE DEMISSÃO',
    'DEMISSÃO SEM JUSTA CAUSA',
    'DEMISSÃO COM JUSTA CAUSA',
    'FIM DE CONTRATO DE EXPERIÊNCIA',
    'ABANDONO DE EMPREGO',
    'APOSENTADORIA',
    'OUTROS',
];

const orderOptions = [
    { label: 'Mais recentes', value: 'desc' },
    { label: 'Mais antigas', value: 'asc' },
];

// Uma fábrica garante que cada abertura do diálogo receba a data atual,
// em vez de reutilizar a data criada quando o módulo foi carregado.
const createEmptyForm = () => ({
    matricula: '',
    colaborador: '',
    colaborador_entrada: '',
    data_aviso: new Date(),
    departamento: '',
    centro_custo: '',
    funcao: '',
    carga_horaria: '',
    horario_trabalho: '',
    motivo_saida: '',
});

// Envia apenas o dia civil para que conversões de fuso não alterem a data escolhida.
function toApiDate(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Aceita tanto o formato ISO do banco quanto o formato HTTP serializado pelo Flask.
function formatDateOnly(value) {
    if (!value) return '-';

    const isoDate = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-br');
}

function InfoField({ label, value }) {
    return (
        <div className="vaga-info-field">
            <span>{label}</span>
            <span>{value || '-'}</span>
        </div>
    );
}

function VagaHeader({ vaga }) {
    return (
        <div className="flex align-items-center justify-content-between w-full pr-2 flex-wrap gap-2">
            <div className="flex flex-column">
                <span className="font-bold">{vaga.colaborador_entrada || 'Novo colaborador não definido'}</span>
                <span className="text-500 text-sm">Substitui {vaga.colaborador} • {vaga.departamento} • {vaga.centro_custo}</span>
            </div>
            <span className="text-500 text-sm">Saiu em {new Date(vaga.created_at).toLocaleDateString('pt-br')}</span>
        </div>
    );
}

function VagaItem({ vaga, onUpdate, onDelete }) {
    const [status, setStatus] = useState(vaga.status);
    const [entrevistador, setEntrevistador] = useState(vaga.entrevistador || '');
    const [entrevistaDia, setEntrevistaDia] = useState(vaga.entrevista_data ? new Date(vaga.entrevista_data) : null);
    const [entrevistaHora, setEntrevistaHora] = useState(vaga.entrevista_data ? new Date(vaga.entrevista_data) : null);
    const [showInterviewForm, setShowInterviewForm] = useState(false);
    const { showToast } = useToast();

    function handleStatusSelect(newStatus) {
        setStatus(newStatus);

        if (newStatus === 'entrevista' && !(vaga.entrevistador && vaga.entrevista_data)) {
            setShowInterviewForm(true);
            return;
        }

        setShowInterviewForm(false);
        onUpdate(vaga.id, { status: newStatus });
    }

    function confirmInterview() {
        if (!entrevistador) {
            showToast('warn', 'Atenção!', 'Informe quem vai realizar a entrevista.');
            return;
        }

        if (!entrevistaDia) {
            showToast('warn', 'Atenção!', 'Selecione o dia da entrevista.');
            return;
        }

        if (!entrevistaHora) {
            showToast('warn', 'Atenção!', 'Selecione o horário da entrevista.');
            return;
        }

        const dataHora = new Date(entrevistaDia);
        dataHora.setHours(entrevistaHora.getHours(), entrevistaHora.getMinutes(), 0, 0);

        onUpdate(vaga.id, { status: 'entrevista', entrevistador, entrevista_data: dataHora });
        setShowInterviewForm(false);
    }

    return (
        <div className="flex flex-column gap-3 p-2">
            <div className="vaga-info-grid">
                <InfoField label="Matrícula" value={vaga.matricula} />
                <InfoField label="Colaborador" value={vaga.colaborador} />
                <InfoField label="Novo colaborador" value={vaga.colaborador_entrada} />
                <InfoField label="Data do aviso/envio do currículo" value={formatDateOnly(vaga.data_aviso)} />
                <InfoField label="Departamento" value={vaga.departamento} />
                <InfoField label="Centro de Custo" value={vaga.centro_custo} />
                <InfoField label="Função" value={vaga.funcao} />
                <InfoField label="Carga Horária" value={vaga.carga_horaria} />
                <InfoField label="Horário de Trabalho" value={vaga.horario_trabalho} />
                <InfoField label="Motivo da Saída" value={vaga.motivo_saida} />
                {vaga.entrevistador && <InfoField label="Entrevistadora" value={vaga.entrevistador} />}
                {vaga.entrevista_data && <InfoField label="Data da Entrevista" value={new Date(vaga.entrevista_data).toLocaleString('pt-br')} />}
            </div>

            <div className="flex gap-3 align-items-center flex-wrap">
                <FloatLabel>
                    <Dropdown
                        id={`status-${vaga.id}`}
                        className="w-15rem"
                        value={status}
                        onChange={(e) => handleStatusSelect(e.value)}
                        options={STATUS_OPTIONS}
                        optionLabel="label"
                        optionValue="value"
                    />
                    <label htmlFor={`status-${vaga.id}`}>Status da vaga</label>
                </FloatLabel>

                <Button icon="pi pi-trash" text rounded severity="danger" tooltip="Excluir vaga" onClick={() => onDelete(vaga)} />
            </div>

            {showInterviewForm && (
                <form
                    className="interview-box flex flex-column gap-3 p-3 border-round-lg"
                    onSubmit={(e) => { e.preventDefault(); confirmInterview(); }}
                >
                    <div className="flex align-items-center gap-2">
                        <i className="pi pi-calendar-plus" style={{ color: 'var(--primary-color-dark)' }}></i>
                        <span className="font-bold">Agendar entrevista</span>
                    </div>

                    <FloatLabel>
                        <InputText
                            id={`entrevistador-${vaga.id}`}
                            className="w-full"
                            value={entrevistador}
                            onChange={(e) => setEntrevistador(e.target.value)}
                        />
                        <label htmlFor={`entrevistador-${vaga.id}`}>Quem vai realizar a entrevista</label>
                    </FloatLabel>

                    <div className="flex gap-3">
                        <FloatLabel className="w-full">
                            <Calendar
                                id={`dia-${vaga.id}`}
                                className="w-full"
                                value={entrevistaDia}
                                onChange={(e) => setEntrevistaDia(e.value)}
                                dateFormat="dd/mm/yy"
                                locale="pt-BR"
                                minDate={new Date()}
                                showIcon
                                readOnlyInput
                            />
                            <label htmlFor={`dia-${vaga.id}`}>Dia</label>
                        </FloatLabel>

                        <FloatLabel className="w-full">
                            <Calendar
                                id={`hora-${vaga.id}`}
                                className="w-full"
                                value={entrevistaHora}
                                onChange={(e) => setEntrevistaHora(e.value)}
                                timeOnly
                                hourFormat="24"
                                stepMinute={5}
                                icon="pi pi-clock"
                                showIcon
                                readOnlyInput
                            />
                            <label htmlFor={`hora-${vaga.id}`}>Horário</label>
                        </FloatLabel>
                    </div>

                    <Button type="submit" label="Confirmar e mudar status" icon="pi pi-check" />
                </form>
            )}
        </div>
    );
}

export function Vacancies() {
    const [vacancies, setVacancies] = useState([]);
    const [refresh, setRefresh] = useState(false);

    const [departFilter, setDepartFilter] = useState(null);
    const [order, setOrder] = useState('desc');

    const [dialogVisible, setDialogVisible] = useState(false);
    const [form, setForm] = useState(createEmptyForm);
    const [suggestions, setSuggestions] = useState([]);
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const skipNextSearch = useRef(false);

    const setLoading = useLoading();
    const { showToast } = useToast();

    useEffect(() => {
        async function getVacancies() {
            setLoading(true);
            try {
                const res = await connect.get(VACANCIES_ENDPOINT);
                setVacancies(res.data ?? []);
            } catch (err) {
                console.warn(err);
                showToast('error', 'Erro!', 'Não foi possível carregar as vagas.');
            } finally {
                setLoading(false);
            }
        }
        getVacancies();
    }, [refresh]);

    const departamentoOptions = useMemo(() => {
        const set = new Set(vacancies.map((v) => v.departamento).filter(Boolean));
        return [...set].map((d) => ({ label: d, value: d }));
    }, [vacancies]);

    const filtered = useMemo(() => {
        let list = [...vacancies];
        if (departFilter) list = list.filter((v) => v.departamento === departFilter);

        list.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return list;
    }, [vacancies, departFilter, order]);

    const grouped = useMemo(() => {
        const g = {};
        STATUS_OPTIONS.forEach((s) => { g[s.value] = []; });
        filtered.forEach((v) => {
            if (g[v.status]) g[v.status].push(v);
            else g.aberta.push(v);
        });
        return g;
    }, [filtered]);

    const openCreate = () => {
        setForm(createEmptyForm());
        setSuggestions([]);
        setDebouncedTerm('');
        setDialogVisible(true);
    };

    useEffect(() => {
        if (skipNextSearch.current) { skipNextSearch.current = false; return; }
        const timer = setTimeout(() => setDebouncedTerm(form.matricula), 350);
        return () => clearTimeout(timer);
    }, [form.matricula]);

    useEffect(() => {
        async function buscarColaboradores() {
            const termo = debouncedTerm.trim();
            if (termo.length < 2) { setSuggestions([]); return; }

            try {
                const res = await connect.get(`${VACANCIES_ENDPOINT}/colaboradores`, { params: { q: termo } });
                setSuggestions(res.data ?? []);
            } catch (err) {
                console.warn(err);
            }
        }
        buscarColaboradores();
    }, [debouncedTerm]);

    const selectEmployee = (emp) => {
        skipNextSearch.current = true;
        setForm((prev) => ({
            ...prev,
            matricula: emp.matricula,
            colaborador: emp.nome,
            departamento: emp.departamento,
            centro_custo: emp.centro_custo,
            funcao: emp.funcao,
            carga_horaria: emp.carga_horaria || '',
        }));
        setSuggestions([]);
    };

    const handleMatriculaKeyDown = (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (suggestions.length) selectEmployee(suggestions[0]);
    };

    const handleSave = async () => {
        if (!form.matricula || !form.colaborador) {
            showToast('warn', 'Atenção!', 'Busque e selecione um colaborador pela matrícula ou nome.');
            return;
        }

        if (!form.horario_trabalho) {
            showToast('warn', 'Atenção!', 'Informe o horário de trabalho da vaga.');
            return;
        }

        if (!form.motivo_saida) {
            showToast('warn', 'Atenção!', 'Informe o motivo da saída.');
            return;
        }

        if (!form.data_aviso) {
            showToast('warn', 'Atenção!', 'Selecione a data em que a vaga foi avisada ou o currículo foi enviado.');
            return;
        }

        setLoading(true);
        try {
            await connect.post(VACANCIES_ENDPOINT, {
                matricula: form.matricula,
                colaborador_entrada: form.colaborador_entrada.trim() || null,
                data_aviso: toApiDate(form.data_aviso),
                horario_trabalho: form.horario_trabalho,
                motivo_saida: form.motivo_saida,
            });
            showToast('success', 'Sucesso!', 'Vaga cadastrada com sucesso.');
            setDialogVisible(false);
            setRefresh((prev) => !prev);
        } catch (err) {
            console.warn(err);
            showToast('error', 'Erro!', err.response?.data ?? 'Não foi possível cadastrar a vaga.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateVaga = async (id, patch) => {
        setLoading(true);
        try {
            await connect.patch(VACANCIES_ENDPOINT, { id, ...patch });
            showToast('success', 'Sucesso!', 'Vaga atualizada com sucesso.');
            setRefresh((prev) => !prev);
        } catch (err) {
            console.warn(err);
            showToast('error', 'Erro!', err.response?.data ?? 'Não foi possível atualizar a vaga.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVaga = async (vaga) => {
        setLoading(true);
        try {
            await connect.delete(VACANCIES_ENDPOINT, { params: { id: vaga.id } });
            showToast('success', 'Sucesso!', 'Vaga removida com sucesso.');
            setRefresh((prev) => !prev);
        } catch (err) {
            console.warn(err);
            showToast('error', 'Erro!', 'Não foi possível remover a vaga.');
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = (vaga) => {
        confirmDialog({
            message: `Deseja realmente excluir a vaga de "${vaga.colaborador}"?`,
            header: 'Confirmar exclusão',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Excluir',
            rejectLabel: 'Cancelar',
            accept: () => handleDeleteVaga(vaga),
        });
    };

    return (
        <main className="flex flex-column gap-3 admissao-page">
            <ConfirmDialog />

            <div className="flex gap-2 align-items-center flex-wrap">
                {STATUS_OPTIONS.map((s) => (
                    <DashCard
                        key={s.value}
                        title={s.label}
                        className="border-round-lg p-1 spaceg flex-grow-1"
                        style={{ background: s.color, color: '#fff', flexBasis: '10rem', height: "6rem" }}
                        value={grouped[s.value]?.length || 0}
                    />
                ))}
            </div>

            <div className="flex justify-content-between align-items-center flex-wrap gap-2">
                <div className="flex align-items-center gap-2">
                    <FloatLabel>
                        <Dropdown
                            id="departamento-filtro"
                            className="w-18rem"
                            value={departFilter}
                            onChange={(e) => setDepartFilter(e.value)}
                            options={departamentoOptions}
                            showClear
                        />
                        <label htmlFor="departamento-filtro">Filtrar por departamento</label>
                    </FloatLabel>

                    {departFilter && (
                        <Button
                            icon="pi pi-filter-slash"
                            text
                            rounded
                            severity="secondary"
                            tooltip="Limpar filtro"
                            onClick={() => setDepartFilter(null)}
                        />
                    )}
                </div>

                <SelectButton value={order} onChange={(e) => e.value && setOrder(e.value)} options={orderOptions} />
            </div>

            <div className="flex flex-column overflow-auto h-full">
                <Accordion multiple>
                    {STATUS_OPTIONS.map((status) => (
                        <AccordionTab
                            key={status.value}
                            header={
                                <div className="flex align-items-center gap-2 w-full">
                                    <span className="status-dot" style={{ background: status.color }}></span>
                                    <span className="font-bold">{status.label}</span>
                                    <Tag value={grouped[status.value]?.length || 0} rounded style={{ background: status.color, color: '#fff', marginLeft: 'auto' }} />
                                </div>
                            }
                        >
                            {grouped[status.value]?.length
                                ? (
                                    <Accordion multiple className="vaga-accordion">
                                        {grouped[status.value].map((vaga) => (
                                            <AccordionTab key={vaga.id} header={<VagaHeader vaga={vaga} />}>
                                                <VagaItem vaga={vaga} onUpdate={handleUpdateVaga} onDelete={confirmDelete} />
                                            </AccordionTab>
                                        ))}
                                    </Accordion>
                                )
                                : <span className="empty-status">Nenhuma vaga neste status.</span>
                            }
                        </AccordionTab>
                    ))}
                </Accordion>
            </div>

            <Button
                icon="pi pi-plus"
                size="large"
                className="p-4"
                rounded
                onClick={openCreate}
                style={{ position: 'absolute', right: '20px', bottom: '20px' }}
            />

            <Dialog header="Nova Vaga" visible={dialogVisible} style={{ width: '32rem' }} onHide={() => { setDialogVisible(false); setSuggestions([]); }}>
                <form className="flex flex-column gap-4 pt-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <div className="matricula-search-wrapper">
                        <FloatLabel className="w-full">
                            <InputText
                                id="matricula"
                                className="w-full"
                                autoComplete="off"
                                value={form.matricula}
                                onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                                onKeyDown={handleMatriculaKeyDown}
                                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                            />
                            <label htmlFor="matricula">Matrícula ou nome do colaborador que saiu</label>
                        </FloatLabel>

                        {suggestions.length > 0 && (
                            <div className="matricula-suggestions">
                                {suggestions.map((emp) => (
                                    <div
                                        key={emp.matricula}
                                        className="matricula-suggestion-item"
                                        onMouseDown={() => selectEmployee(emp)}
                                    >
                                        <span className="font-medium">{emp.matricula} - {emp.nome}</span>
                                        <span className="text-500 text-sm">{emp.departamento} • {emp.funcao}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <FloatLabel>
                        <InputText id="colaborador" className="w-full" value={form.colaborador} disabled />
                        <label htmlFor="colaborador">Nome do colaborador que saiu</label>
                    </FloatLabel>

                    <FloatLabel>
                        <InputText
                            id="colaborador_entrada"
                            className="w-full"
                            value={form.colaborador_entrada}
                            onChange={(e) => setForm({ ...form, colaborador_entrada: e.target.value })}
                        />
                        <label htmlFor="colaborador_entrada">Nome do colaborador que vai entrar (opcional)</label>
                    </FloatLabel>

                    <FloatLabel>
                        <Calendar
                            id="data_aviso"
                            className="w-full"
                            value={form.data_aviso}
                            onChange={(e) => setForm({ ...form, data_aviso: e.value })}
                            dateFormat="dd/mm/yy"
                            locale="pt-BR"
                            showIcon
                            readOnlyInput
                        />
                        <label htmlFor="data_aviso">Data do aviso/envio do currículo</label>
                    </FloatLabel>

                    <div className="flex gap-3">
                        <FloatLabel className="w-full">
                            <InputText id="departamento" className="w-full" value={form.departamento} disabled />
                            <label htmlFor="departamento">Departamento</label>
                        </FloatLabel>

                        <FloatLabel className="w-full">
                            <InputText id="centro_custo" className="w-full" value={form.centro_custo} disabled />
                            <label htmlFor="centro_custo">Centro de Custo</label>
                        </FloatLabel>
                    </div>

                    <div className="flex gap-3">
                        <FloatLabel className="w-full">
                            <InputText id="funcao" className="w-full" value={form.funcao} disabled />
                            <label htmlFor="funcao">Função</label>
                        </FloatLabel>

                        <FloatLabel className="w-full">
                            <InputText id="carga_horaria" className="w-full" value={form.carga_horaria} disabled />
                            <label htmlFor="carga_horaria">Carga Horária</label>
                        </FloatLabel>
                    </div>

                    <FloatLabel>
                        <InputText
                            id="horario_trabalho"
                            className="w-full"
                            value={form.horario_trabalho}
                            onChange={(e) => setForm({ ...form, horario_trabalho: e.target.value })}
                        />
                        <label htmlFor="horario_trabalho">Horário de trabalho</label>
                    </FloatLabel>

                    <FloatLabel>
                        <Dropdown
                            id="motivo_saida"
                            className="w-full"
                            value={form.motivo_saida}
                            onChange={(e) => setForm({ ...form, motivo_saida: e.value })}
                            options={MOTIVO_OPTIONS}
                        />
                        <label htmlFor="motivo_saida">Motivo da saída</label>
                    </FloatLabel>

                    <Button type="submit" label="Cadastrar vaga" icon="pi pi-check" />
                </form>
            </Dialog>
        </main>
    );
}
