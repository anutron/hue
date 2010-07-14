// Licensed to Cloudera, Inc. under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  Cloudera, Inc. licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/*
---
description: Automatically fits text to fit an element adding an elipse to the text using the FitText plugin for any elements with the FitText data-filter.
provides: [Behavior.FitText]
requires: [Widgets/Behavior, FitText/FitText]
script: Behavior.FitText.js

...
*/

(function(){
	//implements the FitText filter on an element; attaches to the jframe for events on resize
	var fitIt = function(filter, element, events){
		if (element.get('tag') == 'td' || element.getParent('table')) {
			fixTable(element.getParent('table'));
			if (element.get('tag') == 'td') element.setStyles(tdStyles);
			else element.getParent('td').setStyles(tdStyles);
		}
		
		if (element.getChildren().length > 0) {
			dbug.warn('attempting to truncate an element (%o) that has child elements; this is not permitted.', element);
			return;
		}
		var text = element.get('text');
		var span = new Element('span', {
			text: text,
			styles: {
				'white-space': 'nowrap'
			}
		}).inject(element.empty());

		//because FitText requires element measurement, don't create an instance
		//until after the element is visible.
		var fitter = function(){
			if (!element.isVisible()) {
				//not ready; call again when the thread is released
				fitter.delay(1);
			} else {
				var options = {};
				var offset = element.get('data', 'fit-text-offset', true);
				if (offset != null) options.offset = offset;
				var fitText = new FitText(element, span, options);
				fitText.fit();
				element.store('FitText', fitText).set('title', text);
				var fitTextFit = fitText.fit.bind(fitText);
				//rerun this after a while, as some filters muck about w/ the DOM
				//I'm not crazy about this solution, but it'll have to do for now
				fitTextFit.delay(10); 
				events.addEvent('show', fitTextFit);
				filter.markForCleanup(element, function(){
					events.removeEvent('show', fitTextFit);
				});
			}
		};
		fitter();
	};

	var tdStyles = {
		'max-width': 200, //this number doesn't seem to matter, really
		'overflow': 'hidden'
	};

	var fixTable = function(table) {
		if (!table || table.retrieve('fittext:fixed')) return;
		table.store('fittext:fixed', true);
		table.getElements('tbody td').setStyles(tdStyles);
	};
	

	Behavior.addGlobalFilters({

		/*
			truncates text automatically for elements with the class .ccs-truncate
			elements cannot have child elements (only text)
		*/

		FitText: function(element, events) {
			fitIt(this, element, events);
		},

		/*
			finds all elements wth data-fit-text properties - these properties must be selectors
			for the elements to apply the FitText class to.
		*/
		'FitText-Children': function(element, events){
			var selector = element.get('data', 'fit-text');
			element.getElements(selector).each(function(el){
				fitIt(this, el, events);
			}, this);
		}

	});


})();