/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * Luke Ferderer, Griffin Annis
 */

var rhit = rhit || {};

rhit.FB_COLLECTION_CAVES = "Caves";
rhit.FB_KEY_LIKES = "likes";
rhit.FB_KEY_MAP_INFO = "mapInfo";
rhit.FB_KEY_NAME = "name";
rhit.FB_KEY_PUBLIC = "public";
rhit.FB_KEY_TAGS = "tags";
rhit.FB_KEY_USER = "user";

rhit.CONST_CAVE_WIDTH = 7;
rhit.CONST_CAVE_SIDE = ((rhit.CONST_CAVE_WIDTH**2)/2)**.5;

rhit.navBarTemplate;
rhit.caveSystemGenerator;
rhit.fbAuthManager;
rhit.fbSingleCaveManager;
rhit.fbCavesManager;
rhit.accountPageController;

rhit.CaveSystemGenerator = class {
	constructor() {
		this.currentSystem = null;
		this.generateSystem();
	};

	generateSystem(numCaves, generateEntranceExit, generateLines) {
		let cavesToGenerate = numCaves ? numCaves : rhit.randomRange(3, 8);
		let caveSystemObject = { "system": [], "generateLines":generateLines };
		let caveSystem = caveSystemObject.system;

		//generate the caves themselves
		for(let i = 0; i < cavesToGenerate; i++) {
			caveSystem[i] = new rhit.Cave(i == 0, i == cavesToGenerate - 1);
			if(i > 0) {
				caveSystem[i].linkCave(caveSystem[i-1], i, i - 1); //each cave has at least one link
			}
		}

		//randomly make more links
		for(let i = 0; i < cavesToGenerate; i++) {
			if(Math.random() > .5) {
				let linkedCave = this.nearestCave(caveSystem, i);
				caveSystem[i].linkCave(linkedCave, i, caveSystem.indexOf(linkedCave));
			}
		}

		//randomize cave link locations
		for(let i = 0; i < cavesToGenerate; i++) {
			this.shuffle(caveSystem[i].links);
		}

		this.currentSystem = caveSystemObject;
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
		this.x = rhit.randomRange(rhit.CONST_CAVE_WIDTH + 3, 98);
		this.y = rhit.randomRange(rhit.CONST_CAVE_WIDTH + 3, 98);
		this.links = [null, null, null, null, null, null];
		this.isEntrance = isEntrance;
		this.isExit = isExit;
	}

	linkCave = function(otherCave, thisIndex, otherIndex) {
		this.links[this.links.indexOf(null)] = otherIndex;
		otherCave.links[otherCave.links.indexOf(null)] = thisIndex;
	}
}

rhit.randomRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

rhit.CaveSystemDrawer = class {

	constructor(container, displaySize=true) {
		this.container = container;
		this.displaySize = displaySize;
		this.paper = Raphael(container, "100%", "100%");
	}

	drawCaveSystem(caveSystem) {

		this.paper.clear();
		const system = caveSystem.system;

		for(let i = 0; i < system.length; i++) {
			const currentCave = system[i];

			this.drawCave(currentCave);
			if(caveSystem.generateLines) {
				for(let j = 0; j < currentCave.links.length; j++) {
					if(currentCave.links[j] && currentCave.links[j] > i) {
						//draw link
						const otherCave = system[currentCave.links[j]];
						const firstPoint = this.getExitPosition(currentCave, i);
						const secondPoint = this.getExitPosition(otherCave, otherCave.links.indexOf(i));

						console.log(firstPoint, secondPoint);

						const pathString = `M${(firstPoint.x-1.1) * this.container.offsetWidth / 100} ${(firstPoint.y-1.1) * this.container.offsetHeight / 100}L${(secondPoint.x-1.1) * this.container.offsetWidth / 100} ${(secondPoint.y-1.1) * this.container.offsetHeight / 100}`
						const link = this.paper.path(pathString);
					}
				}
			}
		}
	}

	drawCave(cave) {
		const topLeftX = cave.x - rhit.CONST_CAVE_SIDE;
		const topLeftY = cave.y - rhit.CONST_CAVE_SIDE;

		const diamond = this.paper.rect(topLeftX + "%", topLeftY + "%", rhit.CONST_CAVE_WIDTH + "%", rhit.CONST_CAVE_WIDTH + "%");
		diamond.node.classList.add("cave-rect");
		diamond.rotate(45);

		///this is a hack due to path not supporting %s
		const trueWidth = rhit.CONST_CAVE_WIDTH * 1.5 * this.container.offsetWidth / 100;
		const trueTLX = (cave.x - rhit.CONST_CAVE_WIDTH) * this.container.offsetWidth / 100;
		const trueTLY = (cave.y - rhit.CONST_CAVE_WIDTH) * this.container.offsetHeight / 100;

		const pathString = `M${trueTLX} ${trueTLY}h${trueWidth}M${trueTLX} ${trueTLY + trueWidth}h${trueWidth}`;
		const bars = this.paper.path(pathString);
		
		if(this.displaySize) {
			const sizeText = this.paper.text((topLeftX + (rhit.CONST_CAVE_WIDTH/2)) + "%", (topLeftY + (rhit.CONST_CAVE_WIDTH/2)) + "%", cave.size)
			sizeText.attr({fill: "#000"});
			sizeText.node.setAttribute("dominant-baseline", "middle"); //properly centers text
		}
	}

	getExitPosition(cave, exitIndex) {
		switch(exitIndex) {
			case 0: //top
				return {'x':cave.x, 'y':cave.y - rhit.CONST_CAVE_SIDE};
			case 1: //top right
				return {'x':cave.x + rhit.CONST_CAVE_SIDE / 2, 'y':cave.y - rhit.CONST_CAVE_SIDE / 2};
			case 2: //bottom right
				return {'x':cave.x + rhit.CONST_CAVE_SIDE / 2, 'y':cave.y + rhit.CONST_CAVE_SIDE / 2};
			case 3: //bottom
				return {'x':cave.x, 'y':cave.y + rhit.CONST_CAVE_SIDE};
			case 4: //bottom left
				return {'x':cave.x - rhit.CONST_CAVE_SIDE / 2, 'y':cave.y + rhit.CONST_CAVE_SIDE / 2};
			case 5: //top left
				return {'x':cave.x - rhit.CONST_CAVE_SIDE / 2, 'y':cave.y - rhit.CONST_CAVE_SIDE / 2};
			default:
				return {'x':cave.x, 'y':cave.y};
		}
	}

}

rhit.FbCavesManager = class
{
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CAVES);
		this._unsubscribe = null;
	}

	add(name, tags, mapInfo) {
		this._ref.add({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_TAGS]: tags,
			[rhit.FB_KEY_MAP_INFO]: mapInfo,
			[rhit.FB_KEY_PUBLIC]: false,
			[rhit.FB_KEY_LIKES]: 0,
			[rhit.FB_KEY_USER]: this._uid
		}).then(function (docRef) {
			console.log("Document written with ID: ", docRef.id);
		}).catch(function (error) {
			console.log("Error adding document: ", error);
		})
	}

	beginListening(changeListener) {
		//TODO: make sure to query enough items
		let query = this._ref.orderBy(rhit.FB_KEY_LIKES, "desc").limit(50);
		if(document.querySelector("#accountPage")) {
			query = query.where(rhit.FB_KEY_USER, "==", this._uid);
		}
		else {
			query = query.where(rhit.FB_KEY_PUBLIC, "==", true);
		}
		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getCaveAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		return new rhit.FbSingleCaveManager(docSnapshot.id);
	}
}

rhit.FbSingleCaveManager = class {
	constructor(caveId) {
		this._documentSnapshot = {};
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CAVES).doc(caveId);
		this._unsubscribe = null;
	}

	beginListening(changeListener, i, map, browse)
	{
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				changeListener(i, map, browse);
			}
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(name, tags, isPublic, likes) {
		this._ref.update({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_TAGS]: tags,
			[rhit.FB_KEY_PUBLIC]: isPublic,
			[rhit.FB_KEY_LIKES]: likes
		}).then(() => {
			console.log("Document successfully updated!");
		}).catch(function(error) {
			console.error("Error updating document: ", error);
		});
	}

	like() {
		this.update(this.name, this.tags, this.isPublic, this.likes + 1);
	}

	delete() {
		return this._ref.delete();
	}

	get likes() {
		return this._documentSnapshot.get(rhit.FB_KEY_LIKES);
	}

	get mapInfo() {
		return JSON.parse(this._documentSnapshot.get(rhit.FB_KEY_MAP_INFO));
	}

	get name() {
		return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	}

	get isPublic() {
		return this._documentSnapshot.get(rhit.FB_KEY_PUBLIC);
	}

	get tags() {
		return this._documentSnapshot.get(rhit.FB_KEY_TAGS);
	}

	get user() {
		return this._documentSnapshot.get(rhit.FB_KEY_USER);
	}
}

rhit.GeneratePageController = class {
	constructor() {
		const numCavesInput = document.querySelector("#inputNumberOfCaves");
		const generateLinesInput = document.querySelector("#inputExits")

		document.querySelector("#generateButton").onclick = (params) => {
			rhit.caveSystemGenerator.generateSystem();
			this.caveSystemDrawer.drawCaveSystem(rhit.caveSystemGenerator.currentSystem);
			//console.log(rhit.caveSystemGenerator.currentSystem);
		};

		document.querySelector("#submitConfigure").onclick = (params) => {
			console.log(numCavesInput.value, generateLinesInput.checked);
			const numToUse = numCavesInput.value ? parseInt(numCavesInput.value) : rhit.randomRange(3,9);
			rhit.caveSystemGenerator.generateSystem(numToUse, false, generateLinesInput.value);
			this.caveSystemDrawer.drawCaveSystem(rhit.caveSystemGenerator.currentSystem);
			//console.log(rhit.caveSystemGenerator.currentSystem);
		};

		document.querySelector("#submitSave").onclick = (params) => {
			const name = document.querySelector("#inputMapName").value;
			const tags = document.querySelector("#inputMapTags").value;
			const mapInfo = JSON.stringify(rhit.caveSystemGenerator.currentSystem);
			rhit.fbCavesManager.add(name, tags, mapInfo);
		};

		this.caveSystemDrawer = new rhit.CaveSystemDrawer(document.querySelector("#canvas"));
		this.caveSystemDrawer.drawCaveSystem(rhit.caveSystemGenerator.currentSystem);
		//console.log(rhit.caveSystemGenerator.currentSystem);
	}
}

rhit.BrowsePageController = class {
	constructor() {
		rhit.fbCavesManager.beginListening(this.updateList.bind(this));
		this.caveSystemDrawers = [];
	}

	updateList() {
		for(let i = 0; i < rhit.fbCavesManager.length; i++) {
			const map = rhit.fbCavesManager.getCaveAtIndex(i);
			map.beginListening(loadMapData.bind(this), i, map, true);
		}
	}
}

function loadMapData(i, map, browse) {
	$("#mapList").append(`<div id="map${i}"></div>`);
	$(`#map${i}`).load("/templates.html .map-item", () => {
		document.querySelector(`#map${i} .map-title`).innerText = map.name;
		document.querySelector(`#map${i} .map-tags`).innerText = map.tags;
		document.querySelector(`#map${i} .map-likes`).innerHTML = "<span class='heart'>♥</span>&nbsp;" + map.likes;
		if(browse) {
			document.querySelector(`#map${i} .edit-button`).hidden = true;
			document.querySelector(`#map${i} .like-button`).onclick = (event) => {
				map.like();
			};
		}
		else {
			document.querySelector(`#map${i} .like-button`).hidden = true;
			document.querySelector(`#map${i} .edit-button`).dataset.target = "#editModal";
			document.querySelector(`#map${i} .edit-button`).onclick = (event) => {
				rhit.accountPageController.selectedMap = map;
			};
		}
		document.querySelector(`#map${i} .print-button`).onclick = (event) => {
			//TODO: print map
		};
	});
}

rhit.AccountPageController = class {
	constructor() {
		$("#mapList").empty();
		rhit.fbCavesManager.beginListening(this.updateList.bind(this));
		this.selectedMap = null;
		this.caveSystemDrawers = [];
	}

	updateList() {
		for(let i = 0; i < rhit.fbCavesManager.length; i++) {
			$("#mapList").empty();
			const map = rhit.fbCavesManager.getCaveAtIndex(i);
			map.beginListening(loadMapData.bind(this), i, map, false);
		}
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener, i, map) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener(i, map);
		});
	}

	signUp(email, password) {
		firebase.auth().createUserWithEmailAndPassword(email, password).then(function () {
			$('#registerModal').modal('hide');
		}).catch(function (error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			console.log("Sign Up error:", errorCode, errorMessage);
			if(errorCode == "auth/weak-password") {
				document.querySelector("#registerError").innerHTML = "Password must be at least 6 characters";
			} else if(errorCode == "auth/email-already-in-use") {
				document.querySelector("#registerError").innerHTML = "There is already an account with this email";
			} else if(errorCode == "auth/invalid-email") {
				document.querySelector("#registerError").innerHTML = "The entered email is formatted incorrectly";
			} else {
				document.querySelector("#registerError").innerHTML = "There was a registration error. Please try again";
			}
			document.querySelector("#registerError").hidden = false;
		});
	}

	signIn(email, password) {
		firebase.auth().signInWithEmailAndPassword(email, password).then(function () {
			$('#logInModal').modal('hide');
		}).catch(function (error) {
			// Handle Errors here.
			var errorCode = error.code;
			var errorMessage = error.message;
			console.log("Log In error:", errorCode, errorMessage);
			if(errorCode == "auth/wrong-password") {
				document.querySelector("#logInError").innerHTML = "Password is incorrect";
			} else if(errorCode == "auth/user-not-found") {
				document.querySelector("#logInError").innerHTML = "There is not an account with this email";
			} else if(errorCode == "auth/invalid-email") {
				document.querySelector("#logInError").innerHTML = "The entered email is formatted incorrectly";
			} else {
				document.querySelector("#logInError").innerHTML = "There was a log in error. Please try again";
			}
			document.querySelector("#logInError").hidden = false;
		});
	}

	signOut() {
		firebase.auth().signOut().catch(function (error) {
			// An error happened.
			console.log("Sign out error:", error);
		});
	}

	get isSignedIn() {
		return !!this._user;
	}

	get uid() {
		if(this.isSignedIn) {
			return this._user.uid;
		}
		return null;
	}
}

rhit.initializePage = function() {

	rhit.intializeNavbar();
	rhit.fbCavesManager = new rhit.FbCavesManager(rhit.fbAuthManager.uid);

	if(document.querySelector("#generatePage")) {
		rhit.caveSystemGenerator = new rhit.CaveSystemGenerator();
		new rhit.GeneratePageController();

		//unlink save modal if not logged in
		if(!rhit.fbAuthManager.isSignedIn) {
			document.querySelector("#saveButton").dataset.target = "#logInRequiredModal";
		} else {
			document.querySelector("#saveButton").dataset.target = "#saveModal";
		}
	}
	else if(document.querySelector("#browsePage")) {
		new rhit.BrowsePageController();
	}
	else if(document.querySelector("#accountPage")) {
		rhit.accountPageController = new rhit.AccountPageController();
		$("#editModal").on("show.bs.modal", () => {
			document.querySelector("#inputMapName").value = rhit.accountPageController.selectedMap.name;
			document.querySelector("#inputMapName").parentElement.classList.add("is-filled");
			document.querySelector("#inputMapTags").value = rhit.accountPageController.selectedMap.tags;
			document.querySelector("#inputMapTags").parentElement.classList.add("is-filled");
			document.querySelector("#isPublic").checked = rhit.accountPageController.selectedMap.isPublic;
			document.querySelector("#deleteButton").onclick = function () {rhit.accountPageController.selectedMap.delete()};
			document.querySelector("#submitSave").onclick = function () {rhit.accountPageController.selectedMap.update(document.querySelector("#inputMapName").value, document.querySelector("#inputMapTags").value,document.querySelector("#isPublic").checked,rhit.accountPageController.selectedMap.likes)};
		});
	}

	$("body").bootstrapMaterialDesign();
}

rhit.intializeNavbar = function() {

	//display correct button set
	if (rhit.fbAuthManager.isSignedIn) {
		document.querySelector("#guestButtons").hidden = true;
		if (document.querySelector("#accountPage")) {
			document.querySelector("#accountPageButton").hidden = false;
		} else {
			document.querySelector("#memberButton").hidden = false;
		}
	} else {
		document.querySelector("#guestButtons").hidden = false;
		document.querySelector("#accountPageButton").hidden = true;
		document.querySelector("#memberButton").hidden = true;
	}

	//link all buttons to relevant things
	document.querySelector("#submitLogIn").addEventListener("click", (event) => {
		const username = document.querySelector("#inputEmailLogIn").value;
		const password = document.querySelector("#inputPasswordLogIn").value;
		rhit.fbAuthManager.signIn(username, password);
	});

	$("#logInModal").on("show.bs.modal", (error) => {
		document.querySelector("#inputEmailLogIn").value = "";
		document.querySelector("#inputEmailLogIn").parentElement.classList.remove("is-filled");
		document.querySelector("#inputPasswordLogIn").value = "";
		document.querySelector("#inputPasswordLogIn").parentElement.classList.remove("is-filled");
		document.querySelector("#logInError").innerHTML = "";
		document.querySelector("#logInError").hidden = true;
	});

	document.querySelector("#submitRegister").addEventListener("click", (event) => {
		const username = document.querySelector("#inputEmailRegister").value;
		const password = document.querySelector("#inputPasswordRegister").value;
		const passwordConfirm = document.querySelector("#inputConfirmPasswordRegister").value;
		if(password == passwordConfirm) {
			rhit.fbAuthManager.signUp(username, password);
		} else {
			document.querySelector("#registerError").innerHTML = "Passwords do not match";
			document.querySelector("#registerError").hidden = false;
		}
	});

	$("#registerModal").on("show.bs.modal", (error) => {
		document.querySelector("#inputEmailRegister").value = "";
		document.querySelector("#inputEmailRegister").parentElement.classList.remove("is-filled");
		document.querySelector("#inputPasswordRegister").value = "";
		document.querySelector("#inputPasswordRegister").parentElement.classList.remove("is-filled");
		document.querySelector("#inputConfirmPasswordRegister").value = "";
		document.querySelector("#inputConfirmPasswordRegister").parentElement.classList.remove("is-filled");
		document.querySelector("#registerError").innerHTML = "";
		document.querySelector("#registerError").hidden = true;
	});

	document.querySelector("#signOutButton").addEventListener("click", (event) => {
		rhit.fbAuthManager.signOut();
	});
}

rhit.checkForRedirects = function() {
	if(!rhit.fbAuthManager.isSignedIn) {
		if(document.querySelector("#accountPage")) {
			window.location.href = "/";
		}
	} else {

	}
}

rhit.main = function () {
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log('rhit.fbAuthManager.isSignedIn :>> ', rhit.fbAuthManager.isSignedIn);
		if(rhit.fbAuthManager.isSignedIn) { console.log('rhit.fbAuthManager.uid :>> ', rhit.fbAuthManager.uid); };
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();