import connect from "../../../utils/request";

export async function getProjects() {
    const { data } = await connect.get("/projetos");
    return data;
}

export async function getProject(id) {
    const { data } = await connect.get(`/projetos?id=${id}`);
    return data;
}

export async function createProject(body) {
    const { data } = await connect.post("/projetos", body);
    return data;
}

export async function renameProject(id, nome) {
    await connect.patch(`/projetos?id=${id}`, {
        nome
    });
}

export async function getUsers(){
    const { data }  = await connect.get("/usuarios")
    return data;
}