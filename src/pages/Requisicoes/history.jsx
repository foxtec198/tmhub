import { useEffect, useState } from "react";
import { Table } from "../../components/tables/Table";
import connect from "../../utils/request";

export function History(){
    const [dateFilter, setDateFilter] = useState({});

    useEffect(()=>{
        async function getHistory(){
            const res  = await connect.post("repo/history", dateFilter)
            console.log(res.data)
            
        }; getHistory();
    }, [])

    const columns = [
        {   
            header: ""
        }
    ]

    return (
        <>
            <h2 className="inter flex align-items-center gap-2" style={{ color: "var(--green-600)", fontWeight: 900 }}>
                <i className="pi pi-clock"></i>
                Histórico
            </h2>
            <Table
                data={dateFilter}
                columns={columns}
            />
        </>
    )
}