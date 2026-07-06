// Widgets
import { Divider } from "primereact/divider";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

// Utils
import { useEffect, useMemo, useState } from "react";
import { useLoading } from "../../contexts/LoadingContext";
import connect from "../../utils/request";
import { InputText } from "primereact/inputtext";
import { FloatLabel } from "primereact/floatlabel";
import { useToast } from "../../contexts/ToastContext";
import { get_first_name } from "../../utils/ui";

// Login and UI (uiiii)
export function Floaters() {
    const setLoading = useLoading();
    const { showToast } = useToast();
    const [refresh, setRefresh] = useState(false);

    // Handles de Reservas
    const [reservas, setReservas] = useState([]);
    const [searchReservas, setSearchReservas] = useState("");

    // Handles de busca para colaboradores
    const [colaboradores, setColaboradores] = useState([])
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const reservasFiltradas = useMemo(() => {
        const busca = searchReservas.trim().toLowerCase();
        if (!busca) return reservas;
        return reservas.filter(c => {
            return (
                c.nome.toLowerCase().includes(busca) ||
                c.cargo.toLowerCase().includes(busca) ||
                c.matricula.toString().includes(busca)
            );
        });
    }, [reservas, searchReservas]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        async function load() {
            try {
                setLoading(true);
                const cobs = await connect.get(`/funcionarios?search=${debouncedSearch}&situacao=1&limit=50`);
                setColaboradores(cobs.data);

                const resv = await connect.get(`/reservas`);
                setReservas(resv.data)
            } catch (err) {
                showToast("error", "Erro na requisição", err.response.data)
            } finally { setLoading(false) }
        }; load();
    }, [debouncedSearch, refresh]);

    async function setReserva(id, nome) {
        try{
            setLoading(true)
            await connect.post("/reservas", {id:id})
            showToast("success", "Sucesso com o reservista", `${get_first_name(nome)}, movido com sucesso para Reservas Técnicas (Voltantes)`)
            setRefresh(prev => !prev)
        }catch(err){ console.warn(err); showToast("error", "Erro ao solicitar reservista", err.response.data)
        }finally{ setLoading(false) }
    }
    
    async function delReserva(id, nome) {
        try{
            setLoading(true)
            await connect.delete(`/reservas?id=${id}`)
            showToast("success", "Sucesso", `${get_first_name(nome)}, removido com sucesso.`)
            setRefresh(prev => !prev)

        }catch(err){ console.warn(err); showToast("error", "Erro ao solicitar exclusão", err.response.data)
        }finally{ setLoading(false) }
    }
    
    return (
        <main className="h-full p-2">
            <h2 className="inter flex align-items-center gap-2" style={{ color: "var(--green-600)", fontWeight: 900 }}>
                <i className="pi pi-users"></i>
                Reservas Tecnicas
            </h2>
            {/* FRAME */}
            <div className="flex h-full w-full" style={{ maxHeight: "75dvh" }}>
                {/* All Cobs */}
                <div className="flex flex-column flex-grow-1 gap-2 p-2 overflow-y-auto md:w-20rem">
                    <span className="spaceg mb-3">Colaboradores Ativos: </span>
                    <FloatLabel className="w-full mb-2">
                        <InputText
                            className="w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <label htmlFor="">Buscar Colaboradores.</label>
                    </FloatLabel>
                    {colaboradores.map(colaborador => {
                        const data = new Date(colaborador.data_admissao)
                        return (
                            <div
                                key={colaborador.id}
                                className="flex flex-grow-1 justify-content-between align-items-center border-round-lg p-2 shadow-5"
                                style={{
                                    background: "ghostwhite",
                                    color: "#333",
                                    maxHeight: '80px'
                                }}
                            >
                                <div className="flex flex-column gap-2">
                                    <div className="flex justify-content-center align-items-center">
                                        <span className="inter font-bold text-truncate">{colaborador.matricula} - {colaborador.nome}</span>
                                        <Divider className="h-1rem" layout="vertical" />
                                        <span className="spaceg flex align-items-center gap-1">
                                            <i className="pi pi-calendar-plus"></i>
                                            {data.toLocaleDateString("pt-br", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 align-items-center">
                                        <Tag className="bg-primary" rounded> {colaborador.cargo} </Tag>
                                        <Tag style={{ background: "var(--gray-700)" }} rounded> <span>{colaborador.situacao.toUpperCase()}</span> </Tag>
                                    </div>
                                </div>
                                <Button
                                    className="bg-primary"
                                    icon="pi pi-caret-right"
                                    onClick={()=>{setReserva(colaborador.id, colaborador.nome)}}
                                />
                            </div>
                        )
                    })}
                </div>

                <Divider layout="vertical" align="center">
                    <i className="pi pi-arrows-h p-2 border-circle bg-primary"></i>
                </Divider>

                {/* Reservas */}
                <div className="flex flex-column flex-grow-1 gap-2 p-2 overflow-y-auto md:w-20rem">
                    <span className="spaceg mb-3">Reservas Selecionadas: </span>
                    <FloatLabel className="w-full mb-2">
                        <InputText
                            className="w-full"
                            value={searchReservas}
                            onChange={(e) => setSearchReservas(e.target.value)}
                        />
                        <label htmlFor="">Buscar Reservas.</label>
                    </FloatLabel>
                    {reservasFiltradas.map(reserva => {
                        const data = new Date(reserva.data)
                        return (
                            <div
                                key={reserva.id}
                                className="flex flex-grow-1 justify-content-between align-items-center border-round-lg p-2 shadow-5"
                                style={{
                                    background: "ghostwhite",
                                    color: "#333",
                                    maxHeight: '80px'
                                }}
                            >
                                <div className="flex flex-column gap-2">
                                    <div className="flex justify-content-center align-items-center">
                                        <span className="inter font-bold text-truncate">{reserva.matricula} - {reserva.nome}</span>
                                        <Divider className="h-1rem" layout="vertical" />
                                        <span className="spaceg flex align-items-center gap-1">
                                            <i className="pi pi-calendar-plus"></i>
                                            Criado em: {data.toLocaleDateString("pt-br", { day: "2-digit", month: "2-digit", year: "numeric" })}
                                        </span>
                                    </div>
                                    <div className="flex gap-2 align-items-center">
                                        <Tag className="bg-primary" rounded> {reserva.cargo} </Tag>
                                        <Tag style={{ background: "var(--gray-700)" }} rounded> <span>{reserva.situacao.toUpperCase()}</span> </Tag>
                                    </div>
                                </div>
                                <Button
                                    icon="pi pi-trash"
                                    severity="danger"
                                    onClick={() => delReserva(reserva.floater_id, reserva.nome)}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>
        </main>
    )
}