import PuzzleSet from './PuzzleSet'
import RAFPulseClock from './RAFPulseClock'
import Game from './Game'
import Input from './Input';

let puzzleSets : PuzzleSet[];
let game : Game;
let clock : RAFPulseClock;
let input : Input;

const canvas = document.getElementsByTagName('canvas')[0];
const context = canvas.getContext('2d');
context.textAlign = 'center';
context.textBaseline = 'middle';

const sizeInput = document.getElementById('size') as HTMLInputElement;
const puzzleSelector = document.getElementById('puzzle-selector') as HTMLSelectElement;
const startButton = document.getElementById('start') as HTMLButtonElement;

const blankPositionSelector = {
	topLeft : document.getElementById('blank-pos-top-left') as HTMLInputElement,
	topRight : document.getElementById('blank-pos-top-right') as HTMLInputElement,
	bottomLeft : document.getElementById('blank-pos-bottom-left') as HTMLInputElement,
	bottomRight : document.getElementById('blank-pos-bottom-right') as HTMLInputElement,
}

function decodeBlank() : [boolean, boolean] {
	return [
		blankPositionSelector.bottomLeft.checked || blankPositionSelector.bottomRight.checked,
		blankPositionSelector.topRight.checked || blankPositionSelector.bottomRight.checked
	]
}

const labelSelector = {
	none : document.getElementById('show-label-none') as HTMLInputElement,
	phone : document.getElementById('show-label-phone') as HTMLInputElement,
	keypad : document.getElementById('show-label-keypad') as HTMLInputElement
}



async function loadPuzzleSets () {
	const puzzleSets : PuzzleSet[] = [];
	const response = await fetch('puzzleset.json');
	
	const puzzleSetDataArray = await response.json() as PuzzleSet[]
	for (let i = 0; i < puzzleSetDataArray.length; i++) {
		const puzzleSet = puzzleSetDataArray[i];
		(puzzleSet as PuzzleSet & { __proto__ : PuzzleSet }).__proto__ = PuzzleSet.prototype;
		puzzleSets.push(puzzleSet);

		const selectOption = document.createElement('option');
		selectOption.value = i.toString();
		selectOption.innerText = puzzleSet.title;
		puzzleSelector.appendChild(selectOption);
	}
	await Promise.all(puzzleSets.map(v => v.waitForImageLoad()));
	return puzzleSets;
}


function setSizeHandler() {
	game.setSize(sizeInput.valueAsNumber, ...decodeBlank());
}


loadPuzzleSets().then((p) => {
	puzzleSets = p;

	
	startButton.addEventListener('click', (ev) => {
		game.shuffle();
		game.initPiecePosition();
		game.start(ev.timeStamp);
	});


	blankPositionSelector.topLeft.addEventListener('input', setSizeHandler);
	blankPositionSelector.topRight.addEventListener('input', setSizeHandler);
	blankPositionSelector.bottomLeft.addEventListener('input', setSizeHandler);
	blankPositionSelector.bottomRight.addEventListener('input', setSizeHandler);

	sizeInput.addEventListener('change', setSizeHandler);

	puzzleSelector.addEventListener('change', ev => {
		game.setPuzzleSet(puzzleSets[puzzleSelector.value]);
	});

	labelSelector.none.addEventListener('input', ev => {
		game.showLabel = false;
	});

	labelSelector.phone.addEventListener('input', ev => {
		game.showLabel = true;
		game.assignLabel(false);
	});

	labelSelector.keypad.addEventListener('input', ev => {
		game.showLabel = true;
		game.assignLabel(true);
	});

	let puzzleSet : PuzzleSet = puzzleSets[puzzleSelector.value];
	let size = sizeInput.valueAsNumber;

	game = new Game(size, puzzleSet, 20, 20, 320, labelSelector.keypad.checked);
	input = new Input();
	input.connect(canvas, game);

	clock = new RAFPulseClock(t => {
		input.dispatch();
		game.update(t, input);
		game.render(context);
		input.pulse();
	});
	
	clock.run();
});

