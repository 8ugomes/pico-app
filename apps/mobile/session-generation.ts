export class SessionGeneration {
  #value = 0;

  capture() {
    return this.#value;
  }

  isCurrent(generation: number) {
    return generation === this.#value;
  }

  invalidate() {
    this.#value += 1;
  }
}
