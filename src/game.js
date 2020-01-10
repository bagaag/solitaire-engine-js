let cards = require('./card.js');

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

class Game {

  constructor() {
    this.deck = new cards.Deck();
    this.deck.shuffle();
    this.stock = this.deck.cards;
    this.tableau = this.arrays(7);
    this.foundations = this.arrays(4);
    this.waste = [];
    for (let i=0; i<7; i++) {
      for (let c=0; c<=i; c++) {
        this.tableau[i].push(this.stock.shift());
      }
    }
  }

  arrays(count) {
    let arr = [];
    for (let i=0; i<count; i++) {
      arr.push([]);
    }
    return arr;
  }
}

module.exports = {
  Game: Game
}
