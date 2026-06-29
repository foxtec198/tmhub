import { Button } from "primereact/button"
import { DashCard } from "../../components/Card"

export function RequestReport() {
    return (
        <main className="flex p-4">
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
                    value = '0'
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
                    value = '0'
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
                    value = '0'
                />
            </div>
        </main>
    )
}