// components/KanbanCard.jsx
import React from 'react';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { Tag } from 'primereact/tag';

export default function KanbanCard({ card, membros, onDragStart, onDragEnd, onClick, isDragging }) {
  return (
    <div
      className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(card)}
    >
      {card.etiqueta && (
        <Tag value={card.etiqueta} className="kanban-card__tag" />
      )}

      <p className="kanban-card__titulo">{card.titulo}</p>

      {card.descricao && (
        <p className="kanban-card__descricao">{card.descricao}</p>
      )}

      {membros.length > 0 && (
        <div className="kanban-card__rodape">
          <AvatarGroup>
            {membros.map((m) => (
              <Avatar
                key={m.id}
                label={m.iniciais}
                shape="circle"
                size="normal"
                style={{ backgroundColor: m.avatarColor, color: '#fff', fontSize: '0.75rem' }}
                title={m.nome}
              />
            ))}
          </AvatarGroup>
        </div>
      )}
    </div>
  );
}
