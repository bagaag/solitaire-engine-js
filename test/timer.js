let games = require('../src/game.js');
function events(type, obj) {
  if (type == 'tick') {
    console.log(type);
  }
}
let game = new games.Game();
game.addEventListener(events);
game.start();
let t = setTimeout(() => { 
  game.timer.cancel();
  console.log(game.timer.elapsed);
}, 5100);
game.timer.start();
