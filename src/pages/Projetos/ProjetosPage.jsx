import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { createProject, getProjects, getUsers, renameProject, updateProject } from './services/project';
import { deleteCard, updateCard } from './services/card';
import ProjectsSidebar from '../../components/ProjectsSidebar';
import KanbanBoard from '../../components/KanbanBoard';
import CardDetailDialog from '../../components/CardDetailDialog';
import MembersDialog from '../../components/MembersDialog';
import NewProjectDialog from '../../components/NewProjectDialog';
import './ProjetosPage.css';

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [projetoAtivoId, setProjetoAtivoId] = useState(null);
  const [cardSelecionado, setCardSelecionado] = useState(null);
  const [projetoParaMembrosId, setProjetoParaMembrosId] = useState(null);
  const [novoProjetoAberto, setNovoProjetoAberto] = useState(false);

  const projetoParaMembros = projetoParaMembrosId
    ? projetos.find((p) => p.id === projetoParaMembrosId) || null
    : null;

  const meusProjetos = useMemo(
    () => projetos.filter((p) => (p.memberIds || []).includes(currentUserId)),
    [projetos, currentUserId]
  );

  const projetoAtivo = useMemo(() => {
    if (projetoAtivoId) return meusProjetos.find((p) => p.id === projetoAtivoId) || null;
    return meusProjetos[0] || null;
  }, [meusProjetos, projetoAtivoId]);

  async function atualizarProjeto(projetoAtualizado) {
    setProjetos((prev) => prev.map((p) => (p.id === projetoAtualizado.id ? projetoAtualizado : p)));
    const data = await updateProject(projetoAtualizado.id, projetoAtualizado);
    setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
  }

  async function renomearProjeto(id, novoNome) {
    setProjetos((prev) => prev.map((p) => (p.id === id ? { ...p, nome: novoNome } : p)));
    const data = await renameProject(id, novoNome);
    setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
  }

  async function alternarMembro(projetoId, usuarioId) {
    const projeto = projetos.find((p) => p.id === projetoId);
    if (!projeto) return;

    const jaEhMembro = projeto.memberIds.includes(usuarioId);
    const projetoAtualizado = {
      ...projeto,
      memberIds: jaEhMembro
        ? projeto.memberIds.filter((id) => id !== usuarioId)
        : [...projeto.memberIds, usuarioId],
    };

    setProjetos((prev) => prev.map((p) => (p.id === projetoId ? projetoAtualizado : p)));
    const data = await updateProject(projetoId, projetoAtualizado);
    setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
  }

  async function criarProjeto(novoProjeto) {
    const data = await createProject(novoProjeto);
    setProjetos((prev) => [...prev, data]);
    setProjetoAtivoId(data.id);
  }

  async function salvarCard(cardAtualizado) {
    if (!projetoAtivo) return;

    const projetoAtualizado = {
      ...projetoAtivo,
      cards: { ...projetoAtivo.cards, [cardAtualizado.id]: cardAtualizado },
    };
    setProjetos((prev) => prev.map((p) => (p.id === projetoAtualizado.id ? projetoAtualizado : p)));
    const data = await updateCard(cardAtualizado.id, cardAtualizado);
    setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    setCardSelecionado(null);
  }

  async function excluirCard(cardId) {
    if (!projetoAtivo) return;

    const cards = { ...projetoAtivo.cards };
    delete cards[cardId];
    const columns = projetoAtivo.columns.map((c) => ({
      ...c,
      cardIds: c.cardIds.filter((id) => id !== cardId),
    }));
    const projetoAtualizado = { ...projetoAtivo, cards, columns };

    setProjetos((prev) => prev.map((p) => (p.id === projetoAtualizado.id ? projetoAtualizado : p)));
    const data = await deleteCard(cardId);
    setProjetos((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    setCardSelecionado(null);
  }

  const membrosDoProjetoAtivo = projetoAtivo
    ? projetoAtivo.memberIds.map((id) => usuarios.find((u) => u.id === id)).filter(Boolean)
    : [];

  async function loadProjects() {
    const users = await getUsers();
    setUsuarios(users);
    
    const data = await getProjects();
    setProjetos(data);
  }
  
  useEffect(() => {
    const id = localStorage.getItem("current_id")
    setCurrentUserId(parseInt(id))
    loadProjects();
  }, []);

  return (
    <div className="projetos-page" style={{ height: '90dvh' }}>
      <ProjectsSidebar
        projetos={meusProjetos}
        projetoAtivoId={projetoAtivo?.id}
        todosUsuarios={usuarios}
        onSelect={setProjetoAtivoId}
        onRename={renomearProjeto}
        onOpenMembers={(id) => setProjetoParaMembrosId(id)}
        onNovoProjeto={() => setNovoProjetoAberto(true)}
      />

      <div className="projetos-board-wrapper">
        <div className="projetos-board-wrapper__topo">
          <div className="flex align-items-center gap-3">
            <h2 className="m-0 text-xl font-semibold">{projetoAtivo ? projetoAtivo.nome : 'Projetos'}</h2>
            {projetoAtivo && (
              <AvatarGroup>
                {membrosDoProjetoAtivo.map((m) => (
                  <Avatar
                    key={m.id}
                    label={m.iniciais}
                    shape="circle"
                    style={{ backgroundColor: m.avatarColor, color: '#fff' }}
                    title={m.nome}
                  />
                ))}
              </AvatarGroup>
            )}
          </div>

          <div className="flex align-items-center gap-2">
            {projetoAtivo && (
              <Button
                icon="pi pi-users"
                label="Membros"
                text
                onClick={() => setProjetoParaMembrosId(projetoAtivo.id)}
              />
            )}

            <Dropdown
              value={currentUserId}
              options={usuarios}
              optionLabel="nome"
              optionValue="id"
              onChange={(e) => { setCurrentUserId(e.value); setProjetoAtivoId(null); }}
              className="w-14rem"
              title="Ver como"
            />
          </div>
        </div>

        {projetoAtivo ? (
          <KanbanBoard
            projeto={projetoAtivo}
            todosUsuarios={usuarios}
            onUpdateProjeto={atualizarProjeto}
            onOpenCard={setCardSelecionado}
          />
        ) : (
          <div className="flex flex-column align-items-center justify-content-center flex-1 gap-3 p-5">
            <i className="pi pi-inbox text-4xl text-color-secondary" />
            <p className="text-color-secondary m-0">
              Voce ainda nao tem projetos. Crie o primeiro ao lado.
            </p>
            <Button label="Novo projeto" icon="pi pi-plus" onClick={() => setNovoProjetoAberto(true)} />
          </div>
        )}
      </div>

      <CardDetailDialog
        visible={!!cardSelecionado}
        card={cardSelecionado}
        membrosDoProjeto={membrosDoProjetoAtivo}
        onHide={() => setCardSelecionado(null)}
        onSave={salvarCard}
        onDelete={excluirCard}
      />

      <MembersDialog
        visible={!!projetoParaMembros}
        projeto={projetoParaMembros}
        todosUsuarios={usuarios}
        onHide={() => setProjetoParaMembrosId(null)}
        onToggleMember={alternarMembro}
      />

      <NewProjectDialog
        visible={novoProjetoAberto}
        todosUsuarios={usuarios}
        currentUserId={currentUserId}
        onHide={() => setNovoProjetoAberto(false)}
        onCreate={criarProjeto}
      />
    </div>
  );
}
