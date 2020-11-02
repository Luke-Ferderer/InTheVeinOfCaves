/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Luke Ferderer, Griffin Annis
 */

var rhit = rhit || {};

rhit.navBarTemplate;
rhit.caveSystemGenerator;
rhit.generatePageController;

rhit.CaveSystemGenerator = class {
	constructor() {};

	generateSystem(numCaves, generateEntranceExit = true) {
		let cavesToGenerate = numCaves ? numCaves : rhit.randomRange(3, 8);
		let caveSystem = [];

		//generate the caves themselves
		for(let i = 0; i < cavesToGenerate; i++) {
			caveSystem[i] = new rhit.Cave(i == 0, i == cavesToGenerate - 1);
			if(i > 0) {
				caveSystem[i].linkCave(caveSystem[i-1]); //each cave has at least one link
			}
		}

		//randomly make more links
		for(let i = 0; i < cavesToGenerate; i++) {
			if(Math.random() > .5) {
				caveSystem[i].linkCave(this.nearestCave(caveSystem, i));
			}
		}

		//randomize cave link locations
		for(let i = 0; i < cavesToGenerate; i++) {
			this.shuffle(caveSystem[i].links);
		}

		return caveSystem;
	};

	nearestCave = function(caveSystem, index) {
		let currentCave = caveSystem[(index + 1) % caveSystem.length];
		let distance = (currentCave.x - caveSystem[index].x) ** 2 + (currentCave.y - caveSystem[index].y) ** 2;

		for(let i = 0; i < caveSystem.length; i++) {
			if(i != index) {
				let newDistance =  (caveSystem[i].x - caveSystem[index].x) ** 2 + (caveSystem[i].y - caveSystem[index].y) ** 2;
				
				if(newDistance < distance) {
					currentCave = caveSystem[i];
					distance = newDistance;
				}
			}
		}

		return currentCave;
	}

	/**
	 * taken from https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
	 */
	shuffle = function(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

}

rhit.Cave = class {
	constructor(isEntrance, isExit) {
		this.size = rhit.randomRange(1, 6);
		this.x = rhit.randomRange(0, 100);
		this.y = rhit.randomRange(0, 100);
		this.links = [null, null, null, null, null, null];
		this.isEntrance = isEntrance;
		this.isExit = isExit;
	}

	linkCave = function(otherCave) {
		this.links[this.links.indexOf(null)] = otherCave;
		otherCave.links[otherCave.links.indexOf(null)] = this;
	}
}

rhit.randomRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

rhit.initializePage = function() {
	if(document.querySelector("#generatePage")) {
		
		rhit.caveSystemGenerator = new rhit.CaveSystemGenerator();
		
		const numCavesInput = document.querySelector("#inputNumberOfCaves");
		const enterExitInput = document.querySelector("#inputExits")

		document.querySelector("#generateButton").addEventListener("click", (params) => {
			console.log(rhit.caveSystemGenerator.generateSystem());
		});

		document.querySelector("#submitConfigure").addEventListener("click", (params) => {
			console.log(numCavesInput.value, enterExitInput.checked);
			const numToUse = numCavesInput.value ? parseInt(numCavesInput.value) : this.randomRange(3,9);
			console.log(rhit.caveSystemGenerator.generateSystem(numToUse, enterExitInput.value));
		});

		console.log(rhit.caveSystemGenerator.generateSystem());
	}
}

rhit.main = function () {
	$("#navBar").load("/templates.html #navBar > *");
	$("#browseMaps").load("/templates.html #browseMaps > *", () => {
		$("#map0").load("/templates.html .map-item", () => {
			$("#map1").load("/templates.html .map-item", () => {
				$("#map2").load("/templates.html .map-item", () => {
					$("#map3").load("/templates.html .map-item");
				});
			});
		});
	});

	rhit.initializePage();
};

rhit.main();