// Logotipo principal (símbolo + wordmark)
const Logo = (props) => (
    <svg
        width={1200}
        height={360}
        viewBox="0 0 1200 360"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="NostrTube logo"
        {...props}
    >
        <title>{"NostrTube"}</title>
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
                <circle cx={60} cy={60} r={56} fill="#6C5CE7" />
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
export default Logo;
