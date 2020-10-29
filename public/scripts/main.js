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
		let cavesToGenerate = numCaves ? numCaves : Math.floor(Math.random() * 7) + 2;
		console.log(cavesToGenerate);
	};
}


rhit.main = function () {
	$("#navBar").load("/templates.html #navBar");
	rhit.caveSystemGenerator = new rhit.CaveSystemGenerator();
	rhit.caveSystemGenerator.generateSystem();
};

rhit.main();