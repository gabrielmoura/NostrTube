import {RiThumbDownFill, RiThumbDownLine, RiThumbUpFill, RiThumbUpLine,} from "react-icons/ri";
import {formatCount} from "../helper/format.ts";
export type likeOptions="+"|"-"
type LikeToggleButton = {
    likeCount?: number;
    unLikeCount?: number;
    active?:likeOptions;
    onClick: (action: "+" | "-") => void;
};
export default function LikeToggleButton({
                                             likeCount,
                                             active,
                                             onClick,
                                             unLikeCount
                                         }: LikeToggleButton) {
    return (
        <div className="flex h-8 rounded-full border bg-muted">
            <button
                onClick={() => onClick("+")}
                className="flex flex-1 items-center gap-2 px-3 hover:text-foreground"
            >
                {active === "+" ? <RiThumbUpFill/> : <RiThumbUpLine/>}
                {!!likeCount && (
                    <span className="text-xs font-bold">{formatCount(likeCount)}</span>
                )}
            </button>
            <div className="h-full w-[1px] bg-muted-foreground/20"></div>
            <button
                onClick={() => onClick("-")}
                className="flex-1  hover:text-foreground items-center gap-2 px-3 flex"
            >
                {active === "-" ? <RiThumbDownFill/> : <RiThumbDownLine/>}
                {!!unLikeCount && (
                    <span className="text-xs font-bold">{formatCount(unLikeCount)}</span>
                )}
            </button>
        </div>
    );
}