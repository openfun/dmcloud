function DmCloudVideo(runtime, element) {
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');
    
    var myPlayer;
    var video_id = $(element).find('video').attr('id');
    var global_id = video_id.replace(/video_/, '');
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
    if(video_id) {
        videojs.HDPlugin = videojs.Button.extend({
            /* @constructor */
            init: function(player, options){
                this.player = player;
                player.videoHD = options.videoHD;
                videojs.Button.call(this, player, options);
                this.on('click', this.onClick);
            }
        });

        videojs.HDPlugin.prototype.onClick = function() {
            
            var player = this.player,
                current_time = player.currentTime(),
                is_paused = player.paused();

            if(player.videoHD==true){

                $("#"+player.id()).find(".vjs-HD-button").removeClass("hdon");
                $("#"+player.id()).find(".vjs-HD-button").addClass("hdoff");

                player.src( [{type: "video/mp4", src: player.sdurl }] ).one( 'loadedmetadata', function() {
                    player.currentTime( current_time );
                    if ( !is_paused ) { player.play(); }
                });
                player.videoHD = false;
            } else {
                $("#"+player.id()).find(".vjs-HD-button").removeClass("hdoff");
                $("#"+player.id()).find(".vjs-HD-button").addClass("hdon");

                player.src( [{type: "video/mp4", src: player.hdurl }] ).one( 'loadedmetadata', function() {
                    player.currentTime( current_time );
                    if ( !is_paused ) { player.play(); }
                });
                player.videoHD = true;
            }
        };

        videojs.plugin('HDPlugin', function( options ) {
            var player = this;
            player.chgsrc = function(src) {
                player.src([{type: "video/mp4", src: src }]);
                player.play();
            };
            var HDPlugin = new videojs.HDPlugin( this, {
                el : videojs.Component.prototype.createEl( null, {
                    className: 'vjs-HD-button vjs-control',
                       innerHTML: '<div class="vjs-control-content">' + ('HD') + '</div>',
                       role: 'button',
                       'aria-live': 'polite', 
                       tabIndex: 0
                    
                }),
                videoHD : false
            });
            // Add the button to the control bar object and the DOM
            this.controlBar.HDPlugin = this.controlBar.addChild( HDPlugin );
        });
    }
    /**
    fin HD
    **/


    var showCues = function(cues) {
        if(!$("."+subtitle_id).is(':visible')) {
            $("."+subtitle_id).show();
            $("#"+subtitle_id).show();
            //$("#"+videoplayer_id).attr('style','width:55%;float:left');
            $("#"+videoplayer_id).attr('style','width:61%;float:left');
            $("#"+videoplayer_id).find('.vjs-control[role="button"]').css('width','3em');            
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

    var is_saving_user_state = false;
    var save_user_state = function() {
        var data = {
            'saved_video_position': parseInt(myPlayer.currentTime()),
        };
        if(is_saving_user_state===false) {
            is_saving_user_state=true;
            $.post(saveHandlerUrl, JSON.stringify(data)).complete(function() {
               setTimeout(function (){
                is_saving_user_state=false;
               }, 1000);
           });
        }
        
    }
    
    var trackload = new Array(); // array contening tracks id and cues (queues ?)

    /* Here's where you'd do things on page load. */
    //$(function ($) {
        if(video_id) {
            if(!myPlayer) {
                delete videojs.players[video_id];
            }
            videojs(video_id, {}, function(){
                log('video_player_ready', {}, video_id.replace(/video_/, ''));
                myPlayer=this;
                myPlayer.on('seeked', function(){
                    save_user_state(saveHandlerUrl);
                    log('seek_video', { 'new_time': parseInt(myPlayer.currentTime())});
                });
                myPlayer.on('ended', function(){
                    save_user_state(saveHandlerUrl);
                    log('stop_video', { 'currentTime': parseInt(myPlayer.currentTime())} );
                });
                myPlayer.on('pause', function(){ 
                    save_user_state(saveHandlerUrl);
                    log('pause_video', { 'currentTime': parseInt(myPlayer.currentTime()) }); 
                });
                myPlayer.on('play', function(){ log( 'play_video', { 'currentTime': parseInt(myPlayer.currentTime()) }); });
                myPlayer.on('loadstart', function(){ log('load_video', {},); });

                myPlayer.sdurl = sdurl;
                myPlayer.hdurl = hdurl;

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
    //});// end function

    /**
    Show or hide subtitle panel on right
    **/
    $("."+subtitle_id).click(function() {
        if($("#"+subtitle_id).is(':visible')) {
            $("#"+subtitle_id).hide();
            $("#"+videoplayer_id).attr('style','width:100%;float:left');
            $("#"+videoplayer_id).find('.vjs-control[role="button"]').css('width','4em');  
            log(
                'video_hide_subtitle',
                { 
                    'currentTime': parseInt(myPlayer.currentTime()),
                },
                video_id.replace(/video_/, '')
            );
        }else{
            $("#"+subtitle_id).show();
            $("#"+videoplayer_id).attr('style','width:61%;float:left');
            $("#"+videoplayer_id).find('.vjs-control[role="button"]').css('width','3em');  
            log(
                'video_show_subtitle',
                { 
                    'currentTime': parseInt(myPlayer.currentTime()),
                },
                video_id.replace(/video_/, '')
            );

        }
    });
    /**
    event to track into tracking file play back rate 
    **/
    $(element).find('.vjs-playback-rate').click(function() {
        log(
            'speed_change_video',
            { 
                'currentTime': parseInt(myPlayer.currentTime()),
                'newSpeed' : myPlayer.playbackRate()
            },
            video_id.replace(/video_/, '')
        );
    });
    /**
    send log event to save it into tracking file 
    **/
    function log(eventName, data) {
        var logInfo;
    
        // Default parameters that always get logged.
        logInfo = {
            id: global_id
        };
    
        // If extra parameters were passed to the log.
        if (data) {
            $.each(data, function (paramName, value) {
                logInfo[paramName] = value;
            });
        }
    
        Logger.log(eventName, logInfo);
    }
}

function showTime(totalSec) {
    var hours = parseInt( totalSec / 3600 ) % 24;
    var minutes = parseInt( totalSec / 60 ) % 60;
    var seconds = totalSec % 60;
    var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
    return result;
}


