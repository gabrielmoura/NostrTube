interface ITrace {
  traceId: string;
  date: Date;
  data: string;
}

export class TraceService {
  static createBeacon(data: ITrace) {
    navigator.sendBeacon(`${import.meta.env.VITE_BASE_URL}/tracers`, JSON.stringify(data));
  }
}