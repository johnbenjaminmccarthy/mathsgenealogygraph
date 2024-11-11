import './style.scss'
import * as d3 from 'd3';
import {D3ZoomEvent} from 'd3';
import {useEffect, useRef, useState} from "react";

import johnbenjaminmccarthy from './assets/graph_data/johnbenjaminmccarthy.json';
import johnbenjaminmccarthybig from './assets/graph_data/johnbenjaminmccarthybig.json';
import ruadhaidervan from './assets/graph_data/ruadhaidervan.json';
import kellifrancisstaite from './assets/graph_data/kellifrancisstaite.json';

import notablePeople from './assets/notable_people/notable_people.json';

import {GraphSelector} from "./GraphSelector.tsx";
import {GenealogyNode, Graph, Preset} from './GraphTypes.tsx';


function App() {
    const ref = useRef<SVGSVGElement>(null);

    const notablePeopleMap = new Map(notablePeople.people.map(it => [it.id, it.note]));

    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5,2])
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
            color: it.id == data.base ? color("yellow") : (notablePeopleMap.has(it.id) ? color("red") : color("white")),
            x: NaN,
            y: NaN,
            vx: NaN,
            vy: NaN
        }) as D3Node);

        // Create a simulation with several forces.
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => (d as D3Node).genealogyNode.id).distance(l => (((l.target as unknown) as D3Node).genealogyNode.id == data.base) || (((l.source as unknown) as D3Node).genealogyNode.id == data.base) ? 200 : 50))
            .force("charge", d3.forceManyBody().strength(-300))
            //.force("center", d3.forceCenter())
            .force("x", d3.forceX().strength(0.01))
            .force("y", d3.forceY().strength(0.01))
            //.force("radial", d3.forceRadial(width/2, 0, 0).strength(0.05))
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



        /*svg.call(d3.zoom<SVGSVGElement, unknown>()
            .extent([[0,0], [width,height]])
            .scaleExtent([0.5,2])
            .on("zoom", zoomed)
            .on("end", zoomEnd));*/
        svg.call(zoom.extent([[0,0], [width,height]]));

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
            .attr("id", d => "id"+d.genealogyNode.id)
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

        /*function zoomed(event: D3ZoomEvent<SVGSVGElement, unknown>) {
            const x = event.transform.x;
            const y = event.transform.y;
            const k = event.transform.k;
            const transformString = "translate(" + x + ", " + y + ") scale(" + k + ")";

            if ((event.sourceEvent as Event).type === "mousemove") {
                svg.attr("cursor", "grabbing");
            }

            svg.selectAll("g").attr("transform", event.transform.toString());

            //svg.select("#link").attr("transform", transformString);
            //svg.select("#node").attr("transform", transformString);
            //svg.select("#labels").attr("transform", transformString);

        }

        function zoomEnd() {
            svg.attr("cursor", "grab");
        }*/

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

    const [graphData, setGraphData] = useState<Graph>(johnbenjaminmccarthy);


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
            case Preset.johnbenjaminmccarthy: setGraphData(johnbenjaminmccarthy); break;
            case Preset.johnbenjaminmccarthybig: setGraphData(johnbenjaminmccarthybig); break;
            case Preset.ruadhaidervan: setGraphData(ruadhaidervan); break;
            case Preset.kellifrancisstaite: setGraphData(kellifrancisstaite); break;
        }
    }



  return (
      <>
          <div className={"svg"}>
              <svg className={"container"} ref={ref} width={"100%"} height={"100%"}></svg>
          </div>
          <GraphSelector
            presetFunction={presetValue}
          ></GraphSelector>
          <div id={"repositionButtons"}>
              <button className={"returnToCentre"} onClick={() => returnToCentre(0.5)}>Click here to zoom out and recentre</button>
              <button className={"centreOnBase"} onClick={centreOnBase}>Click here to centre on base node</button>
          </div>

      </>
  )
}

export default App
