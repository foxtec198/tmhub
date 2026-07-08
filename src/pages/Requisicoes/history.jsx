import { Table } from "../../components/tables/Table";

export function History(){
    return (
        <>
            <h2 className="inter flex align-items-center gap-2" style={{ color: "var(--green-600)", fontWeight: 900 }}>
                <i className="pi pi-clock"></i>
                Histórico
            </h2>
            <Table
                data={[]}
            />
        </>
    )
}