export class FormValidationError extends Error {

  private readonly target: HTMLElement

  constructor(target: HTMLElement, message: string) {
    super(message)
    this.target = target
  }

  getTarget(): HTMLElement {
    return this.target
  }
}