// ==UserScript==
// @name         Abroad Items Info (Yata API)
// @namespace    hardy.yata.abroad
// @version      1.0
// @description  Updates Yata Database and shows Items on Travel Agency page
// @author       Hardy[2131687]
// @match        https://www.torn.com/travelagency.php*
// @match        https://www.torn.com/index.php*
// @updateURL    https://raw.githubusercontent.com/sid-the-sloth1/yata-scripts/master/abroad_items.user.js
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      yata.alwaysdata.net
// ==/UserScript==

(function() {
	'use strict';
	//a function to format currency
	function formatNumber(num) {
		return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
	}
	function titleCase(str) {
		var splitStr = str.toLowerCase().split(' ');
		for (var i = 0; i < splitStr.length; i++) {
			splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
		}
		return splitStr.join(' ');
	}


	//converting timestamp to make Last update time human readable. Thanks to Pyrit for this function
	function lastUpdate(seconds) {
		let time = Date.now()/1000;
		seconds = Math.floor(time - seconds);
		let result = "";

		if (seconds >= 3600) {
			const hours = Math.floor(seconds / 3600);
			result += `${hours} hour${hours > 1 ? "s": ""}`;
		}

		if (seconds >= 60) {
			const minutes = Math.floor((seconds % 3600) / 60);

			result +=
			`${seconds >= 3600 ? " and ": ""}` +
			`${minutes} minute${minutes > 1 ? "s": ""}`;
		}

		if (seconds >= 3600) {
			return result;
		} else {
			return (
				result +
				`${seconds >= 60 ? " and ": ""}` +
				`${seconds % 60} second${seconds >= 60 ? "s": ""}`
			);
		}
	}
	function getUnique(array) {
		var uniqueArray = [];
		for (var value of array) {
			if (uniqueArray.indexOf(value) === -1) {
				uniqueArray.push(value);
			}
		}
		return uniqueArray;
	}

	// all item types: ['Temporary', 'Plushie', 'Alcohol', 'Primary', 'Melee', 'Other', 'Clothing', 'Secondary', 'Flower', 'Defensive', 'Drug', 'Electronic', 'Enhancer', 'Medical']

	//Not all item types added to avoid cluttering. But you can add them below in the below array as per requirement
	var type_list = ["Drug", "Flower", "Plushie", "Defensive", "Clothing", "Temporary", "Primary", "Enhancer"];
	var country_list = ["Mexico", "Cayman Islands", "Canada", "Hawaii", "United Kingdom", "Argentina", "Switzerland", "Japan", "China", "UAE", "South Africa"];

	//hiding DoctorN Travel hub and box on abroad and Travel Agency page
	var hide_doctorn = true;
	var check_drn = document.querySelectorAll(".doctorn-widgets");
	if (hide_doctorn && check_drn.length > 0) {
		check_drn.forEach(e => {
			e.style.display = "none";
		});
	}

	//function to send data to Yata
	function sendData(args) {
		let msg_box = $(".hardy_abroad_msg")[0];
		GM_xmlhttpRequest({
			method: "POST",
			data: JSON.stringify(args),
			headers: {
				"content-type": "application/json",
			},
			url: "https://yata.alwaysdata.net/bazaar/abroad/import/",
			onload: function(e) {
				let text = JSON.parse(e.responseText);
                //console.log(e);
				if (e.statusText == "OK") {
					msg_box.innerHTML = '<p class="hardy_label">Successfully updated Yata!!</p><button class="hardy_travel_max">Max</button>';
					console.log(text);
				} else {
					msg_box.innerHTML = `<p class="hardy_label">Unable to update Yata. ${text.message}</p><button class="hardy_travel_max">Max</button>`;
                    //console.log(text);
				}
			},
			onerror: (err) => {
				msg_box.innerHTML = `<p class="hardy_label">Unable to update Yata. ${err}</p><button class="hardy_travel_max">Max</button>`;
			}
		});
	}

	//checking if the user is on abroad page. if conditions satisfied then it adds a div to page and sends data to Yata
	if (window.location.href.includes("index.php")) {
		if ($(".captcha").length == 0 && document.getElementsByClassName('msg right-round').length > 1) {
			let node = document.getElementsByClassName('msg right-round')[1].childNodes[1].childNodes[0].data;
			if (country_list.indexOf(node) != -1) {
				let box = document.createElement("div");
				box.className = "hardy_abroad_msg1";
				box.innerHTML = '<div class="delimiter"><div class="hardy_abroad_msg"><button class="hardy_travel_max">Max</button></div></div><br><br>';
				document.getElementsByClassName("info-msg-cont")[1].insertBefore(box, document.getElementsByClassName("info-msg")[1]);
				let msg_box = $(".hardy_abroad_msg")[0];
				msg_box.innerHTML = '<p class="hardy_label">Sending data to Yata.....</p><button class="hardy_travel_max">Max</button>';
				let obj = {};
				obj.country = document.getElementsByClassName('msg right-round')[1].childNodes[1].childNodes[0].data.substring(0, 3).toLowerCase();
				obj.client = "Father's Abroad Items Tracker";
				obj.version = "v1.0";
				obj.author_name = "Father";
				obj.author_id = 2131687;
				let item = [];
				const target = document.querySelectorAll(".users-list")[0].children;
				for (var pi = 0; pi < target.length; pi++) {
					let node = target[pi];
					let span = node.children[0].children;
					let id = span[1].innerHTML.split("/")[3];
					let cost = parseInt(span[4].children[1].innerText.replace(/,/g, "").replace(/\s/g, "").replace(/\$/g, ""));
					let amount = parseInt(span[5].children[1].innerText.replace(/,/g, "").replace(/\s/g, ""));
					let dict = {};
					dict.id = id
					dict.cost = cost;
					dict.quantity = amount;
					item.push(dict);
				}

				obj.items = item;
				//console.log(obj);
				sendData(obj);
			}
		}
	}

	//creating function to add HTML to add on Travel Agency page
	function addHtmlBox() {
		let html1 = '<br><br><div id="hardy_box_header">YATA Abroad Items</div><div class="hardy_travel_items_box"><div align="right"><button id="hardy_refresh">Refresh</button></div><div class="hardy_travel_filters"><div id="show_hide_filter1">Country Filter Options </div><div id="country_checkboxes">';
		let html2 = '</div><br><br><div id="show_hide_filter2">Item Types Filter Options</div><div id="type_checkboxes">';
		let html3 = '</div></div><br><br><div class="hardy_travel_data_table", style="overflow-x:auto"></div><br></div><br><br>';
		let array1 = [];
		let array_ = [];
		for (var k = 0; k < 11; k++) {
			let country = country_list[k];
			array1.push(`<input type="checkbox" class="hardy_checkbox" id="hardy_country_check_${country.toLowerCase().replace(/\s/, "-9")}"><label>${country}</label><br>`);
		}
		for (var x = 0; x < type_list.length; x++) {
			let type = type_list[x];
			array_.push(`<input type="checkbox" class="hardy_checkbox" id="hardy_type_check_${type.toLowerCase().replace(/\s/, "-9")}"><label>${type}</label><br>`);
		}
		$(".content-wrapper").append(html1 + array1.join("") + html2 +array_.join("")+ html3);
	}


	function getData() {
		$(".hardy_travel_data_table")[0].innerHTML = '<p class="hardy_label" align="center">Loading data.....</p>';
		GM_xmlhttpRequest({
			method: 'GET',
			timeout: 20000,
			url: 'https://yata.alwaysdata.net/bazaar/abroad/export/',
			responseType: 'json',
			onload: function(e) {
				try {
					//console.log(e.responseText);
					let stock = JSON.parse(e.responseText)["stocks"];
					if (stock.length > 0) {
						sessionStorage.setItem('hardy_travel_data', e.responseText);
					} else {
						$(".hardy_travel_data_table")[0].innerHTML = '<p class="hardy_label">The requested data is not currently available. Kindly check again after a few minutes. </p>';
						sessionStorage.setItem('hardy_travel_data', 'nope');
					}
				} catch (error) {
					$(".hardy_travel_data_table")[0].innerHTML = `<p class="hardy_label">${error}</p>`;
				}
			},
			onerror: (err) => {
				$(".hardy_travel_data_table")[0].innerHTML = `<p class="hardy_label">${err}</p>`;
			},
			ontimeout: (err) => {
				$(".hardy_travel_data_table")[0].innerHTML = `<p class="hardy_label">Request timed out. Try again by pressing the "Refresh" button.</p>`;
			}
		});

	}

	function createTable() {

		let data = sessionStorage.getItem('hardy_travel_data');
		if (typeof data == "undefined" || data == null) {
			getData();

		} else if (data == 'nope') {
			$(".hardy_travel_data_table")[0].innerHTML = '<p class="hardy_label">The requested data is not currently available. Kindly check again after a few minutes. </p>';
		} else {
			let stock = JSON.parse(data)["stocks"];
			let countries = [];
			let country_boxes = $("#country_checkboxes")[0].children;
			//console.log(country_boxes);
			for (var j = 0; j < country_boxes.length; j++) {
				let node = country_boxes[j];
				if (node.className == "hardy_checkbox" && node.checked) {
					let first = node.id.split("_")[3].replace("-9", " ");
					var upperCase = titleCase(first);
                    if (upperCase == "Uae") {
                        upperCase = "UAE";
                    }
                    countries.push(upperCase);
				}
			}
			//console.log(2);
			let types = [];
			let type_boxes = $("#type_checkboxes")[0].children;
			for (var hj = 0; hj < type_boxes.length; hj++) {
				let nodes = type_boxes[hj];
				if (nodes.className == "hardy_checkbox" && nodes.checked) {
					let first = nodes.id.split("_")[3].replace("-9", " ");
					types.push(titleCase(first));
				}
			}
			let length1 = countries.length;
			let length2 = types.length;
			if (length1 > 0 || length2 > 0) {
				let array2 = [];
				for (var pp = 0; pp < stock.length; pp++) {
					let item = stock[pp];
					if (length1 > 0 && length2 > 0) {
						if (countries.indexOf(item["country_name"]) != -1 && types.indexOf(item["item_type"]) != -1) {
							let image = `<img src="/images/items/${item["item_id"]}/medium.png", alt = "${item["item_name"]}" > `;
							array2.push(`<tr><td>${item["country_name"]}</td><td>${image}</td><td>${item["item_name"]}</td><td>${item["abroad_quantity"]}</td><td>\$${formatNumber(item["abroad_cost"])}</td><td>${item["item_type"]}</td><td>${lastUpdate(item["timestamp"])} ago <p class="hidden_stamps">bitch!${item["timestamp"]}</p></td></tr>`);
						}
					} else {
						if (countries.indexOf(item["country_name"]) != -1 || types.indexOf(item["item_type"]) != -1) {
							let image = `<img src="/images/items/${item["item_id"]}/medium.png", alt = "${item["item_name"]}" > `;
							array2.push(`<tr><td>${item["country_name"]}</td><td>${image}</td><td>${item["item_name"]}</td><td>${item["abroad_quantity"]}</td><td>\$${formatNumber(item["abroad_cost"])}</td><td>${item["item_type"]}</td><td>${lastUpdate(item["timestamp"])} ago <p class="hidden_stamps">bitch!${item["timestamp"]}</p></td></tr>`);
						}
					}
				}
				let table_html1 = '<table id="hardy_table"><tr><th class="hardy_travel_sortable_header" id="hardy_header_destination_0">Destination</th><th>Item</th><th class="hardy_travel_sortable_header" id="hardy_header_item_2">Item Name</th><th class="hardy_travel_sortable_header" id="hardy_header_quantity_3">Item Quantity</th><th class="hardy_travel_sortable_header" id="hardy_header_price_4">Item Price</th><th class="hardy_travel_sortable_header" id="hardy_header_type_5">Item Type</th><th class="hardy_travel_sortable_header" id="hardy_header_stamp_6">Last Updated</th></tr><tbody id="hardy_tbody">';
				if (array2.length > 0) {
					let final_array = getUnique(array2);
					$(".hardy_travel_data_table")[0].innerHTML = `${table_html1}${final_array.join("")}</tbody></table><input type="hidden" id="hardy_destination_order" value="asc"><input type="hidden" id="hardy_item_order" value="asc"><input type="hidden" id="hardy_price_order" value="asc"><input type="hidden" id="hardy_quantity_order" value="asc"><input type="hidden" id="hardy_type_order" value="asc"><input type="hidden" id="hardy_stamp_order" value="asc">`;
				} else {
					$(".hardy_travel_data_table")[0].innerHTML = '<p class="hardy_label"> The requested data is not currently available. Kindly try again later. </p>';
                }
			} else {
                $(".hardy_travel_data_table")[0].innerHTML = "";
            }
		}
	}
	if (window.location.href.includes("travelagency.php")) {
		addHtmlBox();
		document.getElementById("hardy_country_check_mexico").checked = true;
		getData();
        console.log("Creating Mexico table");
		createTable();

	}


	document.addEventListener("click", function(g) {
		if (g.target.className == "hardy_travel_sortable_header") {
			let id = g.target.id;
			let index = id.split("_")[3];
			let uid = `hardy_${id.split("_")[2]}_order`;
			let table = $("#hardy_table");
			let tbody = $("#hardy_tbody");
			if (index == "0" || index == "2" || index == "5") {
				tbody.find('tr').sort(function(a, b) {
					if ($("#"+uid).val() == 'asc') {
						return $('td:eq('+index+')', a).text().localeCompare($('td:eq('+index+')', b).text());
					} else
					{
						return $('td:eq('+index+')', b).text().localeCompare($('td:eq('+index+')', a).text());
					}

				}).appendTo(tbody);
			} else if (index == "6") {
				tbody.find('tr').sort(function(a, b) {
					if ($("#"+uid).val() == 'asc') {
						return parseInt($('td:eq('+index+')', a).text().split("bitch!")[1]) - parseInt($('td:eq('+index+')', b).text().split("bitch!")[1]);
					} else
					{
						return parseInt($('td:eq('+index+')', b).text().split("bitch!")[1]) - parseInt($('td:eq('+index+')', a).text().split("bitch!")[1]);
					}

				}).appendTo(tbody);

			} else {
				tbody.find('tr').sort(function(a, b) {
					if ($("#"+uid).val() == 'asc') {
						return parseInt($('td:eq('+index+')', a).text().replace(/,/g, "").replace(/\$/, "")) - parseInt($('td:eq('+index+')', b).text().replace(/,/g, "").replace(/\$/, ""));
					} else
					{
						return parseInt($('td:eq('+index+')', b).text().replace(/,/g, "").replace(/\$/, "")) - parseInt($('td:eq('+index+')', a).text().replace(/,/g, "").replace(/\$/, ""));
					}

				}).appendTo(tbody);
			}
			let sort_order = $('#'+uid).val();
			if (sort_order == "asc") {
				document.getElementById(uid).value = "desc";
			}
			if (sort_order == "desc") {
				document.getElementById(uid).value = "asc";
			}
		} else if (g.target.className == "hardy_travel_max") {

			let bold = $(".bold");
			let max_cap = parseInt(bold[5].innerText);
			let used_cap = parseInt(bold[4].innerText);
			let left = max_cap - used_cap;
			let target = document.querySelectorAll(".users-list")[0].children;
			for (var t = 0; t < target.length; t++) {
				let node = target[t];
				let span = node.children[0].children;
				let amount = parseInt(span[5].children[1].innerText.replace(/,/g, "").replace(/\s/g, ""));
				let input_box = span[8].children[0].children[1];
				let box2 = node.children[2].children[0].children[0].children[1];
				if (amount >= left) {
					input_box.value = left;
					box2.value = left;
				} else {
					input_box.value = amount;
					box2.value = amount;
				}
			}
		} else if (g.target.id == "show_hide_filter1") {
			let node = document.getElementById("country_checkboxes");
			let button = document.getElementById("show_hide_filter1");
			if (node.style.display == "none") {
				node.style.display = "block";
			} else {
				node.style.display = "none";
			}
		} else if (g.target.id == "show_hide_filter2") {
			let node = document.getElementById("type_checkboxes");
			let button = document.getElementById("show_hide_filter2");
			if (node.style.display == "none") {
				node.style.display = "block";
			} else {
				node.style.display = "none";
			}
		} else if (g.target.className == "hardy_checkbox") {
			createTable();
		} else if (g.target.id == "hardy_refresh") {
			getData();
			createTable();
            console.log("refresh");
		} else if (g.target.id == "hardy_box_header") {
            let box = $(".hardy_travel_items_box")[0];
            if (box.style.display == "none") {
                box.style.display = "block";
            } else {
                box.style.display = "none";
            }
        }

	});

	//adding CSS to page
	GM_addStyle(`
		.hardy_travel_items_box, .hardy_abroad_msg, #country_checkboxes, #type_checkboxes { border-radius: 8px; background-color: rgb(242, 242, 242); box-shadow: 0px 4px 9px 3px rgba(119, 119, 119, 0.64); -moz-box-shadow: 0px 4px 9px 3px rgba(119, 119, 119, 0.64); -webkit-box-shadow: 0px 4px 9px 3px rgba(119, 119, 119, 0.64); padding. 10px;}
		.hardy_label { padding: 10px; padding-top: 10px; padding-right: 30px; padding-bottom: 10px; padding-left: 30px; font-size: 18px }
		.hardy_travel_filters { padding: 10px; margin: auto; width: 85%;}
		.hardy_travel_data_table {padding: 10px; margin: auto; width: 85%; }
		.hardy_travel_data_table table { color: #333; font-family: Helvetica, Arial, sans-serif; width: 640px; border: 2px #808080 solid; }
		.hardy_travel_filters input{ margin-right: 10px; margin-bottom: 4px; margin-left: 10px; margin-top: 3px;}
		.hardy_travel_filters label{ margin: 0px 3px 0px 3px; }
		.hardy_travel_data_table td, th { border: 1px solid rgba(0, 0, 0, .55); height: 30px; transition: all 0.3s; }
		.hardy_travel_data_table th { background: #868282; font-weight: bold; text-align: center; }
		.hardy_travel_data_table td { background: #c6c4c4; text-align: center; }
		.hardy_travel_data_table tr:nth-child(even) td { background: #F1F1F1; }
		.hardy_travel_data_table tr:nth-child(odd) td { background: #c6c4c4; }
		.hardy_travel_data_table tr td:hover { background: #666; color: #FFF; }
		.hardy_abroad_msg1 {background-color: #cfcfcf; }
		.hidden_stamps { display : none; }
		#hardy_refresh { margin: 25px;}
		.hardy_travel_max { margin-left: 30px; margin-top: 10px; margin-bottom: 10px;}
		#show_hide_filter1, #hardy_box_header, #show_hide_filter2 { background-color: #0d0d0d; border: 2px solid #000; border-radius: 0.5em 0.5em 0 0; text-indent: 0.5em; font-size: 18px; color: #ffff; }
		`);
})();
