/* Javascript for DmCloud video. */
function DmCloudVideo(runtime, element) {
    //console.log($('.xblock-save-button', element));
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');

    var myPlayer;
    var video_id = $(element).find('video').attr('id');
    var select_id = $(element).find('select').attr('id');
    var subtitle_id = $(element).find('.subtitle').attr('id');
    var videoplayer_id = $(element).find('.videoplayer').attr('id');
    var newtop =0;

    var showCues = function(cues) {
        if(!$("."+subtitle_id).is(':visible')) {
            $("."+subtitle_id).show();
            $("#"+subtitle_id).show();
            $("#"+videoplayer_id).attr('style','width:55%;float:left');
        }

        document.getElementById(subtitle_id).innerHTML = ""; //Open/Close <span class=\"togglesub\">&nbsp;</span><br/>

        for (var j = 0; j < cues.length; ++j) {
            var cue = cues[j];
            // do something
            //document.getElementById(subtitle_id).innerHTML += ("<span class=\"cue\" id=\""+subtitle_id+"_cue_"+cue.id+"\" begin=\""+cue.startTime+"\" end=\""+cue.endTime+"\" \">&nbsp;-&nbsp;"+showTime(parseInt(cue.startTime))+" "+cue.text + "</span><br/>");
            document.getElementById(subtitle_id).innerHTML += ("<span class=\"cue\" id=\""+subtitle_id+"_cue_"+cue.id+"\" begin=\""+cue.startTime+"\" end=\""+cue.endTime+"\" \">&nbsp;-&nbsp;"+cue.text + "</span><br/>");
        }

        $("#"+subtitle_id+" span.cue").click(function() {
            myPlayer.currentTime($(this).attr('begin'));
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
    var trackload = new Array(); // array contening tracks id and cues (queues ?)

        /* Here's where you'd do things on page load. */

        if(video_id) {
            videojs(video_id, {}, function(){
                // Player (this) is initialized and ready.
                myPlayer=this;

                //console.log($("#"+myPlayer.id()).children(':first').is("object"));
                /*
                if($("#"+myPlayer.id()).children(':first').is("object")) {
                    $("#"+select_id).hide();
                    $('label[for="'+select_id+'"]').hide();
                }
                */
                //save_user_state
                myPlayer.on('seeked', function(){ save_user_state(saveHandlerUrl);});
                myPlayer.on('ended', function(){ save_user_state(saveHandlerUrl);});
                myPlayer.on('pause', function(){ save_user_state(saveHandlerUrl);});

                myPlayer.on('firstplay', function(){
                    if(!$("#"+myPlayer.id()).children(':first').is("object")) $('span.'+select_id).show();
                });
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
                    if($("#"+subtitle_id+" span.cue").is(':visible') && lastcueid > 0 && $("#"+subtitle_id+"_cue_"+lastcueid).length) {
                        newtop = $("#"+subtitle_id).scrollTop() - $("#"+subtitle_id).offset().top + $("#"+subtitle_id+"_cue_"+lastcueid).offset().top;
                        $("#"+subtitle_id).animate({
                            scrollTop:  newtop
                        }, 500);
                    }
                });
            });
        }//end if video_id

    /**
    Speed video rate
    **/
    $("#"+select_id).change(function() {
        //console.log($( this ).val());
        myPlayer.playbackRate($( this ).val());
    });

    /**
    Show or hide subtitle panel on right
    **/
    $("."+subtitle_id).click(function() {
        if($("#"+subtitle_id).is(':visible')) {
            $("#"+subtitle_id).hide();
            $("#"+videoplayer_id).attr('style','width:100%;float:left');
        }else{
            $("#"+subtitle_id).show();
            $("#"+videoplayer_id).attr('style','width:55%;float:left');
        }
    });

}

function showTime(totalSec) {
    var hours = parseInt( totalSec / 3600 ) % 24;
    var minutes = parseInt( totalSec / 60 ) % 60;
    var seconds = totalSec % 60;
    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
    return result;
}
