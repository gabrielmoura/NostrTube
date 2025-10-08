//Ícone / símbolo apenas (ideal para favicon/app icon)
import type {SVGProps} from "react";

interface LogoIconProps extends SVGProps<SVGSVGElement> {
    title?: string;
}

const LogoIcon = (props: LogoIconProps) => (
    <svg
        width={512}
        height={512}
        viewBox="0 0 280 280"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        // aria-label="NostrTube icon"
        {...props}
    >
        <title>{props.title ?? "NostrTube icon"}</title>
        <rect x={8} y={8} width={264} height={264} rx={40} fill="#6C5CE7"/>
        <g transform="translate(40,40)">
            <circle cx={100} cy={100} r={70} fill="#FFFFFF"/>
            <path d="M120 100 L92 124 L92 76 Z" fill="#6C5CE7"/>
            <circle cx={36} cy={36} r={8} fill="#FFD166"/>
            <circle cx={164} cy={36} r={8} fill="#FFD166"/>
            <circle cx={100} cy={176} r={8} fill="#FFD166"/>
            <line
                x1={36}
                y1={36}
                x2={100}
                y2={100}
                stroke="#6C5CE7"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <line
                x1={164}
                y1={36}
                x2={100}
                y2={100}
                stroke="#6C5CE7"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <line
                x1={100}
                y1={176}
                x2={100}
                y2={100}
                stroke="#6C5CE7"
                strokeWidth={4}
                strokeLinecap="round"
            />
        </g>
    </svg>
);
export default LogoIcon;
