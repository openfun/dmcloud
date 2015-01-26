// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later

var opac_val = 0.5;
var fontsize;
var opac;
function change_vid_track(tselect){
	var subtitlespanel = tselect.parentNode;
	// select option :
	var optiontranscription = null;
	if (tselect.options[tselect.selectedIndex].hasAttribute('data-transcription')) {
		optiontranscription = tselect.options[tselect.selectedIndex];
	}
	
	var transcription = subtitlespanel.nextSibling;
	if (transcription && transcription.tagName.toLowerCase() == 'p') {
		if (optiontranscription == null) {
			transcription.parentNode.removeChild(transcription);
		}
		else {
			transcription.firstChild.setAttribute('href', optiontranscription.getAttribute('data-transcription'));
			transcription.firstChild.setAttribute('title', 'Télécharger le transcript ' + optiontranscription.firstChild.nodeValue + ' (nouvelle fenêtre)');
			var span = transcription.getElementsByTagName('span')[0];
			span.replaceChild(document.createTextNode(optiontranscription.firstChild.nodeValue), span.firstChild);	
		}
	}
	else if (optiontranscription != null) {
		var transcription = document.createElement('p');
		var transcriptionlink = document.createElement('a');
		transcriptionlink.setAttribute('href', optiontranscription.getAttribute('data-transcription'));
		transcriptionlink.setAttribute('target', '_blank');
		transcriptionlink.appendChild(document.createTextNode('Télécharger le transcript '));
		var transcriptionlinkspan = document.createElement('span');
		transcriptionlinkspan.appendChild(document.createTextNode(optiontranscription.firstChild.nodeValue));
		transcriptionlink.setAttribute('title', 'Télécharger le transcript ' + optiontranscription.firstChild.nodeValue + ' (nouvelle fenêtre)');
		transcriptionlink.appendChild(transcriptionlinkspan);
		transcription.appendChild(transcriptionlink);
		subtitlespanel.parentNode.appendChild(transcription);
	}
	var video = subtitlespanel.parentNode.parentNode.parentNode.parentNode.previousSibling;
	while (video && video.nodeType != 1) {
		video = video.previousSibling;
		if (video && video.nodeType == 1 && video.tagName.toLowerCase() == 'audio') {
			video = video.previousSibling;
		}
	}
	var myPlayer = videojs(video.getAttribute('id'));
	if(tselect.value=='-1'){
		var tracks = myPlayer.textTracks(),
			  i=0, j=tracks.length, track,
			  off = true;

		  for (;i<j;i++) {
			track = tracks[i];
			track.disable();
		  }
	}
	else{
		var tracks = myPlayer.textTracks(),
			  i=0, j=tracks.length, track,
			  off = true;
		for (;i<j;i++) {
			track = tracks[i];
			if (i!=parseInt(tselect.value)) {
			  track.disable();
			}
			else{
				track.show();
			}
		  }
	}
	var captioncontrol = video.parentNode.querySelector('.mfp-captions');
	if (tselect.selectedIndex == '0') {
		captioncontrol.removeAttribute('data-subtitleslastindex');
	}
	else {
		captioncontrol.setAttribute('data-subtitleslastindex', tselect.selectedIndex);
	}
}
function set_opac_color(){
	var captions = document.querySelector('.video-js .vjs-captions .vjs-tt-cue');
	if (captions) {
		var hexa = captions.parentNode.parentNode.getAttribute('data-shadowhexa');
		changecss('.video-js .vjs-captions .vjs-tt-cue','background-color','rgba('+hexToR(hexa)+','+hexToG(hexa)+','+hexToB(hexa)+','+opac_val+')');
	}
	
	
}
function changecss(theClass,element,value) {
		 var cssRules;
		 for (var S = 0; S < document.styleSheets.length; S++){
			  try{
			  	document.styleSheets[S].insertRule(theClass+' { '+element+': '+value+'; }',document.styleSheets[S][cssRules].length);
			  } catch(err){
			  		try{document.styleSheets[S].addRule(theClass,element+': '+value+';');
					}catch(err){
					 	try{
						    if (document.styleSheets[S]['rules']) {
							  cssRules = 'rules';
							 } else if (document.styleSheets[S]['cssRules']) {
							  cssRules = 'cssRules';
							 } else {
							  //no rules found... browser unknown
							 }
							  for (var R = 0; R < document.styleSheets[S][cssRules].length; R++) {
							   if (document.styleSheets[S][cssRules][R].selectorText == theClass) {
							    if(document.styleSheets[S][cssRules][R].style[element]){
							    document.styleSheets[S][cssRules][R].style[element] = value;
								break;
							    }
							   }
							  }
						  } catch (err){}
					}
			  }
		}
}
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}

 // @license-end