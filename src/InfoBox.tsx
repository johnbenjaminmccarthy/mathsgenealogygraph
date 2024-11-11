import "./style.scss";

import type {GenealogyNode} from "./GraphTypes.tsx";

export function InfoBox(props: { nodeInfo: GenealogyNode | null, notablePersonNote: string | null }) {
    if (props.nodeInfo != null) {

        return (
            <>
                <div id={"info-box"}>
                    {props.nodeInfo?.name}
                </div>
            </>
        )
    }
}