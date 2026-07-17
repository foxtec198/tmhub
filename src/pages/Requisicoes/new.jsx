// Widgets ----------------------------------------------
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { Checkbox } from "primereact/checkbox";
import { SelectButton } from "primereact/selectbutton";
import { InputNumber } from "primereact/inputnumber";

// Utils ------------------------------------------------
import { useState, useRef, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import { useLoading } from "../../contexts/LoadingContext";
import connect from "../../utils/request";
import { InputText } from "primereact/inputtext";
import { CollaboratorDropdown } from "../../components/CollaboratorDropdown";
import "./new.css";

export function Request() {
    // Campos do formulário e seleções relacionadas ao colaborador ausente.
    const [user, selectedUser] = useState(null)
    const [replace, selectedReplace] = useState(null)
    const [local, selectedLocal] = useState(null)
    const [absent, selectedAbsent] = useState(null)
    const [warning, selectedWarning] = useState(null)
    const [reason, selectedReason] = useState(null)
    const [obs, setObs] = useState("")
    const [checked, setChecked] = useState(false)
    const [dateChoice, setDateChoice] = useState("today")
    const [durationDays, setDurationDays] = useState(1)

    // Opções remotas carregadas para os dropdowns do formulário.
    const [supsOtions, setSupsOptions] = useState(null)
    const [replaces, setReplaces] = useState(null)
    const [centersOptions, setCenterOptions] = useState(null)
    const dateOptions = [{ label: "Hoje", value: "today" }, { label: "Amanhã", value: "tomorrow" }]

    const reasonOptions = [
        "AFASTAMENTO",
        "ATESTADO",
        "DECLARAÇÃO",
        "POSTO VAGO",
        "REMANEJAMENTO",
        "INJUSTIFICADA",
        "OUTROS",
    ]

    const stepperRef = useRef(null)
    const setLoading = useLoading();
    const { showToast } = useToast();

    function selectedRequestDate() {
        // The API requires the actual submission time even when tomorrow is selected.
        const now = new Date();
        if (dateChoice === "tomorrow") now.setDate(now.getDate() + 1);
        return now;
    }

    // Valida os campos obrigatórios e envia a nova requisição ao backend.
    async function createRequest() {
        setLoading(true);
        try {
            if(user && absent && local && reason && (checked || replace)){
                const data = {
                    supervisor_id: user.id,
                    centro_id: local.id,
                    ausente_id: absent,
                    reserva_id: checked ? 0 : replace.id,
                    motivo: reason,
                    advertencia: warning,
                    data: selectedRequestDate(),
                    quantidade_dias: ["ATESTADO", "AFASTAMENTO"].includes(reason) ? durationDays : 1,
                    obs: obs
                }
                await connect.post("/repo/request", data)
                showToast("success", "Sucesso na requisição", "Sua requisição foi criada com sucesso, aguarde novidades por email!")
                selectedReplace(null); selectedLocal(null); selectedAbsent(null); selectedReason(null); setObs(""); selectedWarning(null); setDurationDays(1); setDateChoice("today")
            }
            else{showToast("warn", "Atenção!", "Preencha todos os dados")}
        }
        catch (err) { console.warn(err); showToast("error", "Erro ao enviar requisição", err.response.data) }
        finally { setLoading(false) }

    }

    // Pré-carrega supervisores, colaboradores e centros usados pelo formulário.
    useEffect(() => {
        async function getSups() {
            const res = await connect.get("/supervisores");
            const sups = []
            res.data.map(item => sups.push({ name: item.nome, id: item.id }))
            setSupsOptions(sups)
        }

        async function getReplaces() {
            const res = await connect.get("/reservas");
            const absents = [];
            res.data.map(item => absents.push({ name: item.nome, id: item.id }));
            setReplaces(absents)
        }

        async function getCenters() {
            const res = await connect.get("/centro")
            console.log(res)
            const centers = []
            res.data.map(item => centers.push({ name: `${item.id} - ${item.local} - ${item.departamento}`, id: item.id }))
            setCenterOptions(centers)
        }

        getSups(); getCenters(); getReplaces();
    }, [])

    // Formulário público e responsivo de abertura de reposição.
    return (
        <>
            <div className="request-create-page flex min-h-screen px-4 py-6 flex-column justify-content-between align-items-center">
                {/* HEADER */}
                <div className="flex flex-column align-items-center justify-content-center text-center">
                    <img
                        src="/brands/main_brand.svg"
                        alt="Logo"
                        className="request-create-logo px-5 fadein animation-duration-2000"
                    />

                    <span
                        className="font-bold fadeinleft animation-duration-1000 text-2xl text-secondary inter uppercase">
                        Gestão de Reposições
                    </span>
                </div>

                {/* HEADER */}
                <div className="request-stepper-shell flexw-full" style={{ height: "50vh", minWidth: "22rem" }}>
                    <Stepper ref={stepperRef}>
                        <StepperPanel header="Login">
                            <div className="flex flex-column text-medium text-center">
                                <span className="font-xl mb-4">Selecione seu nome na lista, caso não encontre, entre em contato com o suporte!</span>
                                <Dropdown
                                    className="w-full mb-6"
                                    value={user}
                                    onChange={(e) => selectedUser(e.value)}
                                    options={supsOtions}
                                    placeholder="Selecione seu nome na lista"
                                    optionLabel="name"
                                    filter
                                />
                                <Button
                                    label="Realizar Login"
                                    icon="pi pi-sign-in"
                                    iconPos="right"
                                    onClick={() => {
                                        user
                                            ? stepperRef.current.nextCallback()
                                            : showToast("error", "Erro no Login", "Selecione um usuário primeiro!")
                                    }}
                                />
                            </div>
                        </StepperPanel>

                        <StepperPanel header="Reserva">
                            <div className="flex flex-column p-4 text-medium" style={{
                                maxWidth: "40rem",
                                flexGrow: 1,
                                width: "90dvw"
                            }}>
                                <CollaboratorDropdown
                                    appendTo="self"
                                    panelStyle={{ width: '100%' }}
                                    className="w-full mb-3"
                                    value={absent}
                                    onChange={selectedAbsent}
                                    placeholder="Quem faltou?"
                                    showClear={false}
                                    onError={() => showToast("error", "Erro na busca", "Não foi possível buscar os colaboradores.")}
                                />
                                <Dropdown
                                    appendTo="self"
                                    panelStyle={{ width: '100%' }}
                                    className="w-full mb-3"
                                    value={local}
                                    onChange={(e) => selectedLocal(e.value)}
                                    options={centersOptions}
                                    placeholder="Qual contrato?"
                                    optionLabel="name"
                                    filter
                                />
                                <Dropdown
                                    appendTo="self"
                                    panelStyle={{ width: '100%' }}
                                    className={`w-full mb-3 ${checked? "hidden":null}`}
                                    value={replace}
                                    virtualScrollerOptions={{ itemSize: 38 }}
                                    onChange={(e) => selectedReplace(e.value)}
                                    options={replaces}
                                    placeholder="Quem vai repor?"
                                    optionLabel="name"
                                    filter
                                />

                                <Dropdown
                                    appendTo="self"
                                    panelStyle={{ maxWidth: '100%' }}
                                    className="w-full mb-3"
                                    value={reason}
                                    onChange={(e) => { selectedReason(e.value); if (!["ATESTADO", "AFASTAMENTO"].includes(e.value)) setDurationDays(1) }}
                                    options={reasonOptions}
                                    placeholder="Selecione o Motivo"
                                    optionLabel="name"
                                />

                                <Dropdown
                                    appendTo="self"
                                    panelStyle={{ width: "100%" }}
                                    className={`w-full mb-3 ${reason != "INJUSTIFICADA" ? "hidden" : null}`}
                                    value={warning}
                                    onChange={(e) => selectedWarning(e.value)}
                                    options={["Aplicado", "Não Aplicado"]}
                                    placeholder="Advertencia"
                                    optionLabel="name"
                                />

                                <InputText
                                    className={`w-full mb-3 ${reason != "OUTROS" ? "hidden" : null}`}
                                    value={obs}
                                    onChange={(e) => setObs(e.target.value)}
                                    placeholder="Observação"
                                />
                                
                                {["ATESTADO", "AFASTAMENTO"].includes(reason) && (
                                    <div className="flex flex-column gap-2 mb-3">
                                        <label htmlFor="duration-days">Quantidade de dias</label>
                                        <InputNumber inputId="duration-days" value={durationDays} onValueChange={(e) => setDurationDays(e.value || 1)} min={1} max={365} showButtons />
                                    </div>
                                )}

                                <div className="flex justify-content-between align-items-center gap-3 mb-4">
                                    <span className="font-medium">Data da ausência</span>
                                    <SelectButton value={dateChoice} options={dateOptions} onChange={(e) => e.value && setDateChoice(e.value)} allowEmpty={false} />
                                </div>

                                <div className="flex justify-content-end align-items-center text-end">
                                    <Checkbox inputId="req" name="pizza" value="Cheese" onChange={(e) => setChecked(e.checked)} checked={checked} />
                                    <label htmlFor="req" className="ml-2">Posto sem Cobertura?</label>
                                </div>


                                <Button
                                    label="Enviar Requisição"
                                    icon="pi pi-send"
                                    iconPos="right"
                                    className="w-full mt-3"
                                    onClick={() => { createRequest() }}
                                />
                            </div>
                        </StepperPanel>
                    </Stepper>
                </div>
            </div>
        </>
    );
};
