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

rhit.navBarTemplate;
rhit.caveSystemGenerator;
rhit.fbAuthManager;
rhit.fbSingleCaveManager;
rhit.fbCavesManager;

rhit.CaveSystemGenerator = class {
	constructor() {
		this.currentSystem = null;
		this.generateSystem();
	};

	generateSystem(numCaves, generateEntranceExit = true) {
		let cavesToGenerate = numCaves ? numCaves : rhit.randomRange(3, 8);
		let caveSystem = [];

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

		this.currentSystem = caveSystem;
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

	linkCave = function(otherCave, thisIndex, otherIndex) {
		this.links[this.links.indexOf(null)] = otherIndex;
		otherCave.links[otherCave.links.indexOf(null)] = thisIndex;
	}
}

rhit.randomRange = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
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

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}
}

rhit.FbSingleCaveManager = class {
	constructor(caveId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_CAVES).doc(caveId);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data: ", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			}
			else {
				console.log("No such document!");
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

	delete() {
		return this._ref.delete();
	}

	get likes() {
		return this._documentSnapshot.get(rhit.FB_KEY_LIKES);
	}

	get mapInfo() {
		return this._documentSnapshot.get(rhit.FB_KEY_MAP_INFO);
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
		const enterExitInput = document.querySelector("#inputExits")

		document.querySelector("#generateButton").onclick = (params) => {
			rhit.caveSystemGenerator.generateSystem();
			console.log(rhit.caveSystemGenerator.currentSystem);
		};

		document.querySelector("#submitConfigure").onclick = (params) => {
			console.log(numCavesInput.value, enterExitInput.checked);
			const numToUse = numCavesInput.value ? parseInt(numCavesInput.value) : rhit.randomRange(3,9);
			rhit.caveSystemGenerator.generateSystem(numToUse, enterExitInput.value);
			console.log(rhit.caveSystemGenerator.currentSystem);
		};

		document.querySelector("#submitSave").onclick = (params) => {
			const name = document.querySelector("#inputMapName").value;
			const tags = document.querySelector("#inputMapTags").value;
			const mapInfo = JSON.stringify(rhit.caveSystemGenerator.currentSystem);
			rhit.fbCavesManager.add(name, tags, mapInfo);
		};

		console.log(rhit.caveSystemGenerator.currentSystem);
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
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

	rhit.fbCavesManager = new rhit.FbCavesManager(rhit.fbAuthManager.uid);

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