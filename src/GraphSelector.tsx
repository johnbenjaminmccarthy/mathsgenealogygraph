import "./style.scss";

import {ChangeEvent} from "react";
import {Preset} from "./Preset.tsx";

export function GraphSelector(props: { presetFunction: (preset: Preset) => void }) {
    let presetValue: Preset = Preset.johnbenjaminmccarthy;

    function handlePresetChange(event: ChangeEvent<HTMLSelectElement>) {
        presetValue = Preset[event.target.value as keyof typeof Preset]

    }

    return (
        <>
            <div id={"selector"}>
                <span id={"genealogyIdText"}>Maths Genealogy URL or ID number:</span>
                <input type={"text"} id={"genealogyId"} placeholder={"https://www.mathgenealogy.org/id.php?id=74313"}/>
                <input type={"number"} id={"maxGenerationsUp"} placeholder={"5"} min={0}/>
                <input type={"number"} id={"maxGenerationsDown"} placeholder={"5"} min={0}/>
                <button id={"genealogyIdButton"}>Go!</button>
                <span id={"spacer"}></span>
                <span id={"presetText"}>Choose a preset:</span>
                <select name={"presets"} id={"presets"} defaultValue={"johnbenjaminmccarthy"} onChange={handlePresetChange}>
                    <option key={Preset.johnbenjaminmccarthy} value={"johnbenjaminmccarthy"}>John</option>
                    <option key={Preset.johnbenjaminmccarthybig} value={"johnbenjaminmccarthybig"}>John Big</option>
                    <option key={Preset.ruadhaidervan} value={"ruadhaidervan"}>Ruadhai Dervan</option>
                    <option key={Preset.kellifrancisstaite} value={"kellifrancisstaite"}>Kelli Francis-Staite</option>
                    <option key={Preset.simondonaldson} value={"simondonaldson"}>Simon Donaldson</option>
                    <option key={Preset.michaelatiyah} value={"michaelatiyah"}>Michael F. Atiyah</option>
                    <option key={Preset.danielquillen} value={"danielquillen"}>Daniel Quillen</option>
                </select>
                <button id={"presetsButton"} onClick={() => props.presetFunction(presetValue)}>Go!</button>
            </div>
        </>
    )
}