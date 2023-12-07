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
function calculateMedian(values) {
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

function calculateAverage(values) {
	return values.reduce((a, b) => { return a + b }) / values.length;
}

// calculate the standard deviation among a set of numbers. parameter: array of int or float
function calculateDeviation(values, useMedian=true) {
	values = values.slice(0); // THIS IS NECESSARY SINCE values IS TREATED AS A REFERENCE TO THE ORIGINAL ARRAY WHICH THE FUNCTION WILL THEN WORK ON, MESSING EVERYTHING UP FOR THE REST OF US!!! PROPER LANGUAGES WOULD USE (ref values) TO INDUCE THAT ON PURPOSE AND WORK ON A LOCAL COPY OTHERWISE, BUT JAVASCRIPT PREFERS TO DO UNANNOUNCED OPEN HEART SURGERY ON OTHER PEOPLE'S VARIABLES!!!!
	if(useMedian) {
		/*
		* calculate median of all values, then replace each value in array with its deviation from median
		* the median of all deviations is the median absolute deviation
		*/
		let baseline = calculateMedian(values);
		values.forEach((element, index) => { values[index] = Math.abs(element - baseline) });
		return calculateMedian(values);
	} else {
		let baseline = calculateAverage(values);
		let population_standard_deviation = 0;
		values.forEach(value => {
			population_standard_deviation += Math.pow(value - baseline, 2);
		});
		population_standard_deviation = population_standard_deviation / values.length;
		
		return Math.sqrt(population_standard_deviation);
	}
	
	// formula for calculating SD: https://www.scribbr.com/statistics/standard-deviation/
	// formula for calculating MAD (median absolute deviation)
}

// determine interquartile range (look it up), another measure of variability
function calculateIQR(values) {
	// need at least 4 values to get quartiles
	if(values.length < 4) { return NaN }
	
	// sort from low to high (duh)
	values.sort();
	
	// slice array in halves; if odd number of entries, round up to exclude the middle
	let upper_half = values.slice(Math.ceil(values.length / 2));
	let lower_half = values.slice(0, Math.floor(values.length / 2));
	
	/*
	* get the median of each half. an explanation is too much effort here, so just do the maths yourself.
	* example:
	*   lower half is 4 entries. length / 2 = 2
	*   lower slice boundary: 2 - 1 = 1 (0-based index -> 2nd entry of 4)
	*   upper slice boundary: 2.1 rounded up (.ceil) to 3 -> 4th entry -> slice stops before (exclusive index)
	* result: entries 1 and 2 (2nd and 3rd entry) are returned
	* example II:
	*   lower half is 5 entries. length 2 / = 2.5
	*   lower slice boundary: 2.5 rounded up to 3, -1 = 2 (3rd entry of 5, the middle)
	*   upper slice boundary: 2.6 rounded up to 3, slice stops before 4th entry
	* result: only the 3rd entry (the middle) is returned
	*/
	let lower_quartile = lower_half.slice(Math.ceil(lower_half.length / 2) - 1, Math.ceil(lower_half.length / 2 + 0.1));
	let upper_quartile = upper_half.slice(Math.ceil(upper_half.length / 2) - 1, Math.ceil(upper_half.length / 2 + 0.1));
	
	lower_quartile = lower_quartile.length > 1 ? calculateAverage(lower_quartile) : lower_quartile[0];
	upper_quartile = upper_quartile.length > 1 ? calculateAverage(upper_quartile) : upper_quartile[0];
	return upper_quartile - lower_quartile;
}

/*
* round to a specified precision. parameters: float, int or float
* whole integers will be treated as desired amount of decimals
* floats between 0 and 1 will be treated as rounding to that number
* i.e. precision=0.5 will round to the nearest 0/0.5/1
* floats above 1 will throw an error
* precision = 0 will round the number directly to 0 decimals
*/
function roundPrecision(number, precision) {
	// round to nearest 0..1 float. i.e. precision=0.25 -> round to 0, 0.25, 0.5, 0.75, 1
	if(precision > 0 && precision < 1) {
		// horrible call here: have to invoke function itself again to round to amount of decimals of precision specified, for reasons unknown rounding to nearest i.e. multiple of 0.13 returns a multiple of 0.12999999, etc etc
		return roundPrecision(
			Math.round(number * (1 / precision)) / (1 / precision),
			precision.toString().split(".")[1].length
		);
	}
	
	if(precision % 1 > 0) {
		throw new Error("Precision is not valid: must be 0, float 0..1, or integer >= 1!");
	}
	
	if(precision >= 1) {
		return Math.round(number * Math.pow(10, precision)) / Math.pow(10, precision); 
	}
	
	if(precision == 0) {
		return Math.round(number);
	}
	
	// if nothing else has been caught, something has gone wrong
	throw new Error(`Unknown error! Number=${number}, Precision=${precision}`);
}


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
var elemDirector = $("#director");
var elemStoryBy = $("#storyby");
var elemScriptBy = $("#scriptby");
var elemProtagonists = $("#protagonists");
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
	
	elemDirector.value = "";
	elemStoryBy.value = "";
	elemScriptBy.value = "";
	elemProtagonists.value = "";
	
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
	
	let director = elemDirector.value;
	let storyby = elemStoryBy.value;
	let scriptby = elemScriptBy.value;
	let protagonists = elemProtagonists.value;
	
	if(storyby == null || storyby.length < 1) {
		storyby = [];
	} else if(storyby.indexOf(",") < 0) {
		storyby = [storyby];
	} else {
		storyby = storyby.split(",");
		storyby.forEach((writer, index) => { storyby[index] = writer.trim(); });
	}
	
	if(scriptby == null || scriptby.length < 1) {
		scriptby = [];
	} else if(scriptby.indexOf(",") < 0) {
		scriptby = [scriptby];
	} else {
		scriptby = scriptby.split(",");
		scriptby.forEach((writer, index) => { scriptby[index] = writer.trim(); });
	}
	
	if(protagonists == null || protagonists.length < 1) {
		protagonists = [];
	} else if(protagonists.indexOf(",") < 0) {
		protagonists = [protagonists];
	} else {
		protagonists = protagonists.split(",");
		protagonists.forEach((protagonist, index) => { protagonists[index] = protagonist.trim(); });
	}
	
	let episode = new Episode(title, season, number, double);
	episode.Plausible = parseInt($("#rate_plausible").getAttribute("data-rating"));
	episode.Emotional = parseInt($("#rate_emotional").getAttribute("data-rating"));
	episode.Original = parseInt($("#rate_original").getAttribute("data-rating"));
	episode.Continuity = parseInt($("#rate_continuity").getAttribute("data-rating"));
	episode.Characters = parseInt($("#rate_characters").getAttribute("data-rating"));
	episode.Notes = notes;
	
	episode.Director = director;
	episode.StoryBy = storyby;
	episode.ScriptBy = scriptby;
	episode.Protagonists = protagonists;
	
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
				/*console.log("Created new season: Season " + (s+1));*/
				show.Seasons[s].Episodes = [];
				for(let e = 0; e < tempObj.Seasons[s].Episodes.length; e++) {
					if(tempObj.Seasons[s].Episodes[e] == null) {
						show.Seasons[s].Episodes[e] = null;
						/*console.log((e+1) + ": Empty episode");*/
						continue;
					}
					let tempEp = tempObj.Seasons[s].Episodes[e];
					if(tempEp == "PLACEHOLDER") {
						show.Seasons[s].Episodes[e] = "PLACEHOLDER";
						/*console.log((e+1) + ": Placeholder for previous episode (episode " + e + ")");*/
					} else if (isEpisode(tempEp)) {
						let episode = new Episode(tempEp.Title, tempEp.season, tempEp.number, tempEp.double);
						episode.Plausible = tempEp.Plausible;
						episode.Emotional = tempEp.Emotional;
						episode.Original = tempEp.Original;
						episode.Continuity = tempEp.Continuity;
						episode.Characters = tempEp.Characters;
						episode.Notes = tempEp.Notes;
						
						/* since thesewere added later, I have to check loaded episodes and possibly use empty defaults instead*/
						episode.Director = tempEp.Director ? tempEp.Director : "";
						episode.StoryBy = tempEp.StoryBy ? tempEp.StoryBy : [];
						episode.ScriptBy = tempEp.ScriptBy ? tempEp.ScriptBy : [];
						episode.Protagonists = tempEp.Protagonists ? tempEp.Protagonists : [];
						
						show.Seasons[s].Episodes[e] = episode;
						/*console.log((e+1) + ": Episode found: " + episode.Title);*/
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
		let seasonEpisodeRatingsList = [];
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
				/*console.log(`${episode}: ${average} / ${considered} = ${average / considered}`);*/
				if(considered > 0) {
					average = average / considered;
          average = roundPrecision(average, 1);
					// average = roundPrecision(average, 0.5);
					if(average > 5) { average = 5; }
					
					seasonRating += average;
					seasonEpisodeRatingsList.push(average);
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
				index.classList.add(considered == 0 ? "unrated" : "rated");
			}
			list.appendChild(index);
		}
		
		let min_rated = seasonEpisodeRatingsList.sort()[0];
		let max_rated = seasonEpisodeRatingsList[seasonEpisodeRatingsList.length - 1];
		let minmax_str1 = `<small class="min_rated">${min_rated} \u2190&nbsp;</small>`;
		let minmax_str2 = `&nbsp;<small class="max_rated">\u2192 ${max_rated}</small><br/>`;
		
		if(elemMedian.checked) {
			p.innerHTML += minmax_str1;
			p.innerHTML += rateString(calculateMedian(seasonEpisodeRatingsList));			
			p.innerHTML += minmax_str2;
			
			p.innerHTML += `<small><abbr title="Median Absolute Deviation">MAD</abbr>: ${roundPrecision(calculateDeviation(seasonEpisodeRatingsList, true), 1)}</small>`;
		} else {
			p.innerHTML += minmax_str1;
			p.innerHTML += rateString(roundPrecision(seasonRating / episodesRated, 1)); // round to one decimal digit
			p.innerHTML += minmax_str2;
			
			p.innerHTML += `&nbsp;<small><abbr title="Standard Deviation">SD</abbr>: ${roundPrecision(calculateDeviation(seasonEpisodeRatingsList, false), 1)}</small>`;
		}
		
		p.innerHTML += `, <small><abbr title="Interquartile Range">IQR</abbr>: ${roundPrecision(calculateIQR(seasonEpisodeRatingsList), 1)}</small>`;
		
		/*console.error(`Season ${s+1}, ratings: ${seasonEpisodeRatingsList.join(", ")}`);*/
		
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
	
	elemDirector.value = episode.Director;
	elemStoryBy.value = episode.StoryBy.join(", ");
	elemScriptBy.value = episode.ScriptBy.join(", ");
	elemProtagonists.value = episode.Protagonists.join(", ");
	
	$("#rate_plausible").setAttribute("data-rating", episode.Plausible);
	$("#rate_emotional").setAttribute("data-rating", episode.Emotional);
	$("#rate_original").setAttribute("data-rating", episode.Original);
	$("#rate_continuity").setAttribute("data-rating", episode.Continuity);
	$("#rate_characters").setAttribute("data-rating", episode.Characters);
}
