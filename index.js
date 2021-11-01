const $ = (el) => document.querySelector(el);
const modalContainer = $(".modal");

const textCase = ({ str, eachWord = false }) =>
	(eachWord ? str.split(" ") : str.split("."))
		.map(
			(el) =>
				el.trim().substring(0, 1).toUpperCase() +
				(eachWord
					? el.trim().substring(1).toLowerCase()
					: el.trim().substring(1))
		)
		.join(eachWord ? " " : ". ")
		.trim();

const saveAs = (filename, content) => {
	let a = document.createElement("a");
	a.setAttribute("href", content);
	a.setAttribute("download", filename);

	a.style.display = "none";
	document.body.appendChild(a);

	a.click();
	document.body.removeChild(a);
};

const validate = (json) => {
	if (!Array.isArray(json)) return "The object should be in an array";

	for (let q of json) {
		let key = Object.keys(q);
		if (key.length !== 3) return "Object keys should only be 3";
		if (
			!key.includes("quote") ||
			!key.includes("author") ||
			!key.includes("tags")
		)
			return "Object keys must be: quote, author and tags";
		if (!(typeof q.quote === "string") || !(typeof q.author === "string"))
			return "The property of quote and author should be a string";
		if (q.quote.length <= 0 || q.author.length <= 0)
			return "The property of quote and author can not be empty";
		if (!Array.isArray(q.tags))
			return "The property of tags must be an array";
		if (q.tags.length !== 2) return "The array of tags should only be 2";
		if (q.tags[0].length <= 0 || q.tags[1].length <= 0)
			return "The tags can not be empty";
		if (!/^[a-z A-Z]*$/g.test(q.tags.join("")))
			return "The tags should only contain a text";
	}

	return true;
};

const fetchAll = () => [
	JSON.parse(localStorage.getItem("jereneQuotes")),
	JSON.parse(localStorage.getItem("jereneTags")),
];

const closeModal = () => {
	modalContainer.style.display = "none";
	$(".modalConfirm").style.display = "none";
	$(".modalClose").style.display = "grid";
};

const showModal = (title, content, single = true) => {
	modalContainer.style.display = "grid";

	let modal = modalContainer.children["0"];
	let modalTitle = modal.children["0"];
	let modalContent = modal.children["1"];

	modalTitle.innerHTML = title;
	modalContent.innerHTML = content;

	if (!single) {
		$(".modalConfirm").style.display = "grid";
		$(".modalClose").style.display = "none";
	}
};

const closeTooltip = () => {
	$(".tooltip").style.opacity = "0";
	$(".tooltip").style.display = "none";
	$(".tooltipContent").innerHTML = "";
};

const showTooltip = (text) => {
	$(".tooltip").style.display = "grid";
	$(".tooltip").style.opacity = "0.9";
	$(".tooltipContent").innerHTML = text;
	setTimeout(closeTooltip, 2000);
};

const getDefaultOption = (str) =>
	`<option value="" disabled selected>${str}</option>`;

const resetAuthor = () => {
	$(".author").value = "";
};

const resetForm = () => {
	$(".tagsTotal").innerHTML = "0";
	$(".firstTag").innerHTML = getDefaultOption("First Tag");
	$(".secondTag").innerHTML = getDefaultOption("Second Tag");
	$(".editQuote").innerHTML = getDefaultOption("Edit Quote");
	$(".quotesTotal").innerHTML = "0";
};

const updateData = () => {
	resetForm();

	let [Quotes, Tags] = fetchAll();
	if (Quotes) {
		$(".quotesTotal").innerHTML = Quotes.length;
		Quotes = Quotes.map(
			(el, id) =>
				`<option value="${id}">${
					el.quote.substring(0, 16) + "..."
				}</option>`
		).reverse();

		for (let opt of Quotes) {
			$(".editQuote").innerHTML += opt;
		}
	}

	if (Tags) {
		$(".tagsTotal").innerHTML = Tags.length;

		for (let tag of Tags) {
			$(".firstTag").innerHTML += `
<option value="${tag}">
    ${tag}
</option>`;

			$(".secondTag").innerHTML += `
<option value="${tag}">
    ${tag}
</option>`;
		}
		return;
	}
};

const resetCache = (dialog = true) => {
	if (dialog) {
		showModal(
			"Warning",
			"Are you sure want to delete all the quotes from the localstorage?",
			false
		);
		return;
	}

	localStorage.removeItem("jereneQuotes");
	localStorage.removeItem("jereneTags");

	updateData();
	resetAuthor();
	$(".quote").value = "";
	closeModal();
	showTooltip("Localstorage cleared");
};

const submitTags = (imported = false, importedTag = []) => {
	let tags = importedTag;
	let [, prevTags] = fetchAll();

	if (!imported) {
		tags = $(".newTags").value.trim().toLowerCase();

		if (tags.length <= 2)
			return showModal(
				"Add New Tags Failed",
				"Tags length can not be less than 3 characters"
			);
		if (!/^[a-z A-Z,]*$/g.test(tags))
			return showModal(
				"Add New Tags Failed",
				"Tags should only contain a text, space and comma"
			);

		tags = tags.split(",").map((el) => el.trim());
	}

	let newTags = tags;
	prevTags && (newTags = Array.from(new Set([...prevTags, ...newTags])));

	localStorage.setItem("jereneTags", JSON.stringify(newTags));

	$(".newTags").value = "";
	updateData();
	showTooltip("New tags added");
};

const submitQuote = () => {
	let indexEdit = $(".indexEdit").value;
	let newQuote = {
		quote: $(".quote").value.trim(),
		author: $(".author").value.trim(),
		tags: [$(".firstTag").value.trim(), $(".secondTag").value.trim()],
	};

	if (
		newQuote.quote.length < 20 ||
		newQuote.author.length <= 2 ||
		newQuote.tags[0].length == 0 ||
		newQuote.tags[1].length == 0
	)
		return showModal(
			"Submit Failed",
			"<span>Quote length can not less than 20 characters.<br>Author length can not less than 3 characters.<br>First and second tag can not be empty.</span>"
		);

	if (newQuote.tags[0] == newQuote.tags[1])
		return showModal(
			"Submit Failed",
			"First tag and second tag can not be the same"
		);

	newQuote.author = textCase({ str: newQuote.author, eachWord: true });
	newQuote.quote = textCase({ str: newQuote.quote });

	let [Quotes] = fetchAll();
	!Quotes && (Quotes = []);

	if (indexEdit.length !== 0) {
		Quotes[parseInt(indexEdit)] = newQuote;
		$(".indexEdit").value = "";
		$(".editStatus").style.display = "none";
	} else {
		Quotes.push(newQuote);
	}

	localStorage.setItem("jereneQuotes", JSON.stringify(Quotes));
	$(".quote").value = "";
	updateData();
	showTooltip("Quotes submitted");
};

const editQuote = (index) => {
	let [Quotes] = fetchAll();
	if (!Quotes) return;

	let quoteTarget = Quotes[index];

	$(".quote").value = quoteTarget.quote;
	$(".author").value = quoteTarget.author;
	$(".firstTag").value = quoteTarget.tags[0];
	$(".secondTag").value = quoteTarget.tags[1];
	$(".indexEdit").value = index;
	$(".editStatus").style.display = "grid";
};

const exportJSON = () => {
	let [Quotes] = fetchAll();

	if (!Quotes) return showModal("Export Failed", "No Quotes in Localstorage");

	let quotes = JSON.stringify(Quotes);
	let content = btoa(quotes);
	let date = new Date().toLocaleString().split(",")[0].replace(/\//g, "-");
	saveAs(`quotes-${date}.json`, `data:application/json;base64,${content}`);
	showTooltip("Quotes exported");
};

const triggerInputFile = () => {
	$(".importJSON").click();
};

const importFile = (files) => {
	let file = files[0];
	let fileName = file.name.split(".");
	if (fileName[fileName.length - 1] !== "json")
		return "File should be a .json";

	let reader = new FileReader();
	reader.fileName = file.name;
	reader.onload = (e) => {
		let res = e.target.result;
		importJSON(res);
		showTooltip("Quotes imported");

		return;
	};
	reader.readAsText(file);
};

const importJSON = (data) => {
	let quotes = JSON.parse(data);
	let validation = validate(quotes);
	if (validation !== true) {
		showModal("Import Failed", validation);
		return;
	}

	let tags = Array.from(
		new Set(
			quotes
				.map((el) => el.tags)
				.reduce((acc, prev) => [...acc, ...prev], [])
		)
	);

	submitTags(true, tags);
	let [Quotes] = fetchAll();

	!Quotes && (Quotes = []);
	Quotes = [...Quotes, ...quotes];

	localStorage.setItem("jereneQuotes", JSON.stringify(Quotes));
	updateData();
};

const showTips = () => {
	showModal(
		"Tips",
		'I just wanna say, thank you for using this tools. Here is your JSON template: <a class="normalLink" href="template.json">template.json</a>Import JSON will not override the localstorage. Try to explore and experiment the features by yourself, lol.'
	);
};

updateData();
