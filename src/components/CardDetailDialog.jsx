// components/CardDetailDialog.jsx
import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';

export default function CardDetailDialog({ visible, card, membrosDoProjeto, onHide, onSave, onDelete }) {
  // O formulário usa cópias locais para não alterar o card antes de Salvar.
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [memberIds, setMemberIds] = useState([]);

  // Trocar o card selecionado reinicializa todos os campos do diálogo.
  useEffect(() => {
    if (card) {
      setTitulo(card.titulo || '');
      setDescricao(card.descricao || '');
      setEtiqueta(card.etiqueta || '');
      setMemberIds(card.memberIds || []);
    }
  }, [card]);

  if (!card) return null;

  // Preserva o título anterior quando o campo for enviado vazio.
  function salvar() {
    onSave({
      ...card,
      titulo: titulo.trim() || card.titulo,
      descricao,
      etiqueta: etiqueta.trim() || null,
      memberIds,
    });
  }

  return (
    <Dialog
      header="Detalhes do card"
      visible={visible}
      style={{ width: '32rem' }}
      onHide={onHide}
      footer={
        <div className="flex justify-content-between">
          <Button label="Excluir card" icon="pi pi-trash" severity="danger" text onClick={() => onDelete(card.id)} />
          <div>
            <Button label="Cancelar" text onClick={onHide} />
            <Button label="Salvar" icon="pi pi-check" onClick={salvar} />
          </div>
        </div>
      }
    >
      <div className="flex flex-column gap-3">
        <div>
          <label className="block text-sm text-color-secondary mb-1">Título</label>
          <InputText className="w-full" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm text-color-secondary mb-1">Descrição</label>
          <InputTextarea
            className="w-full"
            rows={4}
            autoResize
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Adicione mais detalhes..."
          />
        </div>

        <div>
          <label className="block text-sm text-color-secondary mb-1">Etiqueta</label>
          <InputText className="w-full" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} placeholder="Ex: Compras, Financeiro..." />
        </div>

        <div>
          <label className="block text-sm text-color-secondary mb-1">Responsáveis</label>
          <MultiSelect
            className="w-full"
            value={memberIds}
            options={membrosDoProjeto}
            optionLabel="nome"
            optionValue="id"
            display="chip"
            placeholder="Selecione os membros"
            itemTemplate={(m) => (
              <div className="flex align-items-center gap-2">
                <Avatar label={m.iniciais} shape="circle" size="normal" style={{ backgroundColor: m.avatarColor, color: '#fff' }} />
                <span>{m.nome}</span>
              </div>
            )}
            onChange={(e) => setMemberIds(e.value)}
          />
        </div>
      </div>
    </Dialog>
  );
}
