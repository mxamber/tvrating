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


// calculate median average (as opposed to arithmetic average)
function median(values) {
  if(values.length == 0 || values.length == undefined) {
    return NaN;
  }
  if(values.length == 1) {
    return values[0];
  }
  values.sort((x, y) => { return x-y; });
  let half = Math.floor(values.length / 2);
  if(half % 2 && half > 2) {
    return values[half];
  }
  return ((values[half] + values[half-1]) / 2);
};


// pad numbers with zeroes
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
var elemDelete = $("#delete");
var elemWeighted = $("#weighted");
var elemMedian = $("#median");
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

// does an episode exist?
function exists(show, season, episode) {
	if(
		show == (null || undefined || "") ||
		show.Seasons[season] == (null || undefined || "") ||
		show.Seasons[season].Episodes == (null || undefined || "") ||
		show.Seasons[season].Episodes[episode] == (null || undefined || "")
		) {
		return false;
	}
	return true;
}

// returns a HTML element representing an input control to submit a 1 to 5 star rating
// parameters: label (inserted before control), id, tooltip (can be blank)
function rateButton(
	// parameters
	label,
	id,
	tooltip = "",
	descriptor1 = "It's abysmal",
	descriptor2 = "It's meh",
	descriptor3 = "It's okay",
	descriptor4 = "It's good",
	descriptor5 = "It's great"
) {
	let outer = document.createElement("span");
	outer.setAttribute("class", "rating");
	outer.setAttribute("id", id);
	if(tooltip.length > 0) { outer.setAttribute("title", tooltip); }
	outer.setAttribute("data-rating", 0);
	if(label.length > 0) { outer.innerHTML = label + "&emsp;"; }
	
	let inner; // to be re-used
	
	inner = document.createElement("span");
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 1);");
	inner.setAttribute("title", descriptor1);
	inner.innerHTML = "&#9733;"; // five-pointed star symbol (decimal unicode value)
	outer.appendChild(inner);
	
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 2);");
	inner.setAttribute("title", descriptor2);
	outer.appendChild(inner);
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 3);");
	inner.setAttribute("title", descriptor3);
	outer.appendChild(inner);
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 4);");
	inner.setAttribute("title", descriptor4);
	outer.appendChild(inner);
	inner = inner.cloneNode(true);
	inner.setAttribute("onclick", "this.parentNode.setAttribute(\"data-rating\", 5);");
	inner.setAttribute("title", descriptor5);
	outer.appendChild(inner);
	
	outer.innerHTML += "<br/>";
	
	return outer;
}


function rateString(average) {
	let ratingHtml = "<span title=\"" + average + "\" class=\"sup rating average\">";
	for(let i = 0; i < Math.floor(average); i++) { ratingHtml += "\u2605"; }
	if(average % 1 > 0.25 && average % 1 < 0.75) {
		ratingHtml += "\u00BD";
	} else if(average % 1 >= 0.75) {
		ratingHtml += "\u2605";
	}
	ratingHtml += "</span>";
	
	return ratingHtml;
}


// function to wipe all inputs and recreate the rating inputs
function renew() {
	elemTitle.value = "";
	elemDouble.checked = false;
	elemNotes.value = "";
	
	elemRatings.innerHTML = "";
	
	elemRatings.appendChild(rateButton(
		"Plausibility",
		"rate_plausible",
		"Is the plot plausible? Is there too much ex machina?\nDoes it only work because of handwaving?",
		"It's absurd",
		"There's plot holes",
		"It's fine",
		"It's realistic",
		"Immaculate reality"
	));
	
	elemRatings.appendChild(rateButton(
		"Emotionality",
		"rate_emotional",
		"Does the episode make you laugh or cry?\nDoes it evoke emotions (besides boredom) at all?",
		"I hate it",
		"I don't like it",
		"It's alright",
		"It's moving",
		"I love it"
	));
	
	elemRatings.appendChild(rateButton(
		"Originality",
		"rate_original",
		"Is the plot original? Full of overused tropes?\nCopying (not parodying!) something?",
		"This is plagiarism",
		"Seen it before",
		"It's unremarkable",
		"It's a new approach",
		"It's groundbreaking"
	));
	
	elemRatings.appendChild(rateButton(
		"Continuity",
		"rate_continuity",
		"Does the episode enhance existing continuity?\nDoes it contradict/ignore earlier events?",
		"It's one giant plot hole",
		"There's some contradictions",
		"No additions, no contradictions",
		"Enhances continuity",
		"Huge additions to lore"
	));
	
	elemRatings.appendChild(rateButton(
		"Characters",
		"rate_characters",
		"Does the episode advance the characters' arcs?\nIs a character OOC? Badly written?",
		"Characters are grossly OOC",
		"Characters are acting weird",
		"It's unremarkable",
		"Characters receive special attention\nThere is notable character development",
		"Characters are developed a lot"
	));
}

function deleteEpisode() {
	let season = elemSeason.valueAsNumber;
	let number = elemEpisode.valueAsNumber;
	let title = elemTitle.value.trim();
	
	if(!exists(show, season - 1, number - 1)) {
		alert("No episode found! Can't delete what isn't there.");
		return;
	}
	
	if(!confirm(`Do you really want to delete ${season}x${number} "${title}"?`)) {
		return;
	}
	
	if(exists(show, season - 1, number - 2) && show.Seasons[season-1].Episodes[number-2].double) {
		show.Seasons[season-1].Episodes[number-2].double = false;
	}
	
	show.Seasons[season-1].Episodes[number-1] = null;
	updateShow();
}

// save the current entry as an episode in show.Seasons.Episodes
function submitEpisode() {
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
	
	if(show.Seasons[season-1].Episodes[number-1] != null || show.Seasons[season-1].Episodes[number-1] != undefined) {
		if(!confirm("Episode already exists! Overwrite?")) {
			return;
		}
	}
	// two-part episode? meaning, episode that has two numbers (TNG 01x01/02)
	// create a PLACEHOLDER in the following number (01 is the episode, 02 is a placeholder)
	if(double) {
		if(show.Seasons[season-1].Episodes[number] != null || show.Seasons[season-1].Episodes[number] != undefined) {
			if(!confirm("Next episode already exists! Overwrite?")) {
				return;
			}
		}
		show.Seasons[season-1].Episodes[number] = "PLACEHOLDER";
	}
	show.Seasons[season-1].Episodes[number-1] = episode;
	
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
	elemToc.style.display = "none";
	
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
	elemSubmit.addEventListener("click", submitEpisode);
	elemDelete.addEventListener("click", deleteEpisode);
	elemWeighted.addEventListener("click", function(){updateShow(false)});
	elemMedian.addEventListener("click", function(){updateShow(false)});

	// add event listener for pressing enter in the episode title input	
	elemTitle.addEventListener("keyup", function(event) {
		if(event.keyCode == 13) {
			submitEpisode();
			event.preventDefault();
		}
	});
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

function updateShow(wipeInputs = true) {
	if(show.Seasons.length < 1) {
		elemToc.style.display = "none";
		return;
	}
	
	// create clickable table of contents
	elemToc.innerHTML = "";
	elemToc.style.display = "";
	for(let s = 0; s < show.Seasons.length; s++) {
		let seasonRating = 0;
		let seasonMedianList = [];
		let episodesRated = 0;
		let p = document.createElement("p");
	
		let h = document.createElement("h3");
		h.classList.add("seasonHeader");
		h.id = "seasonHeader" + (s+1);
		h.innerText = "Season " + (s+1);
		h.title = "Jump to season " + (s+1);
		h.onclick = function() {
			elemSeason.value = (s+1);
			elemEpisode.value = 1;
			window.scrollTo(0,0);
			updateShow();
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
				window.scrollTo(0,0);
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
				window.scrollTo(0,0);
				elemTitle.focus();
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
				if(episode.Emotional > 0) {
					if(elemWeighted.checked) {
						average += (episode.Emotional * 2);
						considered += 2;
					} else {
						average += episode.Emotional;
						considered++;
					}
				}
				if(episode.Original > 0) { average += episode.Original; considered++; }
				if(episode.Continuity > 0) { average += episode.Continuity; considered++; }
				if(episode.Characters > 0) { average += episode.Characters; considered++; }
				console.log(`${episode}: ${average} / ${considered} = ${average / considered}`);
				if(considered > 0) {
					average = average / considered;
          average = Math.round(average * 10)/10;
					// average = Math.round(average*2)/2;
					if(average > 5) { average = 5; }
					
					seasonRating += average;
					seasonMedianList.push(average);
					episodesRated++;
					
					average = rateString(average);
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
		
		if(elemMedian.checked) {
			p.innerHTML += rateString(median(seasonMedianList));
		} else {
			seasonRating = seasonRating / episodesRated;
			seasonRating = Math.round(seasonRating * 10)/10; // round to one decimal digit
			p.innerHTML += rateString(seasonRating);
		}
		h.after(p);
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
	if(!wipeInputs) { return; }
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
