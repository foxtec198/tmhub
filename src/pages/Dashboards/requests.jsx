import { DashCard } from "../../components/Card"
import { Chart } from "primereact/chart"
import { MeterGroup } from "primereact/metergroup"
import { Calendar } from "primereact/calendar"
import { useEffect, useState } from "react"
import { Table } from "../../components/tables/Table"
import connect from "../../utils/request"

export function RequestReport() {
    const rootStyle = getComputedStyle(document.documentElement);
    const primary = rootStyle.getPropertyValue('--primary-color').trim();

    const [refresh, setRefresh] = useState(null);
    const [filter, setFilter] = useState(null);
    const [realizadas, setRealizadas] = useState(0);
    const [aprovadas, setAprovadas] = useState(0);
    const [recusadas, setRecusadas] = useState(0);
    const [abertas, setAbertas] = useState(0);

    const [labelForRepos, setlabelForRepos] = useState(null)
    const [dataForRepos, setdataForRepos] = useState(null)
    const [dataForRepos2, setdataForRepos2] = useState(null)

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
                }:{};

            const res = await connect.post("/dash/reposicoes", filterData)
            const total = res.data.meter.total

            setRealizadas(res.data.counts.realizadas)
            setAprovadas(res.data.counts.aprovadas)
            setRecusadas(res.data.counts.reprovadas)
            setAbertas(res.data.counts.abertas)

            setlabelForRepos(res.data.repos.map(item => item.dia))
            setdataForRepos(res.data.repos.map(item => item.reservas))
            setdataForRepos2(res.data.repos.map(item => item.ausentes))

            setlabelForMult(res.data.multas.map(item => item.dia))
            setdataForMult(res.data.multas.map(item => item.total_multas))
            setReposData(res.data.historico)

            setValues([
                {
                    label: 'Total',
                    color: '#f59e0b',
                    value: total
                },
                {
                    label: 'Concluido',
                    color: '#22c55e',
                    value: Math.round(res.data.meter.cobertas / total * 100)
                },
                {
                    label: 'Pendente',
                    color: '#ef4444',
                    value: Math.round(res.data.meter.sem_cobertura / total * 100)
                }
            ]);

        }; get_data();
    }, [refresh])

    const dataRepos = {
        labels: labelForRepos,
        datasets: [{
            type: 'line',
            label: 'Reposições',
            borderColor: '#14fe17',
            borderWidth: 2,
            fill: false,
            data: dataForRepos
        }, {
            type: 'bar',
            label: 'Ausentes',
            backgroundColor: primary,
            data: dataForRepos2,
            borderColor: 'white',
            borderWidth: 2
        },]
    };

    const dataMults = {
        labels: labelForMult,
        datasets: [{
            type: "bar",
            label: "Multa",
            backgroundColor: primary,
            data: dataForMult
        }]
    }

    const options = {
        responsive: true,
        title: {
            display: true,
            text: 'Analise de Reposições'
        },
        tooltips: {
            mode: 'index',
            intersect: true
        }
    };

    const columns = [
        {
            header: "Centro de Custo",
            field: "local"
        },
        {
            header: "Dpto.",
            field: "dpto"
        },
        {
            header: "Data",
            body: (row) => new Date(row.created_at).toLocaleDateString("pt-BR",)
        },
        {
            header: "Coberturas",
            body: (row) => {
                return <span className="flex gap-2">
                    <span className="inter">{row.ausente}</span>
                    <i className="pi pi-arrow-right"></i>
                    <span className="font-bold">{row.reserva}</span>
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
            <div className="flex justify-content-between align-items-top w-full">
                <div className="flex gap-2 p-2 w-full">
                    <DashCard
                        icon="pi pi-verified"
                        title="Realizadas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--purple-800)',
                            height: "6rem",
                            color: "#fff",
                        }}
                        value={realizadas}
                    />
                    <DashCard
                        icon="pi pi-check"
                        title="Aprovadas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--primary-color)',
                            height: "6rem",
                            color: "#fff",
                        }}
                        value={aprovadas}
                    />
                    <DashCard
                        icon="pi pi-trash"
                        title="Reprovadas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--red-900)',
                            height: "6rem",
                            color: "#fff",
                        }}
                        value={recusadas}
                    />
                    <DashCard
                        icon="pi pi-trash"
                        title="Requisições Abertas"
                        className="border-round-lg"
                        style={{
                            backgroundColor: 'var(--gray-700)',
                            height: "6rem",
                            color: "#fff",
                        }}
                        value={abertas}
                    />
                </div>

                <div className="flex flex-column p-2 gap-2">
                    <span className="font-bold">Filtrar: </span>
                    <Calendar
                        locale="pt-BR"
                        value={filter}
                        dateFormat="dd/mm/yy"
                        onChange={(e) => { setFilter(e.value); setRefresh(prev => !prev) }}
                        selectionMode="range"
                        readOnlyInput
                        showButtonBar
                    />
                </div>
            </div>

            <div className="flex w-full min-h-full gap-4">
                <div className="flex flex-column flex-grow-1 gap-4">
                    {/* CHARTS FRAME */}
                    <div className="flex flex-grow-1 gap-4 max-h-15rem">
                        <div className="border-round-lg p-4 flex flex-column justify-content-center align-items-center shadow-6 flex-grow-1">
                            <span className="w-full font-bold">Analise de Reposições:</span>
                            <Chart
                                data={dataRepos}
                                options={options}
                                className="w-full h-full p-2"
                            />
                        </div>
                        <div className="border-round-lg p-4 flex flex-column justify-content-center align-items-center shadow-6 flex-grow-1">
                            <span className="w-full font-bold">Multas:</span>
                            <Chart
                                data={dataMults}
                                className="w-full h-full p-2"
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
                <div className="flex flex-column p-4 w-20rem border-round-lg shadow-6">
                    <span className="font-bold mb-4">Status:</span>
                    <MeterGroup
                        className="h-full"
                        values={values}
                        orientation="vertical"
                        labelOrientation="vertical"
                    />
                </div>
            </div>
        </main>
    )
}