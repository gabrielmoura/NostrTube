import dayjs from "dayjs";
import relative from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";

export function nostrNow(): number {
    return Math.floor(Date.now() / 1000)
}

export function unixTimeNowInSeconds() {
    return Math.floor(new Date().getTime() / 1000);
}

export function dateTomorrow() {
    return new Date(Date.now() + 3600 * 1000 * 24);
}

export function formattedDate(unixTimestampInSeconds: number): string {
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
    } as const;
    const date = new Date(unixTimestampInSeconds * 1000);
    return date.toLocaleDateString("en-US", options);
}

export function relativeTimeUnix(timestamp: number) {
    const config = {
        thresholds: [
            {l: "s", r: 1},
            {l: "m", r: 1},
            {l: "mm", r: 59, d: "minute"},
            {l: "h", r: 1},
            {l: "hh", r: 23, d: "hour"},
            {l: "d", r: 1},
            {l: "dd", r: 364, d: "day"},
            {l: "y", r: 1},
            {l: "yy", d: "year"},
        ],
        rounding: Math.floor,
    };
    dayjs.extend(updateLocale);

    dayjs.updateLocale("en", {
        relativeTime: {
            future: "in %s",
            past: "%s ago",
            s: "%s seconds",
            m: "1 min",
            mm: "%d mins",
            h: "1 hour",
            hh: "%d hours",
            d: "1 day",
            dd: "%d days",
            y: "1 year",
            yy: "%d years",
        },
    });
    dayjs.extend(relative, config);
    return dayjs(timestamp * 1000).fromNow();
}

export function relativeTime(timestamp: Date) {
    dayjs.extend(updateLocale);
    dayjs.updateLocale("en", {
        relativeTime: {
            future: "in %s",
            past: "%s ago",
            s: "%d seconds",
            m: "a minute",
            mm: "%d minutes",
            h: "an hour",
            hh: "%d hours",
            d: "a day",
            dd: "%d days",
            M: "a month",
            MM: "%d months",
            y: "a year",
            yy: "%d years",
        },
    });
    dayjs.extend(relative);
    return dayjs(timestamp).fromNow();
}

export function relativeTimeSmall(timestamp: Date) {
    dayjs.extend(updateLocale);
    dayjs.updateLocale("en", {
        relativeTime: {
            future: "in %s",
            past: "%s",
            s: "%ds",
            m: "1m",
            mm: "%dm",
            h: "%dh",
            hh: "%dh",
            d: "1d",
            dd: "%dd",
            M: "a month",
            MM: "%d months",
            y: "a year",
            yy: "%d years",
        },
    });
    dayjs.extend(relative);
    return dayjs(timestamp).fromNow();
}
