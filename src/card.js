class Card {
  static SUITS = ['S','H','C','D'];
  static RANKS = [1,2,3,4,5,6,7,8,9,10,11,12,13];
  constructor(suit, rank, faceUp=false) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = faceUp;
  }

  suitVal() {
    for (let s = 0; s < 4; s++) {
      if (Card.SUITS[s] == this.suit) return s + 1;
    }
  }

  toString() {
    let r = this.rank;
    r = r == 11 ? 'J' : r == 12 ? 'Q' : r == 13 ? 'K' : r == 1 ? 'A' : r;
    const sep = r == 10 ? '' : '-'; 
    return "[" + this.suit + sep + r + "]";
  }
}

class Deck {
  constructor() {
    this.cards = [];
    Card.SUITS.forEach((suit) => {
      Card.RANKS.forEach((rank) => {
        this.cards.push(new Card(suit, rank));
      });
    });
  }

  shuffle() {
    let array = this.cards;
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

module.exports = {
  Card: Card,
  Deck: Deck
}

