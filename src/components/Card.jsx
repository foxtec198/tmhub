export function DashCard({
    title,
    icon,
    className,
    style,
    value,
    cont=0,
    contStyle={}
}) {

    return (
        <div className={`shadow-5 ${className}`} style={style}>
            <span className="flex gap-2 align-items-center text-truncate inter spaceg font-bold text-xl p-2">
                {icon ? <i className={icon}></i> : null} {title} 
            </span>

            <div className="flex gap-2 justify-content-around inter align-items-end font-bold">
                <span className="text-3xl">{value}</span>
                {cont?
                    <span style={contStyle}>{cont}</span>
                :null}
            </div>
        </div>
    )
}
