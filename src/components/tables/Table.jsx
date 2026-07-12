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
    mode = "paginate",
    rows = 5,
    rowsPerPageOptions = [5, 10, 50, 100],
    tableClassName,
    dateValue,
    setRefresh,
    style,
    tableStyle,
    search,
    handleSetDate,
}) {
    const [globalFilterDash, setGlobalFilterDash] = useState("");

    const renderResponsiveCell = (column) => (rowData, options) => {
        const content = typeof column.body === "function"
            ? column.body(rowData, options)
            : rowData?.[column.field];

        return (
            <div className="tm-table-cell">
                <span className="tm-table-card-label">{column.mobileHeader || column.header}</span>
                <div className="tm-table-card-value">{content ?? "—"}</div>
            </div>
        );
    };

    const header = (
        <div className="tm-table-header flex min-w-full justify-content-between align-items-center gap-3">
            {search
                ? <FloatLabel className="mt-3">
                    <InputText
                        value={globalFilterDash}
                        onChange={(e) => setGlobalFilterDash(e.target.value)}
                    />
                    <label htmlFor="">Buscar...</label>
                </FloatLabel> : null
            }

            {handleSetDate
                ? <FloatLabel>
                    <Calendar
                        value={dateValue}
                        onChange={(e) => {
                            handleSetDate(e.value);
                            setRefresh?.((prev) => !prev);
                        }}
                        dateFormat="dd/mm/yy"
                        selectionMode="range"
                        placeholder="Selecione um período."
                        readOnlyInput
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
            globalFilter={globalFilterDash}
            header={header}
            emptyMessage="Nenhum resultado encontrado."
            paginator={mode === "paginate"}
            rows={rows}
            rowsPerPageOptions={rowsPerPageOptions}

            scrollable
            scrollHeight={mode === "scroll" ? "400px" : undefined}
            tableStyle={{
                minWidth: `${Math.max(columns.length * 180, 800)}px`,
                ...tableStyle,
            }}

            paginatorTemplate="RowsPerPageDropdown CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            currentPageReportTemplate="Mostrando {first} até {last} de {totalRecords} resultados"
            stripedRows
            style={{
                width: "100%",
                ...style,
            }}
            className={`tm-responsive-table ${tableClassName || ""}`}
        >
            {columns.map((col) => (
                <Column
                    key={col.field || col.header}
                    field={col.field}
                    header={col.header}
                    body={renderResponsiveCell(col)}
                    sortable={col.sortable}
                    style={col.style}
                    className={col.class}
                />
            ))}
        </DataTable>
    );
}
