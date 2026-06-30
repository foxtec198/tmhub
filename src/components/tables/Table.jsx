// components/Table/index.jsx
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { useState } from "react";
import { Calendar } from "primereact/calendar";
import { FloatLabel } from "primereact/floatlabel";
import './index.css'

export function Table({
    data = [],
    columns = [],
    loading = false,
    mode = "paginate", // "paginate" ou "scroll"
    rows = 10,
    tableClassName,
    dateValue,
    handleSetDate,
    setRefresh,
    style

}) {
    const [globalFilter, setGlobalFilter] = useState("");
    
    const header = (
        <div className="flex min-w-full justify-content-between align-items-center">
            <FloatLabel>

                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                />
                <label htmlFor="">Buscar...</label>
            </FloatLabel>

            {handleSetDate
                ? <FloatLabel>
                    <Calendar
                        value={dateValue}
                        onChange={(e) => { handleSetDate(e.target.value); setRefresh(prev => !prev) }}
                        dateFormat="dd/mm/yy"
                        showButtonBar
                    />
                    <label htmlFor="">Selecione um periodo</label>
                </FloatLabel>
                : null
            }
        </div>
    );

    return (
        <DataTable
            value={data}
            loading={loading}
            globalFilter={globalFilter}
            header={header}
            emptyMessage="Nenhum resultado encontrado."
            paginator={mode === "paginate"}
            rows={rows}
            scrollable={mode === "scroll"}
            scrollHeight={mode === "scroll" ? "400px" : undefined}
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            currentPageReportTemplate="Mostrando {first} até {last} de {totalRecords} resultados"
            stripedRows
            style={style}
            className={tableClassName}
        >
            {columns.map((col) => (
                <Column
                    key={col.field || col.header}
                    field={col.field}
                    header={col.header}
                    body={col.body}
                    sortable={col.sortable}
                    style={col.style}
                    className={col.class}
                />
            ))}
        </DataTable>
    );
}