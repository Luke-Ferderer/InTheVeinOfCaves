/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Luke Ferderer, Griffin Annis
 */

var rhit = rhit || {};

rhit.main = function () {
	$("#navBar").load("/templates.html #navBar");
	$("#browseMaps").load("/templates.html #browseMaps", () => {
		$("#map0").load("/templates.html .map-item", () => {
			$("#map1").load("/templates.html .map-item", () => {
				$("#map2").load("/templates.html .map-item", () => {
					$("#map3").load("/templates.html .map-item");
				});
			});
		});
	});
};

rhit.main();
