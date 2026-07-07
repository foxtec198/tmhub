import connect from "../utils/request";

export async function updateCard(id, body) {
    await connect.patch(`/projects/cards/${id}`, body);
}

export async function createCard(projectId, body) {
    const { data } = await connect.post(
        `/projects/${projectId}/cards`,
        body
    );

    return data;
}

export async function deleteCard(id) {
    await connect.delete(`/projects/cards/${id}`);
}