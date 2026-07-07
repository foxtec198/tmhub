// components/KanbanBoard.jsx
import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import KanbanColumn from '../pages/Projetos/KanbanColumn';

export default function KanbanBoard({ projeto, todosUsuarios, onUpdateProjeto, onOpenCard }) {
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [novaColunaAberta, setNovaColunaAberta] = useState(false);
  const [novaColunaTitulo, setNovaColunaTitulo] = useState('');

  function membrosPorCard(card) {
    return (card.memberIds || [])
      .map((id) => todosUsuarios.find((u) => u.id === id))
      .filter(Boolean);
  }

  function handleDragStart(e, cardId) {
    setDraggingCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggingCardId(null);
  }

  // Move o card arrastado para a coluna/posição alvo
  function moverCard(colunaDestinoId, index) {
    if (!draggingCardId) return;

    const columns = projeto.columns.map((col) => ({ ...col, cardIds: [...col.cardIds] }));

    // remove o card de onde estava
    let colunaOrigem = null;
    for (const col of columns) {
      const pos = col.cardIds.indexOf(draggingCardId);
      if (pos !== -1) {
        colunaOrigem = col;
        col.cardIds.splice(pos, 1);
        break;
      }
    }
    if (!colunaOrigem) return;

    const colunaDestino = columns.find((c) => c.id === colunaDestinoId);
    if (!colunaDestino) return;

    const indiceFinal = Math.min(index, colunaDestino.cardIds.length);
    colunaDestino.cardIds.splice(indiceFinal, 0, draggingCardId);

    onUpdateProjeto({ ...projeto, columns });
  }

  function handleDropCard(colunaId, index) {
    moverCard(colunaId, index);
  }

  function handleDropOnColumnEnd(colunaId) {
    const coluna = projeto.columns.find((c) => c.id === colunaId);
    moverCard(colunaId, coluna ? coluna.cardIds.length : 0);
  }

  function renomearColuna(colunaId, novoTitulo) {
    const columns = projeto.columns.map((c) => (c.id === colunaId ? { ...c, titulo: novoTitulo } : c));
    onUpdateProjeto({ ...projeto, columns });
  }

  function excluirColuna(colunaId) {
    const columns = projeto.columns.filter((c) => c.id !== colunaId);
    const cards = { ...projeto.cards };
    onUpdateProjeto({ ...projeto, columns, cards });
  }

  function adicionarCard(colunaId, titulo) {
    const novoId = `t${Date.now()}`;
    const cards = {
      ...projeto.cards,
      [novoId]: { id: novoId, titulo, descricao: '', memberIds: [], etiqueta: null },
    };
    const columns = projeto.columns.map((c) =>
      c.id === colunaId ? { ...c, cardIds: [...c.cardIds, novoId] } : c
    );
    onUpdateProjeto({ ...projeto, columns, cards });
  }

  function confirmarNovaColuna() {
    const titulo = novaColunaTitulo.trim();
    if (titulo) {
      const novaId = `c${Date.now()}`;
      onUpdateProjeto({
        ...projeto,
        columns: [...projeto.columns, { id: novaId, titulo, cardIds: [] }],
      });
    }
    setNovaColunaTitulo('');
    setNovaColunaAberta(false);
  }

  return (
    <div className="kanban-board">
      {projeto.columns.map((coluna) => (
        <KanbanColumn
          key={coluna.id}
          coluna={coluna}
          cards={coluna.cardIds.map((id) => projeto.cards[id]).filter(Boolean)}
          membrosPorCard={membrosPorCard}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDropCard={handleDropCard}
          onDropOnColumnEnd={handleDropOnColumnEnd}
          draggingCardId={draggingCardId}
          onCardClick={onOpenCard}
          onRenameColumn={renomearColuna}
          onAddCard={adicionarCard}
          onDeleteColumn={excluirColuna}
        />
      ))}

      <div className="kanban-board__nova-coluna">
        {novaColunaAberta ? (
          <div className="kanban-board__nova-coluna-form">
            <InputText
              autoFocus
              placeholder="Título da coluna..."
              value={novaColunaTitulo}
              onChange={(e) => setNovaColunaTitulo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmarNovaColuna();
                if (e.key === 'Escape') { setNovaColunaAberta(false); setNovaColunaTitulo(''); }
              }}
            />
            <div className="kanban-board__nova-coluna-acoes">
              <Button label="Adicionar" size="small" onClick={confirmarNovaColuna} />
              <Button icon="pi pi-times" text size="small" severity="secondary" onClick={() => setNovaColunaAberta(false)} />
            </div>
          </div>
        ) : (
          <Button
            label="Adicionar coluna"
            icon="pi pi-plus"
            text
            onClick={() => setNovaColunaAberta(true)}
          />
        )}
      </div>
    </div>
  );
}
