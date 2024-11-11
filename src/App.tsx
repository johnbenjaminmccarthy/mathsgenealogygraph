
import './style.scss'
import * as d3 from 'd3';
import {useEffect, useRef} from "react";
import johnbenjaminmccarthy from './assets/graph_data/johnbenjaminmccarthy.json';
import {D3ZoomEvent, max} from "d3";

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
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!);
        svg.selectAll("*").remove();
        svg
            .attr("viewBox", [-width/2, -height/2, width, height])
            .attr("style", "max-width: 100%; height: auto;")
            .attr("cursor", "grab");

        const boxG = svg.append("g")
            .attr("id", "grid");

        const numBoxes = 25;
        const arr = d3.range(-numBoxes, numBoxes + 1);
        const maxDimension = max([width, height])!;
        const boxSize = (maxDimension)/numBoxes;

        const boxEnter = boxG.selectAll("line").data(arr).enter();
        boxEnter.append("line")
            .attr("x1", d => d*boxSize)
            .attr("x2", d => d*boxSize)
            .attr("y1", -maxDimension - boxSize)
            .attr("y2", maxDimension + boxSize);
        boxEnter.append("line")
            .attr("x1", -maxDimension - boxSize)
            .attr("x2", maxDimension + boxSize)
            .attr("y1", d=> d*boxSize)
            .attr("y2", d => d*boxSize);



        svg.call(d3.zoom<SVGSVGElement, unknown>()
            .extent([[0,0], [width,height]])
            .scaleExtent([0.5,2])
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
            .attr("id", "link")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", /*d => */Math.sqrt(2))
            .attr("marker-mid", "url(#arrow)");

        const node = svg.append("g")
            .attr("id", "node")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => d.color);

        const labels = svg.append("g")
            .attr("id", "labels")
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
            const transformString = "translate(" + x + ", " + y + ") scale(" + k + ")";

            if ((event.sourceEvent as Event).type === "mousemove") {
                svg.attr("cursor", "grabbing");
            }

            boxG.attr("transform", "translate(" + (x % boxSize*k) + ", " + (y % boxSize*k) + ") scale(" + k + ")");

            svg.select("#link").attr("transform", transformString);
            svg.select("#node").attr("transform", transformString);
            svg.select("#labels").attr("transform", transformString);
            //link.attr("transform", transformString);
            //node.attr("transform", transformString);
            //labels.attr("transform", transformString);


        }

        function zoomEnd() {
            svg.attr("cursor", "grab");
        }

        return svg.node();
    }

    function returnToCentre() {
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!);

        const boxG = svg.select("#grid");
        const link = svg.select("#link");
        const node = svg.select("#node");
        const labels = svg.select("#labels");

        const width = ref.current!.width.baseVal.value;
        const height = ref.current!.height.baseVal.value;
        const boxSize = max([width, height])!/25;

        const x = 0;
        const y = 0;
        const k = 1;
        const transformString = "translate(" + x + ", " + y + ") scale(1)";
        const modTransformString = "translate(" + (x % boxSize*k) + ", " + (y % boxSize*k) + ") scale(1)";
        boxG.transition()
            .duration(500)
            .attr("transform", modTransformString);
        link.transition()
            .duration(500)
            .attr("transform", transformString);
        node.transition()
            .duration(500)
            .attr("transform", transformString);
        labels.transition()
            .duration(500)
            .attr("transform", transformString);
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
          <button className={"returnToCentre"} onClick={() => returnToCentre()}>Return to graph</button>
      </>
  )
}

export default App
