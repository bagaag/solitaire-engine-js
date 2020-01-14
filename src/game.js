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
        this.tableau[i].push(this.stock.pop());
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
      let t = this.tableau[fromIx - 1];
      if (t) {
        return t.last();
      }
    }
    if (from == 'f') {
      let f = this.foundations[fromIx - 1];
      if (f) {
        return f.last();
      }
    }
  }

  // moves a card from stock, tableau or foundation to a tableau or foundation. Returns true if successful
  move(from, fromIx, to, toIx) {
    if (!this.canMove(from, fromIx, to, toIx)) {
      return false;
    }
    let card = false;
    let dest = false;
    if (from == 's') {
      card = this.stock.pop();
    } 
    else if (from == 'f') {
      card = this.foundations[fromIx - 1].pop();
    }
    else if (from == 't') {
      card = this.tableau[fromIx - 1].pop();
    }
    if (to == 't') {
      dest = this.tableau[toIx - 1];
    }
    else if (to == 'f') {
      dest = this.foundations[toIx - 1];
    }
    if (!card || !dest) {
      return false;
    }
    card.faceUp = true;
    dest.push(card);
    if (from == 't') {
      let last = this.tableau[fromIx - 1].last();
      if (last) last.faceUp = true;
    }
    if (from == 's') {
      let last = this.stock.last();
      if (last) last.faceUp = true;
    }
  }

  // moves a card from stock to waste, returns false if stock is empty
  pass() {
    let card = this.stock.pop();
    if (card) {
      card.faceUp = false;
      this.waste.push(card);
      this.stock.last().faceUp = true;
      return true;
    } else {
      return false;
    }
  }

  // moves waste back into stock, returns false if nothing to restock or stock isnt empty
  restock() {
    if (this.waste.length == 0 || this.stock.length > 0) {
      return false;
    }
    else {
      while (this.waste.length > 0) {
        let card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
      }
      return true;
    }
  }

}

module.exports = {
  Game: Game
}
