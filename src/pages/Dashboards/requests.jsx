import { DashCard } from "../../components/Card"
import { Chart } from "primereact/chart"
import { MeterGroup } from "primereact/metergroup"
import { Calendar } from "primereact/calendar"
import { useEffect, useState } from "react"
import { Table } from "../../components/tables/Table"
import { Divider } from "primereact/divider"
import { TabView } from "primereact/tabview"
import { TabPanel } from "primereact/tabview"
import { Knob } from 'primereact/knob';

import connect from "../../utils/request"

export function RequestReport() {
    const rootStyle = getComputedStyle(document.documentElement);

    // Dar refresh na pagina com os novos dados
    const [refresh, setRefresh] = useState(null);

    // Filtrar com nova data
    const [filter, setFilter] = useState([new Date("2026-06-01 00:00:00"), new Date("2026-06-30 00:00:00")]);

    // Statics
    const [realizadas, setRealizadas] = useState(0);
    const [aprovadas, setAprovadas] = useState(0);
    const [recusadas, setRecusadas] = useState(0);
    const [requisicoes, setRequisicoes] = useState(0);
    const [postosCobertos, setPostosCobertos] = useState(0);
    const [postosDescobertos, setPostoDescobertos] = useState(0);
    const [localMore, setlocalMore] = useState(0);
    const [localComMaisFaltas, setLocalComMaisFaltas] = useState(0);


    // Dados para CHARTS
    // Chart de Reposicoes
    const [labelReposicoes, setLabelReposicoes] = useState(null)
    const [dadosReposicoes, setDadosReposicoes] = useState(null)
    const [labelLocal, setlabelLocal] = useState(null)
    const [dadosAusentes, setDadosAusentes] = useState(null)

    // Dados do Vertical Bar - Locais
    const [dadosLocais, setDadosLocais] = useState(null)

    // Dados do Vertical Bar - Motivos
    const [dadosMotivos, setDadosMotivos] = useState(null)

    // Chart de MULTAS
    const [labelForMult, setlabelForMult] = useState(null)
    const [dataForMult, setdataForMult] = useState(null)

    // Dados da Tabela
    const [dadosTabela, setDadosTabela] = useState([])

    // Dados do Meter Group
    const [meterGroupValues, setMeterGroupValues] = useState([]);

    useEffect(() => {
        async function get_data() {
            const filterData = filter
                ? {
                    init: new Date(filter[0]).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    end: new Date(filter[1]).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' })
                } : {};

            // const res = await connect.post("/dash/reposicoes", filterData)
            const res = {
                "data": {
                    "abertas": 0
                }
            }
            const hist = [
                {
                    "ausente": "LINCOLN GUSTAVO MENDES",
                    "created_at": "Fri, 22 Jun 2026 13:27:42 GMT",
                    "dpto": "87",
                    "local": "ED.LONDRINA - ENCARREGADOS",
                    "motivo": "LAVAÇÃO DE TOLDO",
                    "multa": 180,
                    "obs": "None",
                    "reserva": "SEM INFORMAÇÃO",
                    "status": "reproved",
                    "supervisor": "PAULO TORRES"
                }, {
                    "ausente": "PAULO AQUINO DE ALMEIDA JUNIOR",
                    "created_at": "Fri, 15 Jun 2026 13:27:41 GMT",
                    "dpto": "269",
                    "local": "LONDRINA - VOLANTES ",
                    "motivo": "REMANEJAMENTO",
                    "multa": 250,
                    "obs": "None",
                    "reserva": "SEM INFORMAÇÃO",
                    "status": "approve",
                    "supervisor": "PAULO TORRES"
                }, {
                    "ausente": "LUZIA DE OLIVEIRA",
                    "created_at": "Fri, 8 Jun 2026 13:27:41 GMT",
                    "dpto": "269",
                    "local": "LONDRINA - VOLANTES ",
                    "motivo": "INSS",
                    "multa": 320,
                    "obs": "None",
                    "reserva": "LUZIA CAZARIN",
                    "status": "approve",
                    "supervisor": "PAULO TORRES"
                }, {
                    "ausente": "FULANINHO DA SILVA",
                    "created_at": "Fri, 8 Jun 2026 13:27:41 GMT",
                    "dpto": "269",
                    "local": "SCHERER ",
                    "motivo": "ATESTADO",
                    "multa": 210,
                    "obs": "None",
                    "reserva": null,
                    "status": "approve",
                    "supervisor": "PAULO TORRES"
                }
            ]

            const total = hist.length
            const dias = [...new Set(hist.map(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" })))].sort((a, b) => a - b)
            const locais = [...new Set(hist.map(item => item.local))]
            const motivos = [...new Set(hist.map(item => item.motivo))]
            const list_aprovadas = hist.filter(item => item.status == "approve")
            const list_reprovadas = hist.filter(item => item.status == "reproved")
            const locais_abrev = locais.map(item => item.split(" - ")[1])
            const locaisValues = locais_abrev
                .map(local => ({ name: local, count: hist.filter(item => item.local.split(" - ")[1] === local).length }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map(item => item.count)

            console.log(
            )

            setRealizadas(total)
            setAprovadas(list_aprovadas.length)
            setRecusadas(list_reprovadas.length)
            setRequisicoes(res.data.abertas)
            setlocalMore(locais[0])
            setLabelReposicoes(dias)
            setDadosAusentes(dias.map(d => [...new Set(hist.filter(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" }) === d).map(i => i.ausente))].length))
            setDadosReposicoes(dias.map(day => [...new Set(hist.filter(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" }) == day).map(i => i.reserva))].length))
            setlabelForMult(dias)
            setPostosCobertos(list_aprovadas.filter(item => item.reserva != null).length)
            setPostoDescobertos(hist.filter(item => item.reserva == null).length)
            setlabelLocal(locais_abrev)
            setDadosLocais(locaisValues);
            
            setLocalComMaisFaltas([0])
            setDadosTabela(hist)

            setdataForMult(dias.map(d =>
                hist
                    .filter(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" }) === d)
                    .reduce((soma, item) => soma + (Number(item.multa) || 0), 0)
            ))

            setMeterGroupValues([
                {
                    label: 'Total',
                    color: '#1709d9',
                    value: Math.round(total / total * 100)
                },
                {
                    label: 'Postos Cobertos',
                    color: '#22c55e',
                    value: Math.round(postosCobertos / total * 100)
                },
                {
                    label: 'Descobertos ',
                    color: '#ef4444',
                    value: Math.round(postosDescobertos / total * 100)
                },
                {
                    label: 'Pendentes',
                    color: '#a7da10',
                    value: Math.round(requisicoes / total * 100)
                },
            ]);

        }; get_data();
    }, [refresh])

    const dataRepos = {
        labels: labelReposicoes,
        datasets: [{
            type: 'line',
            tension: 0.4,
            label: 'Reposições',
            borderWidth: 2,
            borderColor: rootStyle.getPropertyValue("--blue-700").trim(),
            fill: false,
            data: dadosReposicoes
        }, {
            type: 'bar',
            label: 'Ausências',
            backgroundColor: rootStyle.getPropertyValue("--green-500").trim(),
            data: dadosAusentes,
            borderColor: 'white',
            borderWidth: 2
        },]
    };

    const dataMults = {
        labels: labelForMult,
        datasets: [{
            type: "line",
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(53, 141, 26, 0.6)',
            label: "Multa por dia.",
            data: dataForMult
        }]
    }

    const dtLocal = {
        labels: labelLocal,
        datasets: [{
            type: "bar",
            backgroundColor: rootStyle.getPropertyValue("--green-200").trim(),
            label: "Dados",
            data: dadosLocais
        }]
    }

    const columns = [
        {
            header: "Centro de Custo",
            field: "local"
        },
        {
            header: "DPTO.",
            field: "dpto"
        },
        {
            header: "Data",
            body: (row) => new Date(row.created_at).toLocaleDateString("pt-BR",)
        },
        {
            header: "Coberturas",
            style: { maxWidth: "20rem" },
            body: (row) => {
                return <span className="flex gap-2">
                    <span className="inter text-truncate">{row.ausente.split(" ")[0]} {row.ausente.split(" ").at(-1)}</span>
                    <i className="pi pi-arrow-right"></i>
                    <span className="font-bold text-truncate">{row.reserva.split(" ")[0]} {row.reserva.split(" ").at(-1)}</span>
                </span>
            }
        },
        {
            header: "Supervisor",
            field: 'supervisor'
        },
        {
            header: "Motivo",
            field: "motivo"
        }
    ]

    return (
        <main className="flex flex-column p-2 gap-2">
            <div className="flex justify-content-between align-items-center w-full">
                <div className="flex gap-2 p-2 w-full">
                    <DashCard
                        icon="pi pi-verified"
                        title="Realizadas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--green-900)',
                            height: "5rem",
                            color: "#fff",
                        }}
                        value={realizadas}
                    />
                    <DashCard
                        icon="pi pi-check"
                        title="Aprovadas"
                        className="border-round-lg text-truncate"
                        style={{
                            backgroundColor: 'var(--green-600)',
                            height: "5rem",
                            color: "#fff",
                        }}
                        value={aprovadas}
                    />
                    <DashCard
                        icon="pi pi-trash"
                        title="Reprovadas"
                        className="border-round-lg text-truncate"
                        style={{
                            backgroundColor: 'var(--red-500)',
                            height: "5rem",
                            color: "#fff",
                        }}
                        value={recusadas}
                    />
                    <DashCard
                        icon="pi pi-folder-open "
                        title="Req. Abertas"
                        className="border-round-lg text-truncate"
                        style={{
                            backgroundColor: 'var(--green-500)',
                            height: "5rem",
                            color: "#fff",
                        }}
                        value={requisicoes}
                    />
                    <DashCard
                        icon="pi pi-calendar "
                        title="Cobertas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--blue-800)',
                            height: "5rem",
                            color: "#fff",
                        }}
                        value={postosCobertos}
                    />
                    <DashCard
                        icon="pi pi-paperclip"
                        title="Descobertas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--red-800)',
                            height: "5rem",
                            color: "#fff",
                        }}
                        value={postosDescobertos}
                    />
                    <div
                        className="flex justify-content-center gap-2 align-items-center border-round-lg shadow-6 p-3"
                        style={{ backgroundColor: 'var(--white-600)', height: "5rem", color: '#333' }}>
                        <Knob value={localComMaisFaltas} size={60} />
                        <div className="flex flex-column justify-content-between">
                            <span className="inter font-bold spaceg text-1xl">Contrato com mais faltas</span>
                            <span className="text-truncate inter">{localMore}</span>
                        </div>
                    </div>
                </div>

                <Calendar
                    locale="pt-BR"
                    value={filter}
                    placeholder="Selecione um período."
                    dateFormat="dd/mm/yy"
                    onChange={(e) => { setFilter(e.value); setRefresh(prev => !prev) }}
                    selectionMode="range"
                    readOnlyInput
                    showButtonBar
                />
            </div>

            <div className="flex w-full min-h-full gap-4">
                <div className="flex flex-column flex-grow-1 gap-4">
                    {/* CHARTS FRAME */}
                    <div className="flex flex-grow-1 gap-4 max-h-15rem">
                        <div className="border-round-lg p-3 gap-2 flex flex-column justify-content-center align-items-center shadow-6 flex-grow-1">
                            <Chart
                                data={dataRepos}
                                options={{
                                    aspectRatio: 2.5,
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                                className="flex align-items-center justify-content-center w-30rem h-full"
                            />
                        </div>
                        <div className="border-round-lg p-4 flex flex-column justify-content-center align-items-center shadow-6 flex-grow-1">
                            <Chart
                                data={dataMults}
                                className="w-full h-full"
                                options={{
                                    aspectRatio: 2.5,
                                    responsive: true,
                                    maintainAspectRatio: false
                                }}
                            />
                        </div>
                    </div>

                    {/* TABLE FRAME */}
                    <div className="flex overflow-hidden flex-grow-1 p-2 border-round-lg shadow-6 ">
                        <Table
                            tableClassName="w-full"
                            columns={columns}
                            data={dadosTabela}
                            rows={3}
                            style={{
                                fontSize: "10px"
                            }}
                        />
                    </div>
                </div>

                {/* STATUS CARD */}
                <div className="flex flex-column p-4 w-18rem border-round-lg shadow-6">
                    <span className="font-bold mb-4">Status  de Reposições:</span>
                    <MeterGroup
                        className="h-full"
                        values={meterGroupValues}
                        orientation="vertical"
                        labelOrientation="vertical"
                    />
                    <Divider className="my-4" />
                    <span className="font-bold mb-4">Faltas por :</span>
                    <TabView>
                        <TabPanel header="Contrato">
                            <Chart
                                className="h-full"
                                data={dtLocal}
                                options={{
                                    aspectRatio: 1,
                                    autoPadding: true,
                                    indexAxis: 'y',
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: (ctx) => `Faltas: ${ctx.parsed.y}`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            display: false
                                        },
                                        y: {
                                            display: true,
                                            grid: {
                                                display: false,
                                                drawBorder: false
                                            }
                                        }
                                    }
                                }}
                            />
                        </TabPanel>
                        {/* <TabPanel header="Colaborador">
                            <Chart
                                className="h-full"
                                data={dtLocal}
                                options={{
                                    aspectRatio: 1,
                                    autoPadding: true,
                                    indexAxis: 'y',
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: (ctx) => `Faltas: ${ctx.parsed.y}`
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            display: false
                                        },
                                        y: {
                                            display: true,
                                            grid: {
                                                display: false,
                                                drawBorder: false
                                            }
                                        }
                                    }
                                }}
                            />
                        </TabPanel> */}
                    </TabView>
                </div>
            </div>
        </main>
    )
}