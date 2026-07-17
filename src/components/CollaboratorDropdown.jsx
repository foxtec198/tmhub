import { useEffect, useMemo, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import connect from "../utils/request";

const DEFAULT_LIMIT = 50;
const DEFAULT_DEBOUNCE = 350;

/**
 * Dropdown reutilizável de colaboradores.
 * A busca, o limite, o debounce e o virtual scroll ficam encapsulados para que
 * todas as telas consultem o banco da mesma forma, sem carregar a base inteira.
 */
export function CollaboratorDropdown({
    value,
    onChange,
    queryParams = {},
    limit = DEFAULT_LIMIT,
    debounce = DEFAULT_DEBOUNCE,
    className = "",
    placeholder = "Selecione um colaborador",
    emptyMessage = "Nenhum colaborador encontrado",
    showClear = true,
    disabled = false,
    appendTo,
    panelStyle,
    onError,
}) {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("");
    const selectedOptionRef = useRef(null); // Preserva a opção escolhida mesmo fora dos 50 resultados seguintes.
    const requestIdRef = useRef(0); // Identifica respostas antigas de buscas que terminaram fora de ordem.
    const serializedParams = useMemo(() => JSON.stringify(queryParams), [queryParams]);

    useEffect(() => {
        const requestId = ++requestIdRef.current;
        const timer = window.setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await connect.get("/funcionarios", {
                    params: { ...queryParams, search: filter.trim(), limit },
                });
                if (requestId !== requestIdRef.current) return;

                // O objeto completo acompanha a opção para consumidores que precisam de nome/matrícula.
                const remoteOptions = data.map((item) => ({
                    ...item,
                    label: item.matricula ? `${item.matricula} - ${item.nome}` : item.nome,
                }));
                const selected = selectedOptionRef.current;
                setOptions(selected && !remoteOptions.some((item) => item.id === selected.id)
                    ? [selected, ...remoteOptions]
                    : remoteOptions);
            } catch (error) {
                if (requestId !== requestIdRef.current) return;
                setOptions(selectedOptionRef.current ? [selectedOptionRef.current] : []);
                onError?.(error);
            } finally {
                if (requestId === requestIdRef.current) setLoading(false);
            }
        }, filter ? debounce : 0);

        return () => {
            window.clearTimeout(timer);
            requestIdRef.current += 1;
        };
        // serializedParams representa as propriedades individuais de queryParams.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debounce, filter, limit, serializedParams]);

    function handleChange(event) {
        // O primeiro argumento mantém compatibilidade com formulários que armazenam somente o ID.
        selectedOptionRef.current = event.value == null
            ? null
            : options.find((item) => item.id === event.value) || null;
        onChange?.(event.value, selectedOptionRef.current);
    }

    return (
        <Dropdown
            value={value}
            options={options}
            optionLabel="label"
            optionValue="id"
            onChange={handleChange}
            onFilter={(event) => setFilter(event.filter || "")}
            filter
            resetFilterOnHide
            loading={loading}
            virtualScrollerOptions={{ itemSize: 42 }} // Renderiza somente as opções visíveis do painel.
            className={className}
            placeholder={placeholder}
            emptyMessage={emptyMessage}
            emptyFilterMessage={emptyMessage}
            showClear={showClear}
            disabled={disabled}
            appendTo={appendTo}
            panelStyle={panelStyle}
        />
    );
}
