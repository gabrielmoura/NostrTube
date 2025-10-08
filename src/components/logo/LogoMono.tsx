// Versão monocromática (preto)
const LogoMono = (props) => (
    <svg
        width={800}
        height={240}
        viewBox="0 0 800 240"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="NostrTube logo monochrome"
        {...props}
    >
        <title>{"NostrTube (mono)"}</title>
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
            <circle cx={40} cy={40} r={8} fill="#0F1724" />
            <circle cx={140} cy={40} r={8} fill="#0F1724" />
            <circle cx={90} cy={140} r={8} fill="#0F1724" />
            <g transform="translate(10,20)">
                <circle cx={80} cy={60} r={54} fill="#0F1724" />
                <path d="M98 60 L74 84 L74 36 Z" fill="#FFFFFF" />
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
export default LogoMono;
