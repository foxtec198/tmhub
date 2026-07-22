import { Avatar } from 'primereact/avatar';

export default function ProjectMemberAvatar({ member, style, ...props }) {
  const photo = member?.foto_perfil || null;

  return (
    <Avatar
      {...props}
      image={photo || undefined}
      imageAlt={member?.nome || 'Membro do projeto'}
      label={photo ? undefined : member?.iniciais || 'U'}
      shape="circle"
      style={{
        backgroundColor: member?.avatarColor || '#2f9e44',
        color: '#fff',
        ...style,
      }}
      title={member?.nome}
    />
  );
}
