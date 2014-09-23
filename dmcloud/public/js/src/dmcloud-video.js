/* Javascript for DmCloud video. */
function DmCloudVideo(runtime, element) {
    //console.log($('.xblock-save-button', element));
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');

    var myPlayer;
    var video_id = $(element).find('video').attr('id');
    var hdurl = $(element).find('video').attr('HD');
    var sdurl = $(element).find('video').attr('SD');
    var select_id = $(element).find('select').attr('id');
    var subtitle_id = $(element).find('.dm-subtitle').attr('id');
    var videoplayer_id = $(element).find('.videoplayer').attr('id');
    var newtop =0;
    var videoHD=false;
    /**
    HD
    **/
    videojs.HDPlugin = videojs.Button.extend({
        /* @constructor */
        init: function(player, options){
            videojs.Button.call(this, player, options);
            this.on('click', this.onClick);
        }
    });
    videojs.HDPlugin.prototype.onClick = function() {
        console.log("debut click "+videoHD);
        if(videoHD==true){
            $("#"+video_id).find(".vjs-HD-button").removeClass("hdon");
            $("#"+video_id).find(".vjs-HD-button").addClass("hdoff");
            videojs(video_id).src([{type: "video/mp4", src: sdurl }]);
            videojs(video_id).play();
            videoHD = false;
        } else {
            $("#"+video_id).find(".vjs-HD-button").removeClass("hdoff");
            $("#"+video_id).find(".vjs-HD-button").addClass("hdon");
            videojs(video_id).src([{type: "video/mp4", src: hdurl }]);
            videojs(video_id).play();
            videoHD = true;
        }
        console.log("fin click "+videoHD);
    };
    videojs.plugin('HDPlugin', function( options ) {
        var HDPlugin = new videojs.HDPlugin( this, {
            el : videojs.Component.prototype.createEl( null, {
                className: 'vjs-HD-button vjs-control',
                   innerHTML: '<div class="vjs-control-content">' + ('HD') + '</div>',
                   role: 'button',
                   'aria-live': 'polite', 
                   tabIndex: 0
                
            })
        });
        // Add the button to the control bar object and the DOM
        this.controlBar.HDPlugin = this.controlBar.addChild( HDPlugin );
    });
    /**
    fin HD
    **/


    var showCues = function(cues) {
        if(!$("."+subtitle_id).is(':visible')) {
            $("."+subtitle_id).show();
            $("#"+subtitle_id).show();
            $("#"+videoplayer_id).attr('style','width:55%;float:left');
        }
        //console.log("showCues "+subtitle_id);
        document.getElementById(subtitle_id).innerHTML = ""; //Open/Close <span class=\"togglesub\">&nbsp;</span><br/>

        for (var j = 0; j < cues.length; ++j) {
            var cue = cues[j];
            //console.log("cue "+j+" - "+cue.text);
            // do something
            //document.getElementById(subtitle_id).innerHTML += ("<span class=\"cue\" id=\""+subtitle_id+"_cue_"+cue.id+"\" begin=\""+cue.startTime+"\" end=\""+cue.endTime+"\" \">&nbsp;-&nbsp;"+showTime(parseInt(cue.startTime))+" "+cue.text + "</span><br/>");
            document.getElementById(subtitle_id).innerHTML += ("<span class=\"cue\" id=\""+subtitle_id+"_cue_"+cue.id+"\" begin=\""+cue.startTime+"\">&nbsp;-&nbsp;"+cue.text+"</span><br/>");
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
                        $("."+subtitle_id).hide();
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
                if(hdurl) myPlayer.HDPlugin({});

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


