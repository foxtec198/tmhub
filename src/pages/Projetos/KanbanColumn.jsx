// components/KanbanColumn.jsx
import React, { useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({
  coluna,
  cards,
  membrosPorCard,
  onDragStart,
  onDragEnd,
  onDropCard,
  onDropOnColumnEnd,
  draggingCardId,
  onCardClick,
  onRenameColumn,
  onAddCard,
  onDeleteColumn,
}) {
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [tituloTemp, setTituloTemp] = useState(coluna.titulo);
  const [novoCardAberto, setNovoCardAberto] = useState(false);
  const [novoCardTitulo, setNovoCardTitulo] = useState('');
  const [overIndex, setOverIndex] = useState(null);
  const inputNovoCardRef = useRef(null);

  function confirmarRenomear() {
    const valor = tituloTemp.trim();
    if (valor) onRenameColumn(coluna.id, valor);
    else setTituloTemp(coluna.titulo);
    setEditandoTitulo(false);
  }

  function confirmarNovoCard() {
    const valor = novoCardTitulo.trim();
    if (valor) {
      onAddCard(coluna.id, valor);
      setNovoCardTitulo('');
      inputNovoCardRef.current?.focus();
    } else {
      setNovoCardAberto(false);
    }
  }

  function handleDragOverCard(e, index) {
    e.preventDefault();
    e.stopPropagation();
    setOverIndex(index);
  }

  function handleDropAtIndex(e, index) {
    e.preventDefault();
    e.stopPropagation();
    onDropCard(coluna.id, index);
    setOverIndex(null);
  }

  return (
    <div
      className="kanban-column"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onDropOnColumnEnd(coluna.id);
        setOverIndex(null);
      }}
    >
      <div className="kanban-column__header">
        {editandoTitulo ? (
          <InputText
            autoFocus
            value={tituloTemp}
            onChange={(e) => setTituloTemp(e.target.value)}
            onBlur={confirmarRenomear}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmarRenomear();
              if (e.key === 'Escape') { setTituloTemp(coluna.titulo); setEditandoTitulo(false); }
            }}
            className="kanban-column__titulo-input"
          />
        ) : (
          <span
            className="kanban-column__titulo"
            onClick={() => setEditandoTitulo(true)}
            title="Clique para renomear"
          >
            {coluna.titulo}
          </span>
        )}
        <span className="kanban-column__contador">{cards.length}</span>
        <Button
          icon="pi pi-trash"
          rounded
          text
          size="small"
          severity="secondary"
          className="kanban-column__excluir"
          onClick={() => onDeleteColumn(coluna.id)}
          title="Excluir coluna"
        />
      </div>

      <div className="kanban-column__lista">
        {cards.map((c, index) => (
          <div
            key={c.id}
            onDragOver={(e) => handleDragOverCard(e, index)}
            onDrop={(e) => handleDropAtIndex(e, index)}
            className={`kanban-column__slot ${overIndex === index ? 'kanban-column__slot--over' : ''}`}
          >
            <KanbanCard
              card={c}
              membros={membrosPorCard(c)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onCardClick}
              isDragging={draggingCardId === c.id}
            />
          </div>
        ))}

        {/* zona de soltar no final da coluna (depois do último card) */}
        <div
          className="kanban-column__espaco-final"
          onDragOver={(e) => handleDragOverCard(e, cards.length)}
          onDrop={(e) => handleDropAtIndex(e, cards.length)}
        />
      </div>

      {novoCardAberto ? (
        <div className="kanban-column__novo-card">
          <InputText
            ref={inputNovoCardRef}
            autoFocus
            placeholder="Título do card..."
            value={novoCardTitulo}
            onChange={(e) => setNovoCardTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirmarNovoCard();
              if (e.key === 'Escape') { setNovoCardAberto(false); setNovoCardTitulo(''); }
            }}
            className="w-full"
          />
          <div className="kanban-column__novo-card-acoes">
            <Button label="Adicionar" size="small" onClick={confirmarNovoCard} />
            <Button
              icon="pi pi-times"
              text
              size="small"
              severity="secondary"
              onClick={() => { setNovoCardAberto(false); setNovoCardTitulo(''); }}
            />
          </div>
        </div>
      ) : (
        <Button
          label="Adicionar card"
          icon="pi pi-plus"
          text
          className="kanban-column__botao-add"
          onClick={() => setNovoCardAberto(true)}
        />
      )}
    </div>
  );
}
