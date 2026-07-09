import { useEffect, useRef, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import connect from "../utils/request";
import { useLoading } from "../contexts/LoadingContext";

export function DropdownWS({
    uri,
    uriParams = {},
    optionsValuesForDict = { nome: "nome"},
    className = "",
    placeholder = "Selecione",
    optionValue = "id",
    optionLabel = "nome",
    limit = 50,
    minSearch = 2,
    debounce = 400,
    value,
    onChange
}) {
    const [internalValue, setInternalValue] = useState(null);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const timeoutRef = useRef(null);

    const selectedValue = value !== undefined ? value : internalValue;

    async function buscarOptions(search = "") {
        try {
            if (search && search.length < minSearch) {
                setOptions([]);
                return;
            }

            setLoading(true);

            const params = new URLSearchParams();

            params.append("limit", limit);

            if (search) {
                params.append("search", search);
            }

            Object.entries(uriParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") {
                    params.append(key, value);
                }
            });

            const response = await connect.get(`${uri}?${params.toString()}`);

            const options = response.data.map(item => ({
                nome: item[optionsValuesForDict.nome],
                id: item.id
            }));
            setOptions(options);
        } catch (error) {
            console.error(error);
            setOptions([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        buscarOptions();

        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, [uri, JSON.stringify(uriParams)]);

    function handleFilter(e) {
        const search = e.filter?.trim() || "";

        clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            buscarOptions(search);
        }, debounce);
    }

    function handleChange(e) {
        if (onChange) { onChange(e.value); }
        else { setInternalValue(e.value); }
    }

    return (
        <Dropdown
            value={selectedValue}
            onChange={handleChange}
            options={options}
            optionLabel={optionLabel}
            optionValue={optionValue}
            onFilter={handleFilter}
            className={className}
            placeholder={placeholder}
            loading={loading}
            showClear
            filter
        />
    );
}