/*
2BE8	&#11240;	⯨	left half black star
2605	&#9733;	★	black star
*/



// shorthand for document.querySelector etc
function $(query) {
	if(query == null || typeof query != "string") { return null; }
	
	if(document.querySelector(query)) { return document.querySelector(query); }
	if(document.getElementById(query)) { return document.getElementById(query); }
	
	return null;
}

function fNumber(number) {
	if(number < 10) {
		return "0" + number;
	}
	return number.toString();
}


// create empty Show
var show = new Show("", "");

// define shorthands for all relevant elements
var elemShow = $("#showname");
var elemID = $("#short");
var elemSave = $("#download");
var elemLoad = $("#load");
var elemFile = $("#file");
var elemSeason = $("#season");
var elemEpisode = $("#episode");
var elemTitle = $("#title");
var elemDouble =$("#double");
var elemNotes = $("#notes");
var elemRatings = $("#ratings");
var elemSubmit = $("#submit");
var elemToc = $("#toc");

// Class: Show
function Show(id, title) {
	this.Seasons = [];
	this.ID = id;
	this.Title = title;
}

// Class: Season
function Season() {
	this.Episodes = [];
}

// Class: Episode
function Episode(title, season, number, double = false) {
	this.Title = title;
	this.season = season;
	this.number = number;
	this.double = double;
	this.Plausible = -1;	// is the plot plausible? too much ex machina resolution?
	this.Emotional = -1;	// does it make me laugh / cry? does it leave me indifferent?
	this.Original = -1;	// is it original (or cliche)? overused tropes?
	this.Continuity = -1;	// does it respect continuity? contradict previous episodes?
	this.Characters = -1;	// does it further the characters / is OOC / neglect anyone?
	this.Notes = "";
	
	// override with custom toString() function
	this.toString = function() {
		let numberstr = fNumber(this.number);
		if(double) { numberstr += "/" + fNumber(this.number+1); }
		return `${this.season}x${numberstr} "${this.Title}"\nPlausibility: ${this.Plausible}\nEmotionality: ${this.Emotional}\nOriginality: ${this.Original}\nContinuity: ${this.Continuity}\nCharacters: ${this.Characters}`;
	}
}

// return true if object is valid episode (has all properties)
// return false if null or missing properties
function isEpisode(episode) {
	if(episode == null) {
		return false;
	}
	if(episode.Title != null
	&& episode.season
	&& episode.number
	&& episode.double != null
	&& episode.Plausible != null
	&& episode.Emotional != null
	&& episode.Original != null
	&& episode.Continuity != null
	&& episode.Characters != null
	&& episode.Notes != null) {
		return true;
	}
	return false;
}

// returns a HTML element representing an input control to submit a 1 to 5 star rating
// parameters: label (inserted before control), id, tooltip (can be blank)
function rateButton(label, id, tooltip="") {
	let outer = document.createElement("span");
	outer.setAttribute("class", "rating");
	outer.setAttribute("id", id);
	if(tooltip.length > 0) { outer.setAttribute("title", tooltip); }
	outer.setAttribute("data-rating", 0);
	if(label.length > 0) { outer.innerHTML = label + "&emsp;"; }
	
	let inner; // to be re-used
	
	inner = document.createElement("span");
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 1);");
	inner.innerHTML = "&#9733;"; // five-pointed star symbol (decimal unicode value)
	outer.appendChild(inner);
	
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 2);");
	outer.appendChild(inner);
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 3);");
	outer.appendChild(inner);
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 4);");
	outer.appendChild(inner);
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 5);");
	outer.appendChild(inner);
	
	outer.innerHTML += "<br/>";
	
	return outer;
}

// function to wipe all inputs and recreate the rating inputs
function renew() {
	elemTitle.value = "";
	elemDouble.checked = false;
	elemNotes.value = "";
	
	elemRatings.innerHTML = "";
	elemRatings.appendChild(rateButton("Plausibility", "rate_plausible", "Is the plot plausible? Is there too much ex machina?\nDoes it only work because of handwaving?"));
	elemRatings.appendChild(rateButton("Emotionality", "rate_emotional", "Does the episode make you laugh or cry?\nDoes it evoke emotions (besides boredom) at all?"));
	elemRatings.appendChild(rateButton("Originality", "rate_original", "Is the plot original? Full of overused tropes?\nCopying (not parodying!) something?"));
	elemRatings.appendChild(rateButton("Continuity", "rate_continuity", "Does the episode enhance existing continuity?\nDoes it contradict/ignore earlier events?"));
	elemRatings.appendChild(rateButton("Characters", "rate_characters", "Does the episode advance the characters' arcs?\nIs a character OOC? Badly written?"));
}

// save the current entry as an episode in show.Seasons.Episodes
function submit() {
	let title = elemTitle.value.trim();
	let number = elemEpisode.valueAsNumber;
	let season = elemSeason.valueAsNumber;
	let double = elemDouble.checked;
	let notes = elemNotes.value;
	
	let episode = new Episode(title, season, number, double);
	episode.Plausible = parseInt($("#rate_plausible").getAttribute("data-rating"));
	episode.Emotional = parseInt($("#rate_emotional").getAttribute("data-rating"));
	episode.Original = parseInt($("#rate_original").getAttribute("data-rating"));
	episode.Continuity = parseInt($("#rate_continuity").getAttribute("data-rating"));
	episode.Characters = parseInt($("#rate_characters").getAttribute("data-rating"));
	episode.Notes = notes;
	
	// season doesn't exist yet? create new
	if(!show.Seasons[season-1]) {
		show.Seasons[season-1] = new Season();
	}
	show.Seasons[season-1].Episodes[number-1] = episode;
	// two-part episode? meaning, episode that has two numbers (TNG 01x01/02)
	// create a PLACEHOLDER in the following number (01 is the episode, 02 is a placeholder)
	if(double) {
		show.Seasons[season-1].Episodes[number] = "PLACEHOLDER";
	}
	
	// refresh form: reset all inputs
	renew();
	
	// increment the episode number by 1 (by 2 if double episode)
	elemEpisode.value = (double ? number+2 : number+1);
	elemSeason.value = season;
	
	// read: any existing episode at the next slot? if so, display
	updateShow();
	
	elemTitle.focus();
}

// executed upon loading: empty and re-draw inputs
/* add event listeners:
* - import file
* - continuously update show metadata
* - read current episode if new number selected
* - add functions to buttons
*/
function init() {
	renew();
	elemID.addEventListener("change", function(){
		show.ID = elemID.value.trim();
	});
	elemShow.addEventListener("change", function(){
		show.Title = elemShow.value.trim();
	});
	elemFile.addEventListener("change", importShow);
	elemSeason.addEventListener("change", updateShow);
	elemEpisode.addEventListener("change", updateShow);
	elemSave.addEventListener("click", exportShow);
	elemLoad.addEventListener("click", function() { elemFile.click(); });
	elemSubmit.addEventListener("click", submit);
}

function exportShow() {
	let str = JSON.stringify(show, null, 4);
	// create invisible download link, click it, delete it
	let anchor = document.createElement("a");
	anchor.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(str));
	anchor.setAttribute("download", "ratings_" + show.ID + ".json");
	anchor.style.display = "none";
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
}

function importShow() {
	if(elemFile.files.length === 0) {
		alert("No file selected!");
		return;
	}
	
	let reader = new FileReader();
	reader.onload = event => {
		let imported = event.target.result;
		let tempObj = JSON.parse(imported);
		
		if(!tempObj.Title || !tempObj.ID || !tempObj.Seasons || tempObj.Seasons.length < 1) {
			alert("Invalid file!\n\nOne or more of the following properties were not found:\n- title\n- ID\n- seasons");
			return;
		}
		
		show.Title = tempObj.Title;
		show.ID = tempObj.ID;
		show.Seasons = [];
		elemShow.value = show.Title;
		elemID.value = show.ID;
		for(let s = 0; s < tempObj.Seasons.length; s++) {
			if(tempObj.Seasons[s] == null) {
				continue;
			}
			if(tempObj.Seasons[s].Episodes) {
				show.Seasons[s] = new Season();
				console.log("Created new season: Season " + (s+1));
				show.Seasons[s].Episodes = [];
				for(let e = 0; e < tempObj.Seasons[s].Episodes.length; e++) {
					if(tempObj.Seasons[s].Episodes[e] == null) {
						show.Seasons[s].Episodes[e] = null;
						console.log((e+1) + ": Empty episode");
						continue;
					}
					let tempEp = tempObj.Seasons[s].Episodes[e];
					if(tempEp == "PLACEHOLDER") {
						show.Seasons[s].Episodes[e] = "PLACEHOLDER";
						console.log((e+1) + ": Placeholder for previous episode (episode " + e + ")");
					} else if (isEpisode(tempEp)) {
						let episode = new Episode(tempEp.Title, tempEp.season, tempEp.number, tempEp.double);
						episode.Plausible = tempEp.Plausible;
						episode.Emotional = tempEp.Emotional;
						episode.Original = tempEp.Original;
						episode.Continuity = tempEp.Continuity;
						episode.Characters = tempEp.Characters;
						episode.Notes = tempEp.Notes;
						show.Seasons[s].Episodes[e] = episode;
						console.log((e+1) + ": Episode found: " + episode.Title);
					}
					
				}
			}
		}
	updateShow();
	};
	reader.onerror = error => reject(error);
	reader.readAsText(elemFile.files[0]);
}

function updateShow() {
	if(show.Seasons.length < 1) {
		return;
	}
	
	// create clickable table of contents
	elemToc.innerHTML = "";
	for(let s = 0; s < show.Seasons.length; s++) {
		let h = document.createElement("h3");
		h.classList.add("seasonHeader");
		h.id = "seasonHeader" + (s+1);
		h.innerText = "Season " + (s+1);
		h.title = "Jump to season " + (s+1);
		h.onclick = function() {
			elemSeason.value = (s+1);
			elemEpisode.value = 1;
		};
		elemToc.appendChild(h);
		
		let list = document.createElement("ul");
		list.classList.add("seasonList");
		list.id = "seasonList" + (s+1);
		list.style.listStyle = "none";
		elemToc.appendChild(list);
		
		if(show.Seasons[s] == null || show.Seasons[s].Episodes.length < 1) {
			let index = document.createElement("li");
			index.innerText = "01: ...";
			index.onclick = function() {
				elemSeason.value = (s+1);
				elemEpisode.value = 1;
				updateShow();
			};
			list.appendChild(index);
			continue;
		}
		
		for(let e = 0; e < show.Seasons[s].Episodes.length; e++) {
			let index = document.createElement("li");
			index.onclick = function() {
				elemSeason.value = (s+1);
				elemEpisode.value = (e+1);
				updateShow();
			};
			
			// empty episode? ... as title
			if(show.Seasons[s].Episodes[e] == null) {
				index.innerText = fNumber(e+1) + ": ...";
				index.title = `Create episode ${s+1}x${fNumber(e+1)}`;
			} else {
				let episode = show.Seasons[s].Episodes[e];
				
				let average = 0;
				let considered = 0;
				if(episode.Plausible > 0) { average += episode.Plausible; considered++; }
				if(episode.Emotional > 0) { average += episode.Emotional; considered++; }
				if(episode.Original > 0) { average += episode.Original; considered++; }
				if(episode.Continuity > 0) { average += episode.Continuity; considered++; }
				if(episode.Characters > 0) { average += episode.Characters; considered++; }
				console.log(`${episode}: ${average} / ${considered} = ${average / considered}`);
				if(considered > 0) {
					average = average / considered;
					average = Math.round(average*2)/2;
					if(average > 5) { average = 5; }
					
					let tempstr = "<span class=\"sup\">";
					for(let i = 0; i < Math.floor(average); i++) {
						tempstr += "\u2605";
					}
					if(average % 1 > 0) { tempstr += "\u00BD"; }
					average = tempstr + "</span>";
				} else {
					average = "";
				}
				
				let numberstr = fNumber(e+1);
				if(episode.double) {
					numberstr += "/" + fNumber(e+2);
					e++;
				}
				index.innerHTML = `${numberstr}: ${episode.Title} ${average}`;
				index.title = `Edit episode ${s+1}x${numberstr} ${episode.Title}`;
			}
			list.appendChild(index);
		}
	}
	
	// load current episode
	let e = elemEpisode.valueAsNumber;
	let s = elemSeason.valueAsNumber;
	if(show.Seasons[s-1] == null) {
		renew();
		return;
	}
	if(show.Seasons[s-1].Episodes[e-1] == "PLACEHOLDER") {
		e--;
		
		elemRatings.style.pointerEvents = "none";
		elemRatings.style.color = "gray";
		elemTitle.readOnly = true;
		elemTitle.style.color = "gray";
		elemDouble.style.pointerEvents = "none";
		$("#double + label").style.pointerEvents = "none";
		elemNotes.readOnly = true;
		elemNotes.style.color = "gray";
		elemSubmit.style.pointerEvents = "none";
	} else {
		elemRatings.style.pointerEvents = "";
		elemRatings.style.color = "";
		elemTitle.readOnly = false;
		elemTitle.style.color = "";
		elemDouble.style.pointerEvents = "";
		$("#double + label").style.pointerEvents = "";
		elemNotes.readOnly = false;
		elemNotes.style.color = "";
		elemSubmit.style.pointerEvents = "";
	}
	if(!isEpisode(show.Seasons[s-1].Episodes[e-1])) {
		renew();
		console.log("Not a valid episode! S" + s + "E" + e);
		return;
	}
	let episode = show.Seasons[s-1].Episodes[e-1];
	renew();
	elemTitle.value = episode.Title;
	elemDouble.checked = episode.double;
	elemNotes.value = episode.Notes;
	$("#rate_plausible").setAttribute("data-rating", episode.Plausible);
	$("#rate_emotional").setAttribute("data-rating", episode.Emotional);
	$("#rate_original").setAttribute("data-rating", episode.Original);
	$("#rate_continuity").setAttribute("data-rating", episode.Continuity);
	$("#rate_characters").setAttribute("data-rating", episode.Characters);
}
