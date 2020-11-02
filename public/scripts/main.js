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

rhit.CaveSystemGenerator = class {
	constructor() {};

	generateSystem(numCaves, generateEntranceExit = true) {
		let cavesToGenerate = numCaves ? numCaves : rhit.randomRange(3, 8);
		let caveSystem = [];

		for(let i = 0; i < cavesToGenerate; i++) {
			caveSystem[i] = new rhit.Cave();
			if(i > 0) {
				caveSystem[i].linkCave(caveSystem[i-1]); //each cave has at least one link
			}
		}

		return caveSystem;
	};

}

rhit.Cave = class {
	constructor() {
		this.size = rhit.randomRange(1, 6);
		this.x = rhit.randomRange(0, 100);
		this.y = rhit.randomRange(0, 100);
		this.links = [null, null, null, null, null, null];
	}

	linkCave = function(otherCave) {
		this.links[this.links.indexOf(null)] = otherCave;
		otherCave.links[otherCave.links.indexOf(null)] = this;
	}
}

rhit.randomRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}


rhit.main = function () {
	$("#navBar").load("/templates.html #navBar");
	rhit.caveSystemGenerator = new rhit.CaveSystemGenerator();
	console.log(rhit.caveSystemGenerator.generateSystem());
};

rhit.main();