export abstract class BaseError extends Error {
  abstract readonly status: number;
  abstract readonly title: string;
  abstract readonly type: string;

  constructor(public readonly detail: string) {
    super(detail);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}

export class DuplicateResourceError extends BaseError {
  readonly status = 409;
  readonly title = "Conflict";
  readonly type = "about:blank";
  constructor(detail: string) {
    super(detail);
  }
}
