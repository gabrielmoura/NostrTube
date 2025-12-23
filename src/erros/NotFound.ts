export class ErrorNotFound extends Error {
  public context: any;

  constructor(message: string, context?: any) {
    super(message);
    this.name = "ErrorNotFound";
    this.stack = new Error().stack;
    this.context = context;
  }
}