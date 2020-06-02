import PuzzleSet from './PuzzleSet'
import Clock from './Clock'
import Game from './Game'

let puzzleSets : PuzzleSet[];
let game : Game;
let clock : Clock;


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



declare interface PuzzleSetData {
	readonly title : string
	readonly img : string
	readonly story : string
	readonly left : number
	readonly top : number
	readonly size : number
	readonly solvable : boolean
}

async function loadPuzzleSets () {
	const puzzleSets : PuzzleSet[] = [];
	const response = await fetch('puzzleset.json');
	const puzzleSetDataArray = await response.json() as PuzzleSetData[]
	for (let i = 0; i < puzzleSetDataArray.length; i++) {
		const { title, img, left, top, size, solvable, story } = puzzleSetDataArray[i];
		const puzzleSet = new PuzzleSet(img, left, top, size, solvable, story);
		puzzleSets.push(puzzleSet);

		const selectOption = document.createElement('option');
		selectOption.value = i.toString();
		selectOption.innerText = title;
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

	game.input.connect(canvas, game);

	clock = new Clock(t => {
		game.update(t);
		game.render(context);
	});
	
	clock.run();
});






