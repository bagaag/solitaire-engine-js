let games = require('../src/game.js');
function events(type, obj) {
  if (type == 'tick') {
    console.log(type);
  }
}
let game = new games.Game(events);
let t = setTimeout(() => { 
  game.timer.cancel();
  console.log(game.timer.elapsed);
}, 5100);
game.timer.start();
