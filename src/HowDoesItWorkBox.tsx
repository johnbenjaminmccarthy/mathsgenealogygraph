import "./style.scss"

export function HowDoesItWorkBox(props: {
    showBox: boolean,
    closeButton: () => void;
}) {
    return props.showBox ? (
        <>
            <div id={"howDoesItWorkBox"}>
                <button className={"closeButton"} onClick={props.closeButton}>&#x2716;</button>
                <span className={"header"}>Maths Genealogy Graph</span>
                <hr />
                <span className={"content"}>
                    <p>
                        Due to the incestuous nature of academic relationships, genealogical family trees from the <a href={"https://www.mathgenealogy.org/"}>Mathematics Genealogy Project</a> are <a href={"https://en.wikipedia.org/wiki/Directed_acyclic_graph"}>directed acyclic graphs</a> rather than true <a href={"https://en.wikipedia.org/wiki/Tree_(abstract_data_type)"}>trees</a>.
                    </p>
                    <p>
                        In order to graph these family trees, this app uses <a href={"https://d3js.org/"}>d3.js</a> force graphs, where a physics simulation pushes nodes on the tree away from each other proportional to the number of steps along the graph needed to traverse from one to the other. It also tends to spread out parts of the graph where a node has many edges.
                    </p>
                    <p>
                        Individual nodes can be dragged in order to produce a more pleasing diagram, as the force simulation and <a href={"https://www.genealogy.math.ndsu.nodak.edu/extrema.php"}>non-planarity of the maths genealogy graph</a> mean the graph may initially have many crossings of edges.
                    </p>
                    <p>
                        Data from the genealogy project is scraped by the an <a href={"https://github.com/johnbenjaminmccarthy/mathsgenealogyapi"}>API</a> which caches this information in a database in graph form and returns requested graphs to the app. Especially for new graphs this process can take some time, so a variety of preset graph options are available to choose from.
                    </p>
                    <p>
                        Notable persons in the mathematical genealogy are highlighted on graphs, including Fields medalists, Abel prize winners, and notable mathematicians from throughout history.
                    </p>
                </span>
            </div>
        </>
    ) : null
}