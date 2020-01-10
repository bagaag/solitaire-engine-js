#!/usr/bin/env node
let cli = require('../src/cli.js');
let cards = require('../src/card.js');
let games = require('../src/game.js');
cli.run();
let card = new cards.Card(4,10);
console.log(card.suit);
let deck = new cards.Deck();
console.log(deck.cards.length);
console.log(deck.cards[10].toString());
deck.shuffle();
console.log(deck.cards[10].toString());
let game = new games.Game();
game.tableau.forEach(t => {
  console.log(t.length);
});

