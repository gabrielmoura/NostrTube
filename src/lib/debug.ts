import debug from "debug";

export const logger = debug(import.meta.env.VITE_APP_NAME);

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogRecord {
    app: string;
    namespace: string;
    level: LogLevel;
    message: unknown[];
    timestamp: number;
}

type LogCallback = (record: LogRecord) => void;

class LogAgent {
    private enabledNamespaces: RegExp[] = [];
    private callback: LogCallback | null = null;

    constructor(private appName: string) {
        this.loadFilters();
    }

    /** Ativa namespaces ex: enable("auth:*") */
    enable(filter: string) {
        localStorage.setItem(`log_agent_filter_${this.appName}`, filter);
        this.loadFilters();
    }

    /** Carrega filtro do localStorage */
    private loadFilters() {
        const filter = "*";

        this.enabledNamespaces = filter
            .split(",")
            .map(f => new RegExp("^" + f.replace(/\*/g, ".*") + "$"));
    }

    /** Define callback global de interceptação */
    setCallback(cb: LogCallback) {
        this.callback = cb;
    }

    /** Cria um logger com namespace */
    create(namespace: string) {
        // Prefixa automaticamente com o nome da aplicação
        const ns = `${this.appName}:${namespace}`;

        return {
            debug: (...msg: any[]) => this.log(ns, "debug", msg),
            info: (...msg: any[]) => this.log(ns, "info", msg),
            warn: (...msg: any[]) => this.log(ns, "warn", msg),
            error: (...msg: any[]) => this.log(ns, "error", msg),
        };
    }

    private isEnabled(ns: string) {
        return this.enabledNamespaces.some(regex => regex.test(ns));
    }

    private log(namespace: string, level: LogLevel, message: any[]) {
        if (!this.isEnabled(namespace)) return;

        const record: LogRecord = {
            app: this.appName,
            namespace,
            level,
            message,
            timestamp: Date.now(),
        };

        // callback global (ex: enviar logs ao backend)
        if (this.callback) {
            this.callback(record);
        }

        // estilo de cor
        const color = {
            debug: "#888",
            info: "#0077FF",
            warn: "#FFA500",
            error: "#FF3333"
        }[level];

        console.groupCollapsed(
            `%c[${record.app}] %c[${namespace}] %c${level.toUpperCase()} %c${new Date(
                record.timestamp
            ).toISOString()}`,
            "color:#44A; font-weight:bold;",
            "color:#888;",
            `color:${color}; font-weight:bold;`,
            "color:#AAA;"
        );

        console.log(...message);
        console.groupEnd();
    }
}

export const LoggerAgent = new LogAgent(import.meta.env.VITE_APP_NAME);

