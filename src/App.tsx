import './style.scss'
import * as d3 from 'd3';
import {D3DragEvent, D3ZoomEvent} from 'd3';
import {useEffect, useRef, useState} from "react";

import johnbenjaminmccarthy from './assets/graph_data/johnbenjaminmccarthy.json';
import johnbenjaminmccarthybig from './assets/graph_data/johnbenjaminmccarthybig.json';
import ruadhaidervan from './assets/graph_data/ruadhaidervan.json';
import kellifrancisstaite from './assets/graph_data/kellifrancisstaite.json';
import simondonaldson from './assets/graph_data/simondonaldson.json';

import notablePeople from './assets/notable_people/notable_people.json';

import {InfoBox} from "./InfoBox.tsx";
import {GraphSelector} from "./GraphSelector.tsx";
import {GenealogyNode, Graph, NotablePerson, Preset} from './GraphTypes.tsx';


function App() {

    const [graphData, setGraphData] = useState<Graph>(johnbenjaminmccarthy);


    const [infoBoxNode, setInfoBoxNode] = useState<GenealogyNode | null>(null);

    const ref = useRef<SVGSVGElement>(null);

    const notablePeopleMap = new Map(notablePeople.people.map(it => [it.id, it as NotablePerson]));

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25,2])
        .on("zoom", zoomed)
        .on("end", zoomEnd);

    function zoomed(event: D3ZoomEvent<SVGSVGElement, unknown>) {
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!)
        if (event.sourceEvent != null) {
            if ((event.sourceEvent as Event).type === "mousemove") {
                svg.attr("cursor", "grabbing");
            }
            else if ((event.sourceEvent as Event).type === "wheel")
            {
                svg.attr("cursor", "zoom-in");
            }
        }


        svg.selectAll("g").attr("transform", event.transform.toString());
    }

    function zoomEnd() {
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!)
        svg.attr("cursor", "grab");
    }

    function buildGraph(data: Graph) {
        const width = ref.current!.width.baseVal.value;
        const height = ref.current!.height.baseVal.value;

        const radius = width/100;
        const bigRadius = radius * 1.2;

        // Specify the color scale.
        const color = d3.scaleOrdinal(d3.schemeCategory10);
        const nodeIndex = new Map(data.nodes.map((it, index) => [it.id, index]));

        const edgeCount = new Map(data.nodes.map(it => [it.id, 1]));
        data.edges.forEach(edge => {
            edgeCount.set(edge.fromNodeId, edgeCount.get(edge.fromNodeId)! + 1);
            edgeCount.set(edge.toNodeId, edgeCount.get(edge.toNodeId)! + 1);
        })


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
            vy: number,
            fx: number | undefined,
            fy: number | undefined
        }

        const nodes = data.nodes.map(d => ({...d})).map(it => ({
            genealogyNode: it,
            index: nodeIndex.get(it.id),
            radius: it.id == data.base ? bigRadius : radius,
            color: it.id == data.base ? color("yellow") : (notablePeopleMap.has(it.id) ? color("red") : color("white")),
            x: NaN,
            y: NaN,
            vx: NaN,
            vy: NaN,
            fx: undefined,
            fy: undefined
        }) as D3Node);

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links)
                    .id(d => (d as D3Node).genealogyNode.id)
                    .distance(l =>{
                            const source = ((l.source as unknown) as D3Node).genealogyNode;
                            const target = ((l.target as unknown) as D3Node).genealogyNode;
                            let modifier = 1
                            if (source.id == data.base || target.id == data.base) {
                                modifier = 1.3
                            }
                            return 20*(edgeCount.get(target.id)! + edgeCount.get(source.id)!)*modifier;
                        }
                        //(((l.target as unknown) as D3Node).genealogyNode.id == data.base) || (((l.source as unknown) as D3Node).genealogyNode.id == data.base) ? 300 : 30

                    )
                    .strength(1))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter())
            .force("x", d3.forceX().strength(0.01))
            .force("y", d3.forceY().strength(0.01))
            .force("collide", d3.forceCollide(d => d.radius * 3));

        // Create the SVG container.
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!);

        svg
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [-width/2, -height/2, width, height])
            .attr("data:base", data.base)
            .attr("style", "max-width: 100%; height: auto;")
            .attr("cursor", "grab");
            //.on("click", () => { svg.select("#node").selectAll("circle").attr("class", "") });

        svg.call(zoom.extent([[0,0], [width,height]]));

        svg.append("svg:defs")
            .append("svg:marker")
            .attr("id", "arrow")
            //.attr("viewBox", [0,0,10,10])
            .attr("refX", 30)
            .attr("refY", 3)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .attr("markerUnits", "strokeWidth")
            .append("path")
            .attr("d", "M0,0 L0,6 L9,3 z")
            .attr("fill", "black")
            //.style("stroke", "white");

        // Add a line for each link, and a circle for each node.
        const link = svg.append("g")
            .attr("id", "link")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", /*d => Math.sqrt(2)*/ 3)
            .attr("marker-end", "url(#arrow)");

        const node = svg.append("g")
            .attr("id", "node")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll<SVGCircleElement, unknown>("circle")
            .data(nodes)
            .join("circle")
            .attr("id", d => "id"+d.genealogyNode.id)
            .attr("r", d => d.radius)
            .attr("fill", d => d.color)
            .on("click", (e: MouseEvent, d: D3Node) => { svg.select("#node").selectAll("circle").attr("class", ""); (e.target as HTMLElement).classList.add("clicked"); setInfoBoxNode(d.genealogyNode) })
            .call(d3.drag<SVGCircleElement, D3Node>()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded));

        function dragStarted(event: D3DragEvent<SVGCircleElement, D3Node, D3Node>) {
            svg.attr("cursor", "grabbing");
            if (!event.active) {
                simulation.alphaTarget(0.3).restart();
            }
            event.subject.fx = event.subject.x
            event.subject.fy = event.subject.y
        }

        function dragged(event: D3DragEvent<SVGCircleElement, D3Node, D3Node>) {
            //d3.select("#id" + d.genealogyNode.id).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragEnded(event: D3DragEvent<SVGCircleElement, D3Node, D3Node>) {
            svg.attr("cursor", "grab");
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = undefined;
            event.subject.fy = undefined;
        }

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

        return svg.node();
    }

    function returnToCentre(scale: number) {
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!);

        svg.transition().duration(500).call(
            // eslint-disable-next-line @typescript-eslint/unbound-method
            zoom.transform, new d3.ZoomTransform(scale, 0, 0));

        //svg.selectAll("g").transition().duration(500).attr("transform", "translate(0,0) scale(1)");

    }

    function centreOnBase() {
        const svg = d3.select<SVGSVGElement, unknown>(ref.current!);
        const base = svg.attr("data:base");
        const baseX = +svg.select("#id"+base).attr("cx");
        const baseY = +svg.select("#id"+base).attr("cy");
        svg.transition().duration(500).call(
            // eslint-disable-next-line @typescript-eslint/unbound-method
            zoom.transform, new d3.ZoomTransform(1, -baseX, -baseY)
        );

    }




    //Gets executed after SVG has been mounted
    useEffect(() => {
        buildGraph(graphData);
        const svgRef = ref.current;
        return() => {
            returnToCentre(1);
            d3.select<SVGSVGElement, unknown>(svgRef!).selectAll("*").remove();
        }

    }, [graphData]);



    function presetValue(preset: Preset) {
        switch (preset) {
            case Preset.johnbenjaminmccarthy: setInfoBoxNode(null); setGraphData(johnbenjaminmccarthy); break;
            case Preset.johnbenjaminmccarthybig: setInfoBoxNode(null); setGraphData(johnbenjaminmccarthybig); break;
            case Preset.ruadhaidervan: setInfoBoxNode(null); setGraphData(ruadhaidervan); break;
            case Preset.kellifrancisstaite: setInfoBoxNode(null); setGraphData(kellifrancisstaite); break;
            case Preset.simondonaldson: setInfoBoxNode(null); setGraphData(simondonaldson); break;
        }
    }

    function infoBoxOnCloseButton() {
        setInfoBoxNode(null);
    }



  return (
      <>
          <div className={"svg"}>
              <svg className={"container"} ref={ref} width={"100%"} height={"100%"}></svg>
          </div>
          <GraphSelector
            presetFunction={presetValue}
          ></GraphSelector>
          <InfoBox
              onCloseButton={infoBoxOnCloseButton}
              nodeInfo={infoBoxNode}
              notablePerson={infoBoxNode ? notablePeopleMap.get(infoBoxNode.id) : undefined}
          ></InfoBox>
          <div id={"repositionButtons"}>
              <button className={"returnToCentre"} onClick={() => returnToCentre(0.5)}>Click here to zoom out and recentre</button>
              <button className={"centreOnBase"} onClick={centreOnBase}>Click here to centre on base node</button>
          </div>

      </>
  )
}

export default App
