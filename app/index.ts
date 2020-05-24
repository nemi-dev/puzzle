import PuzzleSet from './PuzzleSet'
import Running from './Running'
import Game from './Game'
import Piece from './Piece';


const canvas = document.getElementsByTagName('canvas')[0];
const context = canvas.getContext('2d');

const puzzleSets = [
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
	new PuzzleSet('2.png', 186, 27, 320, true),
]

const puzzleSelector = document.getElementById('puzzle-selector') as HTMLSelectElement;

let game : Game;
let running : Running;

const sizeInput = document.getElementById('size') as HTMLInputElement;

function createGame(puzzleSet : PuzzleSet, size : number) {
	if (game) game.disconnectView(canvas);
	game = new Game(size, puzzleSet, 20, 20, 360);

	running = new Running(() => {
		game.update();
		game.render(context);
	});

}

const startButton = document.getElementById('start') as HTMLButtonElement;
const applyButton = document.getElementById('apply-setting') as HTMLButtonElement;

applyButton.addEventListener('click', () => {
	if (running) running.stop();
	createGame(puzzleSets[puzzleSelector.value], sizeInput.valueAsNumber);
	game.render(context);
	startButton.disabled = false;
})

startButton.addEventListener('click', () => {
	game.shuffle();
	game.initViewForModel();
	game.connectView(canvas);
	running.start();
});


