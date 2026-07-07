import { useEffect, useMemo, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { getProjects, getUsers } from './services/project';
import ProjectsSidebar from '../../components/ProjectsSidebar';
import KanbanBoard from '../../components/KanbanBoard';
import CardDetailDialog from '../../components/CardDetailDialog';
import MembersDialog from '../../components/MembersDialog';
import NewProjectDialog from '../../components/NewProjectDialog';
import './ProjetosPage.css';

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(2); // troque por usuário logado real
  const [MOCK_USERS, SET_MOCK_USERS] = useState([])

  const [projetoAtivoId, setProjetoAtivoId] = useState(null);

  const [cardSelecionado, setCardSelecionado] = useState(null);
  const [projetoParaMembrosId, setProjetoParaMembrosId] = useState(null);
  const [novoProjetoAberto, setNovoProjetoAberto] = useState(false);

  // Deriva sempre do array atual, assim o dialog reflete a mudança na hora (checkbox marcado/desmarcado).
  const projetoParaMembros = projetoParaMembrosId
    ? projetos.find((p) => p.id === projetoParaMembrosId) || null
    : null;

  // Só entram na timeline os projetos em que o usuário atual é dono ou membro.
  const meusProjetos = useMemo(
    () => projetos.filter((p) => p.members.includes(currentUserId)),
    [projetos, currentUserId]
  );

  const projetoAtivo = useMemo(() => {
    if (projetoAtivoId) return meusProjetos.find((p) => p.id === projetoAtivoId) || null;
    return meusProjetos[0] || null;
  }, [meusProjetos, projetoAtivoId]);

  function atualizarProjeto(projetoAtualizado) {
    setProjetos((prev) => prev.map((p) => (p.id === projetoAtualizado.id ? projetoAtualizado : p)));
  }

  function renomearProjeto(id, novoNome) {
    setProjetos((prev) => prev.map((p) => (p.id === id ? { ...p, nome: novoNome } : p)));
  }

  function alternarMembro(projetoId, usuarioId) {
    setProjetos((prev) =>
      prev.map((p) => {
        if (p.id !== projetoId) return p;
        const jaEhMembro = p.memberIds.includes(usuarioId);
        return {
          ...p,
          memberIds: jaEhMembro
            ? p.memberIds.filter((id) => id !== usuarioId)
            : [...p.memberIds, usuarioId],
        };
      })
    );
  }

  function criarProjeto(novoProjeto) {
    setProjetos((prev) => [...prev, novoProjeto]);
    setProjetoAtivoId(novoProjeto.id);
  }

  function salvarCard(cardAtualizado) {
    if (!projetoAtivo) return;
    atualizarProjeto({
      ...projetoAtivo,
      cards: { ...projetoAtivo.cards, [cardAtualizado.id]: cardAtualizado },
    });
    setCardSelecionado(null);
  }

  function excluirCard(cardId) {
    if (!projetoAtivo) return;
    const cards = { ...projetoAtivo.cards };
    delete cards[cardId];
    const columns = projetoAtivo.columns.map((c) => ({
      ...c,
      cardIds: c.cardIds.filter((id) => id !== cardId),
    }));
    atualizarProjeto({ ...projetoAtivo, cards, columns });
    setCardSelecionado(null);
  }

  const membrosDoProjetoAtivo = projetoAtivo
    ? projetoAtivo.memberIds.map((id) => MOCK_USERS.find((u) => u.id === id)).filter(Boolean)
    : [];

  async function loadProjects() {
    const user = await getUsers();
    SET_MOCK_USERS(user)
    
    const data = await getProjects();
    setProjetos(data);

  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="projetos-page" style={{ height: '90dvh' }}>
      <ProjectsSidebar
        projetos={meusProjetos}
        projetoAtivoId={projetoAtivo?.id}
        todosUsuarios={MOCK_USERS}
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

            {/* Demonstração de multi-usuário: troque por sessão real do login.
                Isso só existe pra você validar que a timeline muda por pessoa. */}
            <Dropdown
              value={currentUserId}
              options={MOCK_USERS}
              optionLabel="nome"
              optionValue="id"
              onChange={(e) => { setCurrentUserId(e.value); setProjetoAtivoId(null); }}
              className="w-14rem"
              title="Ver como (demonstração)"
            />
          </div>
        </div>

        {projetoAtivo ? (
          <KanbanBoard
            projeto={projetoAtivo}
            todosUsuarios={MOCK_USERS}
            onUpdateProjeto={atualizarProjeto}
            onOpenCard={setCardSelecionado}
          />
        ) : (
          <div className="flex flex-column align-items-center justify-content-center flex-1 gap-3 p-5">
            <i className="pi pi-inbox text-4xl text-color-secondary" />
            <p className="text-color-secondary m-0">
              Você ainda não tem projetos. Crie o primeiro ao lado.
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
        todosUsuarios={MOCK_USERS}
        onHide={() => setProjetoParaMembrosId(null)}
        onToggleMember={alternarMembro}
      />

      <NewProjectDialog
        visible={novoProjetoAberto}
        todosUsuarios={MOCK_USERS}
        currentUserId={currentUserId}
        onHide={() => setNovoProjetoAberto(false)}
        onCreate={criarProjeto}
      />
    </div>
  );
}
