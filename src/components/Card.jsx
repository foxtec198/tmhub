import { Card } from "primereact/card"
import { Button } from "primereact/button"

export function DashCard({
    title,
    icon,
    className,
    style,
    value,
    cont
}) {

    return (
        <div className={className} style={style}>
            <span className="flex gap-2 font-bold align-items-center inter text-xl p-2"> 
                {icon ? <i className={icon}></i> : null} {title} 
            </span>

            <div className="flex justify-content-center align-items-center">
                <span className="text-3xl">{value}</span>
            </div>

        </div>
    )
}