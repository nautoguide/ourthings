
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if( request.message === "clicked_browser_action" ) {
			document.dispatchEvent(new CustomEvent('ourthings_site', {
				detail: {"function":"ping"}
			}));
		}
	}
);

document.addEventListener('ourthings_extension', function(e) {
	switch(e.detail.function) {
		case 'pong':
			console.log("Ourthing detected and online");
			document.dispatchEvent(new CustomEvent('ourthings_site', {
				detail: {"function":"menu"}
			}));
			break;
	}
});