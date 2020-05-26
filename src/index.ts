import PuzzleSet from './PuzzleSet'
import Running from './Running'
import Game from './Game'


const canvas = document.getElementsByTagName('canvas')[0];
const context = canvas.getContext('2d');

const puzzleSets = [
	new PuzzleSet('0.png', 0, 0, 1024, false),
	new PuzzleSet('1.png', 0, 0, 1024, false),
	new PuzzleSet('2.png', 0, 0, 1024, false),
	new PuzzleSet('3.png', 0, 0, 1024, false),
	new PuzzleSet('4.png', 0, 0, 1024, false),
	new PuzzleSet('5.png', 0, 0, 1024, false),
	new PuzzleSet('6.png', 186, 27, 320, true),
	new PuzzleSet('7.png', 146, 0, 467, false),
]

const puzzleSelector = document.getElementById('puzzle-selector') as HTMLSelectElement;

let game : Game;
let running : Running;

const sizeInput = document.getElementById('size') as HTMLInputElement;

function createGame(puzzleSet : PuzzleSet, size : number) {
	if (game) game.input.disconnect(canvas);
	game = new Game(size, puzzleSet, 20, 20, 320);

	if (running) running.stop();
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
	if (running) running.stop();
	game.shuffle();
	game.initViewForModel();
	game.input.connect(canvas, game);
	running.start();
});


