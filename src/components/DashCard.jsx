import { Tag } from "primereact/tag";

export function DashCard({
    title,
    icon,
    className,
    style,
    value,
    cont=0,
    contStyle={},
    contSeverity,
    contClassName="",
    valueClassName="text-3xl"
}) {

    return (
        <div className={`shadow-5 ${className}`} style={style}>
            <span className="flex gap-2 align-items-center text-truncate inter spaceg font-bold text-xl p-2">
                {icon ? <i className={icon}></i> : null} {title} 
            </span>

            <div className="flex gap-2 justify-content-center inter align-items-start font-bold px-2">
                <span className={valueClassName}>{value}</span>
                {cont?
                    <Tag
                        value={cont}
                        severity={contSeverity}
                        rounded
                        className={contClassName}
                        style={{
                            fontSize: "0.9rem",
                            transform: "translateY(-0.2rem)",
                            ...contStyle,
                        }}
                    />
                :null}
            </div>
        </div>
    )
}
