/* Javascript for DmCloud. */
var myPlayer;
function DmCloudVideo(runtime, element) {
    //console.log($('.xblock-save-button', element));
    
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');
    //alert('ok1');
    var video_id = $(element).find('video').attr('id');
    var select_id = $(element).find('select').attr('id');
    
    
    var trackload = new Array();
    
    videojs(video_id, {}, function(){
        // Player (this) is initialized and ready.
        myPlayer=this;
        
        var tracks = myPlayer.textTracks();
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i]; // or whichever track you need
            track.on('loaded', function(){
                trackload[this.id()]=this.cues();
                showCues(this.cues());
            });
            //track.on('activate', function(){ console.log("activate"); console.log($(this)); });
        }
        
        myPlayer.on('subtitlestrackchange', function(){
            //ChangeClassVideoJS
            var kids = myPlayer.getChild('textTrackDisplay').children();
            if(kids && kids.length > 0) {
                if(trackload[kids[0].id()]) showCues(trackload[kids[0].id()]);
            } else {
                $(".videoplayer").attr('style','width:100%');
                $("#subtitle").hide();
            }
        });
        myPlayer.on('cuechange', function(){
            //console.log("cuechange");
            $("#subtitle span").removeClass("current");
            var tabActiveCues = myPlayer.getChild('textTrackDisplay').children()[0].activeCues();
            var lastcueid=0;
            for (cue in tabActiveCues) {
                $("#cue_"+tabActiveCues[cue].id).addClass("current");
                lastcueid = tabActiveCues[cue].id;
            }
            if(lastcueid > 0 && $("#cue_"+lastcueid).length) {
                $('#subtitle').animate({
                    scrollTop:  $('#subtitle').scrollTop() - $('#subtitle').offset().top + $("#cue_"+lastcueid).offset().top 
                }, 500);
            }
            //console.log(myPlayer.getChild('textTrackDisplay').children()[0].activeCues());
        });
    });
    
    $(function ($) {
        
    });
    
    /**
    Speed video rate
    **/
    $("#"+select_id).change(function() {
        //console.log($( this ).val());
        myPlayer.playbackRate($( this ).val());
    });
    
}

function showCues(cues) {
    //console.log("SHOW CUE");
    $(".videoplayer").attr('style','width:50%;float:left');
    $("#subtitle").show();
    //$("#subtitle").attr('style', 'width:49%; float:right');
    document.getElementById("subtitle").innerHTML = "<br/>";
    for (var j = 0; j < cues.length; ++j) {
        var cue = cues[j];
        // do something
        document.getElementById("subtitle").innerHTML += ("<span id=\"cue_"+cue.id+"\" begin=\""+cue.startTime+"\" end=\""+cue.endTime+"\" onclick=\"myPlayer.currentTime("+cue.startTime+")\">&nbsp;-&nbsp;"+showTime(parseInt(cue.startTime))+" "+cue.text + "</span><br/>");
    }
}

function showTime(totalSec) {
    var hours = parseInt( totalSec / 3600 ) % 24;
    var minutes = parseInt( totalSec / 60 ) % 60;
    var seconds = totalSec % 60;
    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
    return result;
}
