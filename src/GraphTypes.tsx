type GenealogyAdvisor = {
    advisorId: number,
    advisorName: string,
    advisorNumber: number
}

type GenealogyNodeDissertation = {
    nodeId: number,
    nodeName: string,
    phdprefix: string | null,
    university: string | null,
    yearofcompletion: string | null,
    dissertationtitle: string | null,
    mscnumber: string | null,
    advisors: Array<GenealogyAdvisor> | null,
}

type GenealogyNodeStudent = {
    id: number,
    name: string
}

type GenealogyNode = {
    id: number,
    name: string,
    dissertations: Array<GenealogyNodeDissertation> | null,
    students: Array<GenealogyNodeStudent> | null,
    numberofdescendents: number
}

type GenealogyEdge = {
    fromNodeId: number,
    toNodeId: number
}

type Graph = {
    base: number,
    generationsUp: number,
    generationsDown: number,
    numberOfNodes: number,
    numberOfEdges: number,
    nodes: Array<GenealogyNode>,
    edges: Array<GenealogyEdge>
}

type NotablePerson = {
    id: number,
    fields: boolean,
    abel: boolean,
    note: string
}

export enum Preset {
    johnbenjaminmccarthy = "johnbenjaminmccarthy",
    johnbenjaminmccarthybig = "johnbenjaminmccarthybig",
    ruadhaidervan = "ruadhaidervan",
    kellifrancisstaite = "kellifrancisstaite",
    simondonaldson = "simondonaldson"
}

export type { Graph, GenealogyEdge, GenealogyNode, GenealogyNodeDissertation, GenealogyNodeStudent, GenealogyAdvisor, NotablePerson };