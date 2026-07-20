import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { productIdFromBarcode } from './barcode';
import './barcode-scanner.css';

export function BarcodeScanner({ visible, products, onHide, onProduct }) {
    const reactId = useId();
    const readerId = `barcode-reader-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const scannerRef = useRef(null);
    const handledRef = useRef(false);
    const productsRef = useRef(products);
    const onProductRef = useRef(onProduct);
    const [manualCode, setManualCode] = useState('');
    const [status, setStatus] = useState('Preparando a câmera…');

    useEffect(() => {
        productsRef.current = products;
        onProductRef.current = onProduct;
    }, [onProduct, products]);

    const resolveProduct = useCallback((decodedText) => {
        if (handledRef.current) return;
        const id = productIdFromBarcode(decodedText);
        const product = productsRef.current.find((item) => String(item.id) === String(id));

        if (!product) {
            setStatus('Código não reconhecido ou produto não encontrado.');
            return;
        }

        handledRef.current = true;
        setManualCode('');
        onProductRef.current(product);
    }, []);

    useEffect(() => {
        if (!visible) return undefined;

        handledRef.current = false;
        let cancelled = false;

        import('html5-qrcode').then(({ Html5Qrcode }) => {
            if (cancelled) return undefined;
            const scanner = new Html5Qrcode(readerId, { verbose: false });
            scannerRef.current = scanner;

            return scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 280, height: 130 }, aspectRatio: 1.6 },
                resolveProduct,
                () => undefined,
            ).then(() => {
                if (cancelled) return scanner.stop();
                setStatus('Aponte a câmera para o código de barras.');
                return undefined;
            });
        }).catch(() => {
            if (!cancelled) setStatus('Não foi possível acessar a câmera. Digite ou use um leitor USB abaixo.');
        });

        return () => {
            cancelled = true;
            const current = scannerRef.current;
            scannerRef.current = null;
            if (current?.isScanning) current.stop().catch(() => undefined);
        };
    }, [readerId, resolveProduct, visible]);

    return (
        <Dialog
            header="Ler código de barras"
            visible={visible}
            onHide={onHide}
            style={{ width: 'min(34rem, 94vw)' }}
            className="barcode-scanner-dialog"
        >
            <div className="barcode-scanner-content">
                <div id={readerId} className="barcode-camera" />
                <p className="barcode-scanner-status" role="status">{status}</p>
                <div className="barcode-manual-row">
                    <InputText
                        value={manualCode}
                        onChange={(event) => setManualCode(event.target.value)}
                        onKeyDown={(event) => event.key === 'Enter' && resolveProduct(manualCode)}
                        placeholder="Cole o código ou use o leitor USB"
                        aria-label="Código de barras"
                        autoFocus
                    />
                    <Button type="button" icon="pi pi-arrow-right" label="Usar" onClick={() => resolveProduct(manualCode)} />
                </div>
            </div>
        </Dialog>
    );
}
