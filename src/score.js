
// generic abstract class
class Score {

  score = 0;
  seconds = 0;

  constructor(game, timed) {
    this.game = game;
    this.timed = timed;
    game.addEventListener((a,b) => { this.events(a,b); });
  }

  get score() { return this.score; }

  tick() { 
    if (this.timed) { 
      this.seconds++; 
    }
  }
  wasteToTableau() {}
  wasteToFoundation() {}
  tableauToFoundation() {}
  foundationToTableau() {}
  tableauReveal() {}
  recycle() {}
  draw() {}

  events(type, data) {
    if (type == 'tick') {
      this.tick();
    }
    else if (type == 'move') {
      if (data.from == 'w') {
        if (data.to == 't') {
          this.wasteToTableau();
        }
        else if (data.to == 'f') {
          this.wasteToFoundation();
        }
      }
      else if (data.from == 't' && data.to == 'f') {
        this.tableauToFoundation();
      }
      else if (data.from == 'f' && data.to == 't') {
        this.foundationToTableau();
      }
    }
    else if (type == 'reveal') {
      this.tableauReveal();
    }
    else if (type == 'recycle') {
      this.recycle();
    }
    else if (type == 'draw') {
      this.draw();
    }
  }

}

/*
 * Microsoft Solitaire, timed and untimed
Waste to Tableau 	5
Waste to Foundation 	10
Tableau to Foundation 	10
Turn over Tableau card 	5
Foundation to Tableau 	−15
Recycle waste when playing by ones 	−100 (minimum score is 0) 
-2 pts for each 10 seconds in timed game
bonus: (20,000 / (seconds to finish)) * 35 (where / is integer division), if the game takes at least 30 seconds. 
  If the game takes less than 30 seconds, no bonus points are awarded. 
*/
class ScoreMS extends Score {

  #count = 0;

  constructor(game, timed) {
    super(game, timed);
  }

  get score() { 
    let bonus = 0;
    if (this.seconds > 30) {
      bonus = Math.round((20000 / this.seconds) * 35);
    }
    return this.score + bonus; 
  }
  
  // called every second of play
  tick() {
    if (this.timed && this.#count >= 10) {
      this.seconds += this.#count;
      this.#count = 0;
      if (this.score >= 2) {
        this.score -= 2;
      }
    } 
  }

  wasteToTableau() {
    this.score += 5;
  }

  wasteToFoundation() {
    this.score += 10;
  }

  tableauToFoundation() {
    this.score += 10;
  }

  foundationToTableau() {
    if (this.score >= 15) {
      this.score -= 15;
    }
  }

  tableauReveal() {
    this.score += 5;
  }

  recycle() {
    if (this.score >= 100) {
      this.score -= 100;
    }
  }

}

/*
 * Vegas, drawing 1/1
Ante is $52 to begin playing each game. $5 for each card moved to a suit stack. 
Draw one at a time allows one run through deck. Draw three allows three runs.
*/
class ScoreVegas extends Score {
  run = 1;
  constructor(game) {
    super(game, false);
    this.score = -52;
  }
  wasteToFoundation() {
    this.toFoundation();
  }

  tableauToFoundation() {
    this.toFoundation();
  }
  toFoundation() {
    if (this.run == 1) {
      this.score += 5;
    }
  }
  recycle() {
    this.run++;
  }
}

module.exports = {
  Score: Score,
  ScoreMS: ScoreMS,
  ScoreVegas: ScoreVegas
}
