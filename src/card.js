class Card {
  static SUITS = [1,2,3,4];
  static RANKS = [1,2,3,4,5,6,7,8,9,10,11,12,13];
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }

  toString() {
    return "[" + this.suit + "," + this.rank + "]";
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

