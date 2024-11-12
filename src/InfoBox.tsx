import "./style.scss";

import type {GenealogyNode} from "./GraphTypes.tsx";

export function InfoBox(props: { onCloseButton: () => void, nodeInfo: GenealogyNode | null, notablePersonNote: string | undefined }) {
    if (props.nodeInfo != null) {

        return (
            <>
                <div id={"info-box"}>
                    <button className={"closeButton"} onClick={props.onCloseButton}>&#x2716;</button>
                    <span className={"name"}>{props.nodeInfo.name}</span><br/>
                    <span className={"link"}><a
                        href={"https://www.mathgenealogy.org/id.php?id=" + props.nodeInfo.id}>{"https://www.mathgenealogy.org/id.php?id=" + props.nodeInfo.id}</a></span>
                    <br/>
                    <hr/>
                    {
                        props.notablePersonNote ?
                            (<>
                                <span className={"note"}>{props.notablePersonNote}</span>
                                <hr />
                            </>) : null
                    }
                    <div className={"dissertations"}>
                        <span className={"dissertationsTitle"}>Dissertations:</span>
                        {
                            props.nodeInfo.dissertations?.map(it => {
                                return (
                                    <>
                                        <div className={"dissertation"}>
                                            {
                                                it.dissertationtitle ? (
                                                <><span className={"title"}>{it.dissertationtitle}</span><br/></>
                                                )  : null
                                            }
                                            {
                                                it.mscnumber ? (
                                                    <>
                                                    <span className={"mscnumber"}>Mathematical Subject Classification no.: {it.mscnumber}</span>
                                                    </>
                                                ) : null
                                            }
                                            <span className={"info"}>{it.phdprefix} - {it.university} - {it.yearofcompletion}</span>
                                            {
                                                it.advisors ? (
                                                    <>
                                                        <span className={"advisorsTitle"}>Advisors:</span>
                                                    </>
                                                ) : null
                                            }
                                            <div className={"advisors"}>
                                                {
                                                    it.advisors?.sort((a,b) => a.advisorNumber - b.advisorNumber).map(itt => {
                                                        return (
                                                            <>
                                                                <div className={"advisor"}>
                                                                    {itt.advisorName}
                                                                </div>
                                                            </>
                                                        )
                                                    })
                                                }
                                            </div>
                                        </div>
                                        <hr />
                                    </>
                                )
                            })
                        }

                    </div>
                    <div className={"students"}>
                        <span className={"numbers"}><span>Number of students: {props.nodeInfo.students ? props.nodeInfo.students.length : "0"}</span><span>Number of descendents: {props.nodeInfo.numberofdescendents}</span></span>

                        {
                            props.nodeInfo.students && props.nodeInfo.students.length > 0 ? (
                                <>
                                    <hr/>
                                    <span className={"studentsTitle"}>Students: </span>
                                    <span className={"studentList"}>
                                        {
                                            props.nodeInfo.students.map((itt, index) => {
                                                return (
                                                    <>
                                                        {itt.name}{index != props.nodeInfo!.students!.length - 1 ? " · " : null}
                                                    </>
                                                )
                                            })
                                        }
                                    </span>
                                </>
                            ) : null
                        }
                    </div>
                </div>
            </>
        )
    }
}