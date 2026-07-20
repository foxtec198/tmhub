export const BARCODE_PREFIX = 'TMHUB-PRODUTO';

export function buildProductBarcode(product) {
    const params = new URLSearchParams({
        id: String(product.id),
        nome: product.nome ?? '',
        local: product.local_estoque ?? '',
    });
    return `${BARCODE_PREFIX}?${params.toString()}`;
}

export function productIdFromBarcode(value) {
    if (!value) return null;

    const text = String(value).trim();
    if (text.startsWith(`${BARCODE_PREFIX}?`)) {
        const params = new URLSearchParams(text.slice(text.indexOf('?') + 1));
        const id = params.get('id');
        return id && !Number.isNaN(Number(id)) ? Number(id) : id;
    }

    // Compatibilidade com leitores configurados para retornar apenas o ID.
    if (/^\d+$/.test(text)) return Number(text);
    return null;
}
