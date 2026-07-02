export function to_real(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(Number(value) || 0);
}

export function capitalize(text){
    const first_letter = text[0].toUpperCase()
    return first_letter + text.toLowerCase().slice(1, text.length)
}

export const deny_roles = ["User"]
export const allow_roles = ["Admin"]