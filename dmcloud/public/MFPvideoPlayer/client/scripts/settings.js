// @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later
// Internationalization
var i18n = {
	'en': {
		playControl: {
			play: 'Play',
			pause: 'Pause'
		},
		videoProgressBar: 'Video Progress Bar',
		timeData: {
			current: 'Current Time',
			duration: 'Duration Time',
			remaining: 'Remaining Time'
		},
		captionsPanel: 'Captions Settings',
		captionsControl: {
			show: 'Show Captions',
			hide: 'Hide Captions'
		},
		configControl: {
			show: 'Show Captions Settings Panel',
			hide: 'Hide Captions Settings Panel'
		},
		transcriptPanel: 'Transcripts',
		transcriptControl :{
			show: 'Select a transcript',
			hide: 'Hide the transcript pannel'
		},
		audiodescriptionControl: {
			off: 'Audiodescription Off',
			on: 'Audiodescription On'
		},
		muteControl: {
			mute: 'Mute',
			unmute: 'Unmute'
		},
		volumeLevel: 'Volume Level',
		fullscreenControl: {
			fullscreen: 'Fullscreen',
			nonfullscreen: 'Non-Fullscreen'
		}
	},
	'fr': {
		playControl: {
			play: 'Lancer la lecture',
			pause: 'Mettre en pause la lecture'
		},
		videoProgressBar: 'Barre de progression de la vidéo',
		timeData: {
			current: 'Temps écoulé',
			duration: 'Durée',
			remaining: 'Temps restant'
		},
		captionsPanel: 'Paramètres des sous-titres',
		captionsControl: {
			show: 'Afficher les sous-titres',
			hide: 'Masquer les sous-titres'
		},
		configControl: {
			show: 'Afficher le panneau des paramètres de sous-titres',
			hide: 'Masquer le panneau des paramètres de sous-titres'
		},
		transcriptPanel : 'Transcriptions',
		transcriptControl :{
			show: 'Sélectionner une transcription',
			hide: 'Masquer le panneau de transcription'
		},
		audiodescriptionControl: {
			off: "Désactiver l'audiodescription",
			on: "Activer l'audiodescription"
		},
		muteControl: {
			mute: 'Désactiver le son',
			unmute: 'Activer le son'
		},
		volumeLevel: 'Volume sonore',
		fullscreenControl: {
			fullscreen: 'Activer le mode plein écran',
			nonfullscreen: 'Désactiver le mode plein écran'
		}
	}
};
/*
Controls images
complete with your server paths
*/
var uiControls = {
	playControl: {
		play: 'client/images/play.png',
		pause: 'client/images/pause.png'
	},
	captionsControl: 'client/images/captions.png',
	configControl: 'client/images/config.png',
	audiodescriptionControl: 'client/images/audiodescription.png',
	transcriptControl: 'client/images/transcript.png',
	muteControl: {
		mute: 'client/images/mute.png',
		unmute: 'client/images/unmute.png'
	},
	fullscreenControl: {
		fullscreen: 'client/images/fullscreen.png',
		nonfullscreen: 'client/images/nonfullscreen.png'
	},
	closeControl: 'client/images/close.png'
};
/* Set Captions configuration*/
// Default font-size
// 10 = 1 em
var defaultFontsize=20;
// Default opacity
// 10 = 0.1
var defaultOpacity=50;
// Default color and shadow color
var colors = [
	{ hexa: 'ffff00', name: 'Jaune'}, 
	{ hexa: '008000', name: 'Vert' }, 
	{ hexa: '0000ff', name: 'Bleu' }, 
	{ hexa: 'ff0000', name: 'Rouge' }, 
	{ hexa: '00ffff', name: 'Cyan' }, 
	{ hexa: 'ff00ff', name: 'Magenta' }, 
	{ hexa: '000000', name: 'Noir', defaultshadow: true }, 
	{ hexa: 'ffffff', name: 'Blanc', defaultcolor: true }
];


 // @license-end