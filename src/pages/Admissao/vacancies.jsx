import './vacancies.css';

// Widgets
import { Accordion, AccordionTab } from 'primereact/accordion';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { AutoComplete } from 'primereact/autocomplete';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { SelectButton } from 'primereact/selectbutton';
import { FloatLabel } from 'primereact/floatlabel';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { DashCard } from '../../components/DashCard';
import { CollaboratorDropdown } from '../../components/CollaboratorDropdown';
import { InterviewHistoryDialog } from './InterviewHistoryDialog';

// Utils
import { useEffect, useMemo, useState } from 'react';
import connect from '../../utils/request';
import { useLoading } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';

const VACANCIES_ENDPOINT = '/admissao/vagas';

const STATUS_OPTIONS = [
    { value: 'aberta', label: 'ABERTAS', color: 'var(--gray-600)' },
    { value: 'entrevista', label: 'ENTREVISTA', color: 'var(--blue-600)' },
    { value: 'certidao', label: 'CERTIDAO', color: 'var(--purple-600)' },
    { value: 'aso', label: 'ASO', color: 'var(--yellow-700)' },
    { value: 'unico', label: 'UNICO', color: 'var(--cyan-700)' },
    { value: 'concluido', label: 'CONCLUIDO', color: 'var(--green-700)' },
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
    colaborador_id: null,
    matricula: '',
    colaborador: '',
    colaborador_entrada: '',
    telefone_colaborador_entrada: '',
    data_aviso: new Date(),
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

function toApiDateTime(value) {
    // Segundos são irrelevantes para o SLA e são removidos para manter dados consistentes.
    const date = new Date(value);
    date.setSeconds(0, 0);
    return date.toISOString();
}

function firstScheduleTime(value) {
    // A conclusão usa automaticamente o primeiro HH:mm da jornada cadastrada na vaga.
    const match = String(value || '').match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?!\d)/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
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
                <span className="font-bold mb-2">{vaga.colaborador_entrada || 'Novo colaborador não definido'}</span>
                <span className="text-500 text-sm">Substitui {vaga.colaborador} • {vaga.departamento} • {vaga.centro_custo}</span>
            </div>
            <span className="text-500 text-sm">Saiu em {new Date(vaga.created_at).toLocaleDateString('pt-br')}</span>
        </div>
    );
}

function VagaItem({ vaga, onUpdate, onDelete }) {
    // Dados estruturados de conclusão ficam separados dos campos livres usados durante o processo.
    const [entrevistador, setEntrevistador] = useState(vaga.entrevistador || '');
    const [entrevistaDia, setEntrevistaDia] = useState(vaga.entrevista_data ? new Date(vaga.entrevista_data) : null);
    const [entrevistaHora, setEntrevistaHora] = useState(vaga.entrevista_data ? new Date(vaga.entrevista_data) : null);
    const [showInterviewForm, setShowInterviewForm] = useState(false);
    const [showCompletionForm, setShowCompletionForm] = useState(false);
    const [completionEmployeeId, setCompletionEmployeeId] = useState(vaga.colaborador_entrada_id || null);
    const [completionDate, setCompletionDate] = useState(vaga.data_inicio ? new Date(vaga.data_inicio) : new Date());
    const [completionText, setCompletionText] = useState(vaga.colaborador_entrada || '');
    const [completionObservation, setCompletionObservation] = useState(vaga.observacao_conclusao || '');
    const [candidateName, setCandidateName] = useState(vaga.colaborador_entrada || '');
    const [candidatePhone, setCandidatePhone] = useState(vaga.telefone_colaborador_entrada || '');
    const { showToast } = useToast();

    async function handleStatusSelect(newStatus) {
        // Conclusão e entrevista exigem dados extras, por isso abrem fluxos próprios antes do PATCH.
        if (newStatus === 'concluido') {
            setCompletionEmployeeId(vaga.colaborador_entrada_id || null);
            setCompletionDate(vaga.data_inicio ? new Date(vaga.data_inicio) : new Date());
            setCompletionText(vaga.colaborador_entrada || '');
            setCompletionObservation(vaga.observacao_conclusao || '');
            setShowCompletionForm(true);
            return;
        }

        if (newStatus === 'entrevista' && !(vaga.entrevistador && vaga.entrevista_data)) {
            setShowInterviewForm(true);
            return;
        }

        setShowInterviewForm(false);
        await onUpdate(vaga.id, { status: newStatus });
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

    async function confirmCompletion() {
        // Somente aqui o texto do candidato passa a apontar para um colaborador real da base.
        if (!completionEmployeeId) {
            showToast('warn', 'Atenção!', 'Selecione o colaborador que vai entrar.');
            return;
        }
        if (!completionDate) {
            showToast('warn', 'Atenção!', 'Informe a data de início.');
            return;
        }

        const updated = await onUpdate(vaga.id, {
            status: 'concluido',
            colaborador_entrada_id: completionEmployeeId,
            colaborador_entrada: completionText.trim(),
            data_inicio: toApiDate(completionDate),
            observacao_conclusao: completionObservation.trim() || null,
        });
        if (updated) setShowCompletionForm(false);
    }

    async function saveCandidateText() {
        // Até ÚNICO, nome e telefone são informações livres e podem ser corrigidos sem criar vínculo.
        await onUpdate(vaga.id, {
            colaborador_entrada: candidateName.trim() || null,
            telefone_colaborador_entrada: candidatePhone.trim() || null,
        });
    }

    return (
        <div className="flex flex-column gap-3 p-2">
            <div className="vaga-info-grid">
                <InfoField label="Matrícula" value={vaga.matricula} />
                <InfoField label="Colaborador" value={vaga.colaborador} />
                <InfoField label="Novo colaborador" value={vaga.colaborador_entrada} />
                {vaga.telefone_colaborador_entrada && <InfoField label="Telefone do candidato" value={vaga.telefone_colaborador_entrada} />}
                <InfoField
                    label="Aviso ao responsável"
                    value={vaga.aviso_em ? new Date(vaga.aviso_em).toLocaleString('pt-br') : formatDateOnly(vaga.data_aviso)}
                />
                <InfoField label="Departamento" value={vaga.departamento} />
                <InfoField label="Centro de Custo" value={vaga.centro_custo} />
                <InfoField label="Função" value={vaga.funcao} />
                <InfoField label="Carga Horária" value={vaga.carga_horaria} />
                <InfoField label="Horário de Trabalho" value={vaga.horario_trabalho} />
                <InfoField label="Motivo da Saída" value={vaga.motivo_saida} />
                {vaga.entrevistador && <InfoField label="Entrevistadora" value={vaga.entrevistador} />}
                {vaga.entrevista_data && <InfoField label="Data da Entrevista" value={new Date(vaga.entrevista_data).toLocaleString('pt-br')} />}
                {vaga.colaborador_entrada_cadastrado && <InfoField label="Colaborador que entrou" value={`${vaga.colaborador_entrada_matricula} - ${vaga.colaborador_entrada_cadastrado}`} />}
                {vaga.data_inicio && <InfoField label="Data de início" value={new Date(vaga.data_inicio).toLocaleString('pt-br')} />}
                {vaga.concluido_por_usuario && <InfoField label="Concluída por" value={vaga.concluido_por_usuario} />}
                {vaga.observacao_conclusao && <InfoField label="Observação da conclusão" value={vaga.observacao_conclusao} />}
            </div>

            {vaga.status !== 'concluido' && (
                <form className="candidate-text-editor" onSubmit={(event) => { event.preventDefault(); saveCandidateText(); }}>
                    <div className="candidate-text-editor__heading mb-3">
                        <span><i className="pi pi-user-edit" /> Pessoa que será contratada</span>
                        <Tag className="candidate-text-editor__tag" value="Somente texto até a conclusão" severity="secondary" rounded />
                    </div>
                    <div className="candidate-text-editor__fields">
                        <FloatLabel>
                            <InputText
                                id={`candidate-name-${vaga.id}`}
                                className="w-full"
                                value={candidateName}
                                onChange={(event) => setCandidateName(event.target.value)}
                            />
                            <label htmlFor={`candidate-name-${vaga.id}`}>Nome do candidato</label>
                        </FloatLabel>
                        <FloatLabel>
                            <InputText
                                id={`candidate-phone-${vaga.id}`}
                                className="w-full"
                                value={candidatePhone}
                                onChange={(event) => setCandidatePhone(event.target.value)}
                                maxLength={50}
                            />
                            <label htmlFor={`candidate-phone-${vaga.id}`}>Telefone (opcional)</label>
                        </FloatLabel>
                        <Button type="submit" label="Salvar candidato" icon="pi pi-save" outlined />
                    </div>
                </form>
            )}

            <div className="flex gap-3 align-items-center flex-wrap mt-5">
                <FloatLabel>
                    <Dropdown
                        id={`status-${vaga.id}`}
                        className="w-15rem"
                        value={vaga.status}
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

            <Dialog
                header="Concluir vaga"
                visible={showCompletionForm}
                modal
                style={{ width: 'min(38rem, calc(100vw - 2rem))' }}
                onHide={() => setShowCompletionForm(false)}
            >
                <form className="flex flex-column gap-4 pt-3" onSubmit={(event) => { event.preventDefault(); confirmCompletion(); }}>
                    <div className="completion-recruiter">
                        <i className="pi pi-user" />
                        <span>Recrutador: <strong>{localStorage.getItem('display_name') || 'Usuário do TMHub'}</strong></span>
                    </div>

                    <CollaboratorDropdown
                        value={completionEmployeeId}
                        className="w-full"
                        placeholder="Colaborador que vai entrar *"
                        onChange={(employeeId, employee) => {
                            setCompletionEmployeeId(employeeId);
                            if (employee) setCompletionText(employee.nome || '');
                        }}
                        onError={() => showToast('error', 'Erro!', 'Não foi possível buscar os colaboradores.')}
                    />

                    <FloatLabel>
                        <InputText
                            id={`completion-text-${vaga.id}`}
                            className="w-full"
                            value={completionText}
                            onChange={(event) => setCompletionText(event.target.value)}
                        />
                        <label htmlFor={`completion-text-${vaga.id}`}>Texto do colaborador substituto</label>
                    </FloatLabel>

                    <FloatLabel>
                        <Calendar
                            id={`completion-date-${vaga.id}`}
                            className="w-full"
                            value={completionDate}
                            onChange={(event) => setCompletionDate(event.value)}
                            dateFormat="dd/mm/yy"
                            locale="pt-BR"
                            showIcon
                            readOnlyInput
                        />
                        <label htmlFor={`completion-date-${vaga.id}`}>Data de início *</label>
                    </FloatLabel>

                    <small className="completion-schedule-hint">
                        <i className="pi pi-clock" /> Horário inicial automático: <strong>{firstScheduleTime(vaga.horario_trabalho) || 'horário inválido'}</strong>
                        <span> ({vaga.horario_trabalho})</span>
                    </small>

                    <FloatLabel>
                        <InputTextarea
                            id={`completion-observation-${vaga.id}`}
                            className="w-full"
                            value={completionObservation}
                            onChange={(event) => setCompletionObservation(event.target.value)}
                            rows={4}
                            autoResize
                        />
                        <label htmlFor={`completion-observation-${vaga.id}`}>Observação (opcional)</label>
                    </FloatLabel>

                    <div className="flex justify-content-end gap-2">
                        <Button type="button" label="Cancelar" severity="secondary" text onClick={() => setShowCompletionForm(false)} />
                        <Button type="submit" label="Concluir vaga" icon="pi pi-check" />
                    </div>
                </form>
            </Dialog>
        </div>
    );
}

export function Vacancies() {
    const [vacancies, setVacancies] = useState([]);
    const [refresh, setRefresh] = useState(false);

    const [departFilter, setDepartFilter] = useState(null);
    const [order, setOrder] = useState('desc');

    const [dialogVisible, setDialogVisible] = useState(false);
    const [historyVisible, setHistoryVisible] = useState(false);
    const [form, setForm] = useState(createEmptyForm);
    const [scheduleSuggestions, setScheduleSuggestions] = useState([]);

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
    }, [refresh, setLoading, showToast]);

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
        // Inicializar todos os status garante que colunas vazias também sejam exibidas.
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
        setScheduleSuggestions([]);
        setDialogVisible(true);
    };

    const handleSave = async () => {
        if (!form.colaborador_id) {
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
                colaborador_id: form.colaborador_id,
                colaborador_entrada: form.colaborador_entrada.trim() || null,
                telefone_colaborador_entrada: form.telefone_colaborador_entrada.trim() || null,
                aviso_em: toApiDateTime(form.data_aviso),
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

    const searchSchedules = async (event) => {
        try {
            const res = await connect.get(`${VACANCIES_ENDPOINT}/horarios`, {
                params: { q: event.query?.trim() || '' },
            });
            setScheduleSuggestions(res.data ?? []);
        } catch (err) {
            console.warn(err);
            setScheduleSuggestions([]);
        }
    };

    const handleUpdateVaga = async (id, patch) => {
        setLoading(true);
        try {
            await connect.patch(VACANCIES_ENDPOINT, { id, ...patch });
            showToast('success', 'Sucesso!', 'Vaga atualizada com sucesso.');
            setRefresh((prev) => !prev);
            return true;
        } catch (err) {
            console.warn(err);
            showToast('error', 'Erro!', err.response?.data ?? 'Não foi possível atualizar a vaga.');
            return false;
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

            <div style={{lineHeight:"10px"}}>
                <h1 style={{color: "var(--green-500)"}}>Gerenciamento de Vagas</h1>
                <p>Gerencie as vagas por status, colaboradores e departamentos.</p>
            </div>

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

            <div className="flex justify-content-between align-items-center flex-wrap gap-2 mt-5">
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

                <div className="flex align-items-center gap-2">
                    <Button label="Histórico de entrevistas" icon="pi pi-history" outlined onClick={() => setHistoryVisible(true)} />
                    <SelectButton value={order} onChange={(e) => e.value && setOrder(e.value)} options={orderOptions} />
                </div>
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

            <Dialog header="Nova Vaga" visible={dialogVisible} style={{ width: '32rem' }} onHide={() => setDialogVisible(false)}>
                <form className="flex flex-column gap-4 pt-3" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <CollaboratorDropdown
                        value={form.colaborador_id}
                        className="w-full mt-4"
                        placeholder="Matrícula ou nome do colaborador que saiu"
                        onChange={(colaboradorId, employee) => setForm({
                            ...form,
                            colaborador_id: colaboradorId,
                            matricula: employee?.matricula || '',
                            colaborador: employee?.nome || '',
                        })}
                        onError={() => showToast('error', 'Erro!', 'Não foi possível buscar os colaboradores.')}
                    />

                    <FloatLabel className='mt-3'>
                        <InputText
                            id="colaborador_entrada"
                            className="w-full"
                            value={form.colaborador_entrada}
                            onChange={(e) => setForm({ ...form, colaborador_entrada: e.target.value })}
                        />
                        <label htmlFor="colaborador_entrada">Nome do colaborador que vai entrar (opcional)</label>
                    </FloatLabel>

                    <FloatLabel className='mt-3'>
                        <InputText
                            id="telefone_colaborador_entrada"
                            className="w-full"
                            value={form.telefone_colaborador_entrada}
                            onChange={(e) => setForm({ ...form, telefone_colaborador_entrada: e.target.value })}
                            maxLength={50}
                        />
                        <label htmlFor="telefone_colaborador_entrada">Telefone do candidato (opcional)</label>
                    </FloatLabel>

                    <FloatLabel className='mt-3'>
                        <Calendar
                            id="data_aviso"
                            className="w-full"
                            value={form.data_aviso}
                            onChange={(e) => setForm({ ...form, data_aviso: e.value })}
                            dateFormat="dd/mm/yy"
                            locale="pt-BR"
                            showIcon
                            showTime
                            hourFormat="24"
                            stepMinute={5}
                            readOnlyInput
                        />
                        <label htmlFor="data_aviso">Data e hora do aviso ao responsável</label>
                    </FloatLabel>

                    <FloatLabel className='mt-3'>
                        <AutoComplete
                            id="horario_trabalho"
                            className="w-full"
                            inputClassName="w-full"
                            value={form.horario_trabalho}
                            suggestions={scheduleSuggestions}
                            completeMethod={searchSchedules}
                            field="descricao"
                            delay={350}
                            dropdown
                            forceSelection={false}
                            onChange={(e) => setForm({
                                ...form,
                                horario_trabalho: typeof e.value === 'string' ? e.value : e.value?.descricao || '',
                            })}
                        />
                        <label htmlFor="horario_trabalho">Horário de trabalho (se for novo, será cadastrado)</label>
                    </FloatLabel>

                    <FloatLabel className='mt-3'>
                        <Dropdown
                            id="motivo_saida"
                            className="w-full"
                            value={form.motivo_saida}
                            onChange={(e) => setForm({ ...form, motivo_saida: e.value })}
                            options={MOTIVO_OPTIONS}
                        />
                        <label htmlFor="motivo_saida">Motivo da saída</label>
                    </FloatLabel>

                    <Button type="submit" className='mt-3' label="Cadastrar vaga" icon="pi pi-check" />
                </form>
            </Dialog>
            <InterviewHistoryDialog visible={historyVisible} onHide={() => setHistoryVisible(false)} />
        </main>
    );
}
