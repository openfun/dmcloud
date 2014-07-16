/* Javascript for DmCloud video. */
function DmCloudVideo(runtime, element) {
    //console.log($('.xblock-save-button', element));
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');
    
    var myPlayer;
    var video_id = $(element).find('video').attr('id');
    var select_id = $(element).find('select').attr('id');
    var subtitle_id = $(element).find('.subtitle').attr('id');
    var videoplayer_id = $(element).find('.videoplayer').attr('id');
    
    var showCues = function(cues) {
        $("#"+videoplayer_id).attr('style','width:50%;float:left');
        $("#"+subtitle_id).attr('style','width:49%;display:block');
        //$("#"+subtitle_id).show();
        //$("#subtitle").attr('style', 'width:49%; float:right');
        document.getElementById(subtitle_id).innerHTML = "<span class=\"togglesub\">&nbsp;</span><br/>"; //Open/Close
        
        for (var j = 0; j < cues.length; ++j) {
            var cue = cues[j];
            // do something
            document.getElementById(subtitle_id).innerHTML += ("<span class=\"cue\" id=\""+subtitle_id+"_cue_"+cue.id+"\" begin=\""+cue.startTime+"\" end=\""+cue.endTime+"\" \">&nbsp;-&nbsp;"+showTime(parseInt(cue.startTime))+" "+cue.text + "</span><br/>");
        }
        //onclick=\"myPlayer.currentTime("+cue.startTime+")
        $("#"+subtitle_id+" span.cue").click(function() {
            console.log("cue");
            myPlayer.currentTime($(this).attr('begin'));
        });
        
        $("#"+subtitle_id+" span.togglesub").click(function() {
            if($("#"+subtitle_id+" span.cue").is(':visible')) {
              $("#"+subtitle_id+" span.cue").hide();
              $("#"+videoplayer_id).attr('style','width:100%;float:left');
              $("#"+subtitle_id).attr('style','width:30px;display:block;height:20px;overflow:hidden;position:absolute');
            } else {
              $("#"+subtitle_id+" span.cue").show();
              $("#"+videoplayer_id).attr('style','width:50%;float:left');
              $("#"+subtitle_id).attr('style','width:49%;display:block');
            }
        });
    }
    
    var save_user_state = function() {
        var data = {
            'saved_video_position': parseInt(myPlayer.currentTime()),
        };
        $.post(saveHandlerUrl, JSON.stringify(data)).complete(function() {
            //window.location.reload(false);
            //console.log("ok");
        });
    }
    var trackload = new Array(); // array contening tacks id and cues
    $(function ($) {
        /* Here's where you'd do things on page load. */
        
        if(video_id) {
            videojs(video_id, {}, function(){
                // Player (this) is initialized and ready.
                myPlayer=this;
                
                //console.log($("#"+myPlayer.id()).children(':first').is("object"));
                if($("#"+myPlayer.id()).children(':first').is("object")) {
                    $("#"+select_id).hide();
                    $('label[for="'+select_id+'"]').hide();
                }
                
                //save_user_state
                myPlayer.on('seeked', function(){ save_user_state(saveHandlerUrl);});
                myPlayer.on('ended', function(){ save_user_state(saveHandlerUrl);});
                myPlayer.on('pause', function(){ save_user_state(saveHandlerUrl);});
                //Load tracks
                var tracks = myPlayer.textTracks();
                for (var i = 0; i < tracks.length; i++) {
                    var track = tracks[i]; // or whichever track you need
                    track.on('loaded', function(){
                        trackload[this.id()]=this.cues();
                        showCues(this.cues());
                    });
                }
                myPlayer.on('subtitlestrackchange', function(){
                    //ChangeClassVideoJS
                    var kids = myPlayer.getChild('textTrackDisplay').children();
                    if(kids && kids.length > 0) {
                        if(trackload[kids[0].id()]) showCues(trackload[kids[0].id()]);
                    } else {
                        $("#"+videoplayer_id).attr('style','width:100%');
                        $("#"+subtitle_id).hide();
                    }
                    //track.on('activate', function(){ console.log("activate"); console.log($(this)); });
                });
                myPlayer.on('cuechange', function(){
                    //console.log("cuechange");
                    $("#"+subtitle_id+" span").removeClass("current");
                    var tabActiveCues = myPlayer.getChild('textTrackDisplay').children()[0].activeCues();
                    var lastcueid=0;
                    for (cue in tabActiveCues) {
                        $("#"+subtitle_id+"_cue_"+tabActiveCues[cue].id).addClass("current");
                        lastcueid = tabActiveCues[cue].id;
                    }
                    if(lastcueid > 0 && $("#"+subtitle_id+"_cue_"+lastcueid).length) {
                        $("#"+subtitle_id).animate({
                            scrollTop:  $("#"+subtitle_id).scrollTop() - $("#"+subtitle_id).offset().top + $("#"+subtitle_id+"_cue_"+lastcueid).offset().top 
                        }, 500);
                    }
                });
            });
        }//end if video_id
    });
    
    /**
    Speed video rate
    **/
    $("#"+select_id).change(function() {
        //console.log($( this ).val());
        myPlayer.playbackRate($( this ).val());
    });
    
}

function showTime(totalSec) {
    var hours = parseInt( totalSec / 3600 ) % 24;
    var minutes = parseInt( totalSec / 60 ) % 60;
    var seconds = totalSec % 60;
    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
    return result;
}
