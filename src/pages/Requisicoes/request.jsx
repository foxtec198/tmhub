// Widgets
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';

// Utils
import { useState, useRef, useEffect, use } from "react";
import { useToast } from "../../contexts/ToastContext";
import connect from "../../utils/request";

export function Request() {
    const [user, selectedUser] = useState(null)
    const [replace, selectedReplace] = useState(null)
    const [local, selectedLocal] = useState(null)
    const [fault, selectedFault] = useState(null)
    const [warning, selectedWarning] = useState(null)

    const [supsOtions, setSupsOptions] = useState(null)
    const [allFuncsOptions, setAllFuncsOptions] = useState(null)
    const [replaces, setReplaces] = useState(null)
    const [centersOptions, setCenterOptions] = useState(null)

    const warningOptions = [
        { "name": "Aplicada", "value": true },
        { "name": "Não Aplicada", "value": false },
        { "name": "Aguardando Atestado", "value": "waiting" },
    ]

    const stepperRef = useRef(null)
    const { showToast } = useToast();

    async function createRequest(){
        if(user, replace, local, fault, warning){

        }else{ showToast("error", "Dados faltando", "Preencha todos os dados!") }

    }

    useEffect(() => {
        async function getSups() {
            const res = await connect.get("/supervisores");
            setSupsOptions(res.data)
        }

        async function getFuncs() {
            const res = await connect.get("/funcionarios");
            const funcs = [];
            res.data.map(item => funcs.push({ "name": item.nome, "code": item.id }));
            setAllFuncsOptions(funcs)
        }

        async function getCenters() {
            const res = await connect.get("/centro")
            const centers = []
            res.data.map(item => centers.push({ name: item.local, id: item.id }))
            setCenterOptions(centers)
        }

        getSups(); getFuncs(); getCenters();
    }, [])

    return (
        <>
            <div className="flex min-h-screen px-4 py-6 flex-column justify-content-between align-items-center">
                {/* HEADER */}
                <div className="flex flex-column align-items-center justify-content-center text-center">
                    <img
                        src="/brands/no_slogan_bran.svg"
                        alt="Logo"
                        className="px-5 fadein animation-duration-2000"
                        style={{
                            width: 350
                        }}
                    />

                    <span
                        className="font-bold fadeinleft animation-duration-1000 text-2xl text-secondary inter uppercase">
                        Gestão de Reposições
                    </span>
                </div>

                {/* HEADER */}
                <div className="flexw-full" style={{ height: "50vh", minWidth: "22rem" }}>
                    <Stepper ref={stepperRef}>
                        <StepperPanel header="Login">
                            <div className="flex flex-column text-medium text-center">
                                <span className="font-italic mb-4">Selecione seu nome na lista, caso não encontre, entre em contato com o suporte!</span>
                                <Dropdown
                                    className="w-full mb-6"
                                    value={user}
                                    onChange={(e) => selectedUser(e.value)}
                                    options={supsOtions}
                                    placeholder="Selecione seu nome na lista?"
                                    optionLabel="nome"
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
                            <div className="card max-30-rem">
                                <Dropdown
                                    appendTo="self"
                                    panelStyle={{ width: '100%' }}
                                    className="w-full mb-3"
                                    value={fault}
                                    onChange={(e) => selectedFault(e.value)}
                                    options={allFuncsOptions}
                                    placeholder="Quem faltou?"
                                    optionLabel="name"
                                    filter
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
                                    className="w-full mb-3"
                                    value={replace}
                                    onChange={(e) => selectedReplace(e.value)}
                                    options={allFuncsOptions}
                                    placeholder="Quem vai repor?"
                                    optionLabel="name"
                                    filter
                                />
                                <Dropdown
                                    appendTo="self"
                                    panelStyle={{ width: '100%' }}
                                    className="w-full mb-3"
                                    value={warning}
                                    onChange={(e) => selectedWarning(e.value)}
                                    options={warningOptions}
                                    placeholder="Advertencia"
                                    optionLabel="name"
                                />
                                <Button
                                    label="Enviar Requisição"
                                    icon="pi pi-send"
                                    iconPos="right"
                                    className="w-full mt-3"
                                    onClick={() => createRequest()}
                                />
                            </div>
                        </StepperPanel>
                    </Stepper>
                </div>

                {/* FOOTER */}
                <div className="flex">
                    <span
                        className="inter text-center">
                        Ao enviar a requisição, aguarde até que o responsável
                        aprove ou reprove sua solicitação. <Tag
                            severity="danger"
                            value="Resposta Média: 24Hrs"
                            rounded
                        />
                    </span>
                </div>
            </div>
        </>
    );
};