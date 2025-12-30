import type { FC } from "react";

export interface LinkifyProps {
  text: string;
}

const LinkifyText: FC<LinkifyProps> = ({ text }) => {
  // Regex que identifica links começando com http:// ou https://
  // O uso de parênteses (capturing group) no split garante que o link
  // também seja mantido no array resultante.
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const parts = text.split(urlRegex);

  return (
    <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
              style={{ color: "#2563eb", textDecoration: "underline" }}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </p>
  );
};

export default LinkifyText;