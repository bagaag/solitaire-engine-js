let cards = require('./card.js');

// add .last() method to arrays
if (!Array.prototype.last) {
  Array.prototype.last = function() {
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
      this.tableau[i].last().faceUp = true;
    }
    this.stock.last().faceUp = true;
  }

  // returns an array of N empty arrays
  arrays(count) {
    let arr = [];
    for (let i=0; i<count; i++) {
      arr.push([]);
    }
    return arr;
  }

  // checks input values and move feasability
  canMove(from, fromIx, to, toIx) {
    // check 'to' values
    if (to == 'f') {
      if (toIx < 1 || toIx > 4) {
        return false;
      }
    }
    else if (to == 't') {
      if (toIx < 1 || toIx > 7) {
        return false;
      }
    }
    else {
      return false;
    }

    // check 'from' values
    if (from == 'f') {
      if (fromIx < 1 || fromIx > 4) {
        return false;
      }
    }
    else if (from == 't') {
      if (fromIx < 1 || fromIx > 7) {
        return false;
      }
    }
    else if (from != 's') {
      return false;
    }
    
    // get card to move
    let card = this.peek(from, fromIx);
    if (!card) {
      return false;
    }

    // test move feasability
    let dest = this.peek(to, toIx);
    if (to == 't') {
      if (!dest) {
        // first tableau card must be a king
        if (card.rank != 13) {
          return false;
        }
      }
      else {
        // must alternate red/black suits
        if (card.suit % 2 == dest.suit % 2) {
          return false;
        }
        // must be one rank smaller than the parent card
        if (card.rank != dest.rank - 1) {
          return false;
        }
      }
    }
    else {
      // first card must be an ace
      if (!dest) {
        if (card.rank != 1) {
          return false;
        }
      }
      else {
        // must be same suit and one rank higher than dest
        if (card.suit != dest.suit || card.rank != dest.rank + 1) {
          return false;
        }
      }
    }
    return true;
  }

  // returns a card from (s)tock, (t)ableau or (f)oundation without removing from its position
  peek(from, fromIx) {
    if (from == 's') {
      return this.stock.last();
    }
    if (from == 't') {
      let t = this.tableau[fromIx];
      if (t) {
        return t.last();
      }
    }
    if (from == 'f') {
      let f = this.foundations[fromIx];
      if (f) {
        return f.last();
      }
    }
  }

  move(from, fromIx, to, toIx) {
    console.log('move...');
  }

}

module.exports = {
  Game: Game
}
