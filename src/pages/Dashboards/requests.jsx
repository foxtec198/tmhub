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
    const primary = rootStyle.getPropertyValue('--primary-color').trim();

    const [refresh, setRefresh] = useState(null);
    const [filter, setFilter] = useState();
    const [realizadas, setRealizadas] = useState(0);
    const [aprovadas, setAprovadas] = useState(0);
    const [recusadas, setRecusadas] = useState(0);
    const [abertas, setAbertas] = useState(0);
    const [cobertas, setCobertas] = useState(0);
    const [naoCobertas, setNaoCobertas] = useState(0);
    const [localMore, setlocalMore] = useState(0);
    const [localMoreCount, setlocalMoreCount] = useState(0);

    const [labelForRepos, setlabelForRepos] = useState(null)
    const [dataForRepos, setdataForRepos] = useState(null)
    const [dataForRepos2, setdataForRepos2] = useState(null)
    const [labelLocal, setlabelLocal] = useState(null)
    const [dataLocal, setDataLocal] = useState(null)

    const [labelForMult, setlabelForMult] = useState(null)
    const [dataForMult, setdataForMult] = useState(null)

    const [reposData, setReposData] = useState([])

    const [values, setValues] = useState([]);

    useEffect(() => {
        async function get_data() {
            const filterData = filter
                ? {
                    init: new Date(filter[0]).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' }),
                    end: new Date(filter[1]).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' })
                } : {};

            const res = await connect.post("/dash/reposicoes", filterData)
            const hist = res.data.historico
            const total = hist.length
            const dias = [...new Set(hist.map(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" })))].sort((a, b) => a - b)
            const locais = [...new Set(hist.map(item => item.local))]

            setRealizadas(total)
            setAprovadas(hist.filter(item => item.status == "approve").length)
            setRecusadas(hist.filter(item => item.status == "reproved").length)
            setAbertas(res.data.abertas)
            setlocalMore(locais[0])
            setlocalMore(locais[0])

            setlabelForRepos(dias)
            setdataForRepos2(dias.map(d => [...new Set(hist.filter(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" }) === d).map(i => i.ausente))].length))
            setdataForRepos(dias.map(day => [...new Set(hist.filter(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" }) == day).map(i => i.reserva))].length))

            setlabelForMult(dias)
            setdataForMult(dias.map(d =>
                hist
                    .filter(item => new Date(item.created_at).toLocaleDateString("pt-BR", { "day": "2-digit" }) === d)
                    .reduce((soma, item) => soma + (Number(item.multa) || 0), 0)
            ))

            setCobertas(res.data.historico.filter(item => item.reserva != "SEM COBERTURA").length)
            setNaoCobertas(res.data.historico.filter(item => item.reserva == "SEM COBERTURA").length)

            const locais_abrev = locais.map(item => item.split(" - ")[1])

            const locaisValues = locais_abrev
                .map(local => ({ name: local, count: hist.filter(item => item.local.split(" - ")[1] === local).length }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map(item => item.count)

            setlabelLocal(locais_abrev)
            setDataLocal(locaisValues);
            setlocalMoreCount([0])

            setReposData(hist)
            setValues([
                {
                    label: 'Total',
                    color: '#1709d9',
                    value: Math.round(total / total * 100)
                },
                {
                    label: 'Postos Cobertos',
                    color: '#22c55e',
                    value: Math.round(cobertas / total * 100)
                },
                {
                    label: 'Descobertos ',
                    color: '#ef4444',
                    value: Math.round(naoCobertas / total * 100)
                },
                {
                    label: 'Pendentes',
                    color: '#a7da10',
                    value: Math.round(abertas / total * 100)
                },
            ]);

        }; get_data();
    }, [refresh])

    const dataRepos = {
        labels: labelForRepos,
        datasets: [{
            type: 'line',
            tension: 0.4,
            label: 'Reposições',
            borderWidth: 2,
            borderColor: rootStyle.getPropertyValue("--blue-700").trim(),
            fill: false,
            data: dataForRepos
        }, {
            type: 'bar',
            label: 'Ausências',
            backgroundColor: rootStyle.getPropertyValue("--green-500").trim(),
            data: dataForRepos2,
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
            data: dataLocal
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
                        value={abertas}
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
                        value={cobertas}
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
                        value={naoCobertas}
                    />
                    <div
                        className="flex justify-content-center gap-2 align-items-center border-round-lg shadow-6 p-3"
                        style={{ backgroundColor: 'var(--white-600)', height: "5rem", color: '#333' }}>
                        <Knob value={localMoreCount} size={60} />
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
                            data={reposData}
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
                        values={values}
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