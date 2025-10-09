import type {SVGProps} from "react";

interface LogoIconProps extends SVGProps<SVGSVGElement> {
    title?: string;
}

// Logotipo principal (símbolo + wordmark)
export const Logo = (props: LogoIconProps) => (
    <svg
        width={1200}
        height={360}
        viewBox="0 0 1200 360"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="NostrTube logo"
        {...props}
    >
        <title>{props.title ?? "NostrTube"}</title>
        <g id="symbol" transform="translate(60,60)">
            <rect
                x={0}
                y={0}
                width={240}
                height={240}
                rx={36}
                ry={36}
                fill="none"
                stroke="#6C5CE7"
                strokeWidth={6}
            />
            <line
                x1={60}
                y1={60}
                x2={180}
                y2={60}
                stroke="#6C5CE7"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.9}
            />
            <line
                x1={60}
                y1={60}
                x2={120}
                y2={160}
                stroke="#6C5CE7"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.9}
            />
            <line
                x1={180}
                y1={60}
                x2={120}
                y2={160}
                stroke="#6C5CE7"
                strokeWidth={4}
                strokeLinecap="round"
                opacity={0.9}
            />
            <circle
                cx={60}
                cy={60}
                r={10}
                fill="#FFD166"
                stroke="#6C5CE7"
                strokeWidth={2}
            />
            <circle
                cx={180}
                cy={60}
                r={10}
                fill="#FFD166"
                stroke="#6C5CE7"
                strokeWidth={2}
            />
            <circle
                cx={120}
                cy={160}
                r={10}
                fill="#FFD166"
                stroke="#6C5CE7"
                strokeWidth={2}
            />
            <g transform="translate(60,40)">
                <circle cx={60} cy={60} r={56} fill="#6C5CE7"/>
                <path
                    d="M78 60 L54 78 L54 42 Z"
                    fill="#FFFFFF"
                    transform="translate(-4,0)"
                />
                <path
                    d="M38 42 L52 78 L68 42"
                    fill="none"
                    stroke="#6C5CE7"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </g>
        <g id="wordmark" transform="translate(360,140)">
            <text
                x={0}
                y={0}
                fontFamily="Poppins, Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                fontWeight={700}
                fontSize={64}
                fill="#0F1724"
            >
                {"Nostr"}
            </text>
            <text
                x={220}
                y={0}
                fontFamily="Poppins, Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial"
                fontWeight={700}
                fontSize={64}
                fill="#6C5CE7"
            >
                {"Tube"}
            </text>
        </g>
    </svg>
);

// Ícone / símbolo apenas (ideal para favicon/app icon)
export const LogoIcon = (props: LogoIconProps) => (
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

// Versão monocromática (preto)
export const LogoMono = (props: LogoIconProps) => (
    <svg
        width={800}
        height={240}
        viewBox="0 0 800 240"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="NostrTube logo monochrome"
        {...props}
    >
        <title>{props.title ?? "NostrTube (mono)"}</title>
        <g transform="translate(40,30)" fill="#0F1724" stroke="none">
            <rect
                x={0}
                y={0}
                width={180}
                height={180}
                rx={30}
                fill="none"
                stroke="#0F1724"
                strokeWidth={6}
            />
            <line
                x1={40}
                y1={40}
                x2={140}
                y2={40}
                stroke="#0F1724"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <line
                x1={40}
                y1={40}
                x2={90}
                y2={140}
                stroke="#0F1724"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <line
                x1={140}
                y1={40}
                x2={90}
                y2={140}
                stroke="#0F1724"
                strokeWidth={4}
                strokeLinecap="round"
            />
            <circle cx={40} cy={40} r={8} fill="#0F1724"/>
            <circle cx={140} cy={40} r={8} fill="#0F1724"/>
            <circle cx={90} cy={140} r={8} fill="#0F1724"/>
            <g transform="translate(10,20)">
                <circle cx={80} cy={60} r={54} fill="#0F1724"/>
                <path d="M98 60 L74 84 L74 36 Z" fill="#FFFFFF"/>
            </g>
        </g>
        <text
            x={260}
            y={130}
            fontFamily="Poppins, Inter, system-ui"
            fontWeight={700}
            fontSize={64}
            fill="#0F1724"
        >
            {"NostrTube"}
        </text>
    </svg>
);
export default Logo;
