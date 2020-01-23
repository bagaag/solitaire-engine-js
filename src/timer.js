class Timer {
  #elapsed = 0;
  #timeout;
  #active = false;
  #srarted;
  #callback;

  constructor(callback) {
    this.#callback = callback;
    this.#timeout = setInterval(() => {
      if (this.#active) {
        this.#elapsed++;
        if (this.#callback) {
          this.#callback(this);
        }
      }
    }, 1000);
  }

  get elapsed() { 
    return this.#elapsed;
  }

  start() {
    this.#active = true;
  }

  stop() {
    this.#active = false;
  }

  cancel() {
    this.stop();
    clearInterval(this.#timeout);
  }
}

module.exports = {
  Timer: Timer
}
