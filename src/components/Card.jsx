export function DashCard({
    title,
    icon,
    className,
    style,
    value,
    cont
}) {

    return (
        <div className={`shadow-5 ${className}`} style={style}>
            <span className="flex gap-2 align-items-center inter spaceg font-bold text-xl p-2"> 
                {icon ? <i className={icon}></i> : null} {title} 
            </span>

            <div className="flex justify-content-center inter align-items-center font-bold">
                <span className="text-3xl">{value}</span>
            </div>
        </div>
    )
}