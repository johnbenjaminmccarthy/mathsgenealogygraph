
import './App.scss'
import * as d3 from 'd3';
import {useEffect, useRef} from "react";
import johnbenjaminmccarthy from './assets/graph_data/johnbenjaminmccarthy.json';
import {D3ZoomEvent} from "d3";

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

function App() {
    const ref = useRef<SVGSVGElement>(null);

    function buildGraph(data: Graph) {
        const width = ref.current!.width.baseVal.value;
        const height = ref.current!.height.baseVal.value;

        const radius = width/100;
        const bigRadius = radius * 1.2;

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const nodeIndex = new Map(data.nodes.map((it, index) => [it.id, index]));

        // The force simulation mutates links and nodes, so create a copy
        // so that re-evaluating this cell produces the same result.
        const links = data.edges.map(d => ({...d})).map(it => ({
            source: it.fromNodeId, target: it.toNodeId
        }));

        type D3Node = {
            genealogyNode: GenealogyNode,
            index: number,
            radius: number,
            color: string,
            x: number,
            y: number,
            vx: number,
            vy: number
        }

        const nodes = data.nodes.map(d => ({...d})).map(it => ({
            genealogyNode: it,
            index: nodeIndex.get(it.id),
            radius: it.id == data.base ? bigRadius : radius,
            color: it.id == data.base ? color("yellow") : color("white"),
            x: NaN,
            y: NaN,
            vx: NaN,
            vy: NaN
        }) as D3Node);

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => (d as D3Node).genealogyNode.id))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter())
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .force("collide", d3.forceCollide(d => d.radius * 2.5));

        // Create the SVG container.
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!)
            //.attr("width", width)
            //.attr("height", height)
            .attr("viewBox", [-width/2, -height/2, width, height])
            .attr("style", "max-width: 100%; height: auto;")
            .attr("cursor", "grab");

        svg.call(d3.zoom<SVGSVGElement, unknown>()
            .extent([[0,0], [width,height]])
            .scaleExtent([0.5,4])
            .on("zoom", zoomed)
            .on("end", zoomEnd));

        svg.append("svg:defs")
            .append("svg:marker")
            .attr("id", "arrow")
            .attr("viewBox", [0,0,10,10])
            .attr("refX", 15)
            .attr("refY", -1.5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 -5 10 10")
            .style("stroke", "white");

        // Add a line for each link, and a circle for each node.
        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", /*d => */Math.sqrt(2))
            .attr("marker-mid", "url(#arrow)");

        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => d.color);

        const labels = svg.append("g")
            .attr("class", "labels")
            .selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .style("text-anchor", "middle")
            .attr("dx", 0)
            .attr("dy", radius * 1.5)
            .style("font-size", (radius/1.5).toString() + "px")
            .text(d => d.genealogyNode.name);


        node.append("title")
            .text(d => d.genealogyNode.id);

        // Add a drag behavior.
        /*node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));*/

        // Set the position attributes of links and nodes and labels each time the simulation ticks.
        simulation.on("tick", () => {
            link
                .attr("x1", d => ((d.source as unknown) as D3Node).x)
                .attr("y1", d => ((d.source as unknown) as D3Node).y)
                .attr("x2", d => ((d.target as unknown) as D3Node).x)
                .attr("y2", d => ((d.target as unknown) as D3Node).y);

            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });



        function zoomed(event: D3ZoomEvent<SVGSVGElement, unknown>) {
            const x = event.transform.x;
            const y = event.transform.y;
            const k = event.transform.k;
            const transformString = "translate(" + -x + ", " + -y + ") scale(" + k + ")";

            if ((event.sourceEvent as Event).type === "mousemove") {
                svg.attr("cursor", "grabbing");
            }

            link.attr("transform", transformString);
            node.attr("transform", transformString);
            labels.attr("transform", transformString);
        }

        function zoomEnd() {
            svg.attr("cursor", "grab");
        }

        // Reheat the simulation when drag starts, and fix the subject position.
        /*
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        // Update the subject (dragged node) position during drag.
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        // Restore the target alpha so the simulation cools after dragging ends.
        // Unfix the subject position now that it’s no longer being dragged.
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }*/

        // When this cell is re-run, stop the previous simulation. (This doesn’t
        // really matter since the target alpha is zero and the simulation will
        // stop naturally, but it’s a good practice.)
        //invalidation.then(() => simulation.stop());

        return svg.node();
    }


    //Gets executed after SVG has been mounted
    useEffect(() => {
        buildGraph(johnbenjaminmccarthy);
        //ref.current.append(ref
    }, []);



  return (
      <>
          <div className={"svg"}>
              <svg className={"container"} ref={ref} width={"100%"} height={"100%"}></svg>
          </div>
      </>
  )
}

export default App
