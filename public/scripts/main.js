/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Luke Ferderer, Griffin Annis
 */

var rhit = rhit || {};

rhit.navBarTemplate;

rhit.main = function () {
	if(document.querySelector("#mainPage")) {
		rhit.navBarTemplate = document.querySelector("#navBarTemplate");
	}
	// TODO: Add in once hosted
	// if(!rhit.navBarTemplate) {
	// 	window.location.href = "/";
	// }
	const templateClone = rhit.navBarTemplate.content.cloneNode(true).firstElementChild;
	document.querySelector("body").appendChild(templateClone);
};

rhit.main();
