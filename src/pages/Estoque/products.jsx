// CSS
import './products.css';

// Widgets
import { InputText } from 'primereact/inputtext';
import { FloatLabel } from 'primereact/floatlabel';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

// Utils
import { useEffect, useMemo, useState } from 'react';
import connect from '../../utils/request';
import { useLoading } from '../../contexts/LoadingContext';
import { useToast } from '../../contexts/ToastContext';

const PRODUCTS_ENDPOINT = '/estoque/produtos';

// Dados temporários de teste (mockados) para visualização da lista de produtos.
const USE_MOCK_DATA = true;

const MOCK_PRODUCTS = [
    {
        id: 1,
        name: 'Camisa Polo Verde',
        code: 'SKU-1023',
        category: 'Uniformes',
        location: '76000 - P.M DE APUCARANA',
        stock: 42,
        price: 'R$ 59,90',
        status: 'ativo',
    },
    {
        id: 2,
        name: 'Calça Operacional Cinza',
        code: 'SKU-1044',
        category: 'Uniformes',
        location: '87041 - ED. LONDRINA',
        stock: 3,
        price: 'R$ 89,90',
        status: 'baixo-estoque',
    },
    {
        id: 3,
        name: 'Colete Refletivo',
        code: 'SKU-1102',
        category: 'EPI',
        location: '76000 - P.M DE APUCARANA',
        stock: 0,
        price: 'R$ 34,50',
        status: 'esgotado',
    },
];
//-------------------------------------------------------------------------------------

const STATUS_TAG_MAP = {
    ativo: { label: 'Ativo', severity: 'success' },
    'baixo-estoque': { label: 'Baixo Estoque', severity: 'warning' },
    esgotado: { label: 'Esgotado', severity: 'danger' },
    inativo: { label: 'Inativo', severity: null },
};

function StatusTag({ status }) {
    const config = STATUS_TAG_MAP[status] ?? STATUS_TAG_MAP.inativo;
    return <Tag value={config.label} severity={config.severity} rounded />;
}

function ProductItem({ product, onEdit, onDelete }) {
    const initials = (product.name ?? '')
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    const unitPrice = parseFloat(
        String(product.price ?? '0')
            .replace(/[^\d,.-]/g, '')
            .replace(',', '.')
    ) || 0;

    const total = unitPrice * (product.stock ?? 0);

    const totalFormatted = total.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

    return (
        <li className="product-item">
            <div className="product-thumb">{initials}</div>

            <div className="product-info">
                <span className="product-name">{product.name}</span>
                <div className="product-meta">
                    <span>{product.code}</span>
                    <span>{product.category}</span>
                    <span>{product.location}</span>
                </div>
            </div>

            <div className="product-col">
                <span className="label">Estoque</span>
                <span className="value">{product.stock}</span>
            </div>

            <div className="product-col">
                <span className="label">Preço</span>
                <span className="value">{product.price}</span>
            </div>

            <div className="product-col">
                <span className="label">Total</span>
                <span className="value">{totalFormatted}</span>
            </div>

            <div className="product-col">
                <span className="label">Status</span>
                <StatusTag status={product.status} />
            </div>

            <div className="product-actions">
                <Button
                    icon="pi pi-pencil"
                    className="action-btn edit"
                    rounded
                    text
                    onClick={() => onEdit(product)}
                    tooltip="Editar produto"
                />
                <Button
                    icon="pi pi-trash"
                    className="action-btn delete"
                    rounded
                    text
                    onClick={() => onDelete(product)}
                    tooltip="Excluir produto"
                />
            </div>
        </li>
    );
}

export function Products() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [refresh, setRefresh] = useState(false);

    const setLoading = useLoading();
    const { showToast } = useToast();

    useEffect(() => {
        async function getProducts() {
            setLoading(true);
            try {
                const res = await connect.get(PRODUCTS_ENDPOINT);
                setProducts(res.data ?? []);
            } catch (err) {
                if (USE_MOCK_DATA) {
                    // Fallback só pra teste visual, enquanto a API não existe.
                    setProducts(MOCK_PRODUCTS);
                }
                // showToast('error', 'Erro!', 'Não foi possível carregar os produtos.');
            } finally {
                setLoading(false);
            }
        }
        getProducts();
    }, [refresh]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return products;

        return products.filter((product) =>
            [product.name, product.code, product.category, product.location]
                .join(' ')
                .toLowerCase()
                .includes(query)
        );
    }, [products, search]);

    // TODO: abrir modal/rota de cadastro de produto
    const handleAddProduct = () => {
        console.log('Adicionar novo produto');
    };

    // TODO: abrir modal/rota de edição com os dados do produto
    const handleEditProduct = (product) => {
        console.log('Editar produto', product);
    };

    const handleDeleteProduct = async (product) => {
        setLoading(true);
        try {
            await connect.delete(`${PRODUCTS_ENDPOINT}/${product.id}`);
            showToast('success', 'Sucesso!', 'Produto excluído com sucesso.');
            setRefresh((prev) => !prev);
        } catch (err) {
            showToast('error', 'Erro!', 'Não foi possível excluir o produto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex flex-column gap-3 products-page">
            <header className="products-header">
                <h2 className="products-title">Produtos</h2>
                <Button
                    icon="pi pi-plus"
                    size="large"
                    className="p-4"
                    rounded
                    onClick={handleAddProduct}
                    style={{
                        position: 'absolute',
                        right: '20px',
                        bottom: '20px',
                    }}
                />
            </header>

            <div className="products-toolbar">
                <FloatLabel>
                    <InputText
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <label htmlFor="">Buscar...</label>
                </FloatLabel>
            </div>

            {filteredProducts.length > 0 ? (
                <ul className="products-list">
                    {filteredProducts.map((product) => (
                        <ProductItem
                            key={product.id}
                            product={product}
                            onEdit={handleEditProduct}
                            onDelete={handleDeleteProduct}
                        />
                    ))}
                </ul>
            ) : (
                <div className="products-empty">
                    <strong>Nenhum produto encontrado</strong>
                    Tente ajustar sua busca ou cadastre um novo produto.
                </div>
            )}
        </main>
    );
}
