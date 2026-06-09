export class HttpException extends Error {
  status: number;
  // any additional properties
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
