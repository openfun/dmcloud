function DmCloudVideo(runtime, element) {
    "use strict"

    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');
    var videoPlayer;
    var $videoElement = $(element).find('video');
    var video_id = $videoElement.attr('id');
    if (video_id) {
        var global_id = video_id.replace(/video_/, '');
        var hdurl = $videoElement.attr('HD');
        var sdurl = $videoElement.attr('SD');
        var select_id = $(element).find('select').attr('id');
        var subtitle_id = $(element).find('.dm-subtitle').attr('id');
        var videoplayer_id = $(element).find('.videoplayer').attr('id');
        var newtop = 0;
        var videoHD = false;
        /**
        HD
        **/
        videojs.HDPlugin = videojs.Button.extend({
            /* @constructor */
            init: function(player, options){
                player.videoHD = options.videoHD;
                videojs.Button.call(this, player, options);
                this.on('click', this.onClick);
            }
        });

        videojs.HDPlugin.prototype.onClick = function() {

            var player = this.player,
                current_time = player.currentTime(),
                is_paused = player.paused();

            if (player.videoHD == true) {

                $("#" + player.id()).find(".vjs-HD-button").removeClass("hdon");
                $("#" + player.id()).find(".vjs-HD-button").addClass("hdoff");

                player.src([{type: "video/mp4", src: player.sdurl}]).one('loadedmetadata', function() {
                    player.currentTime(current_time);
                    if (!is_paused) {
                        player.play();
                    }
                });
                player.videoHD = false;  // this line could probably be removed
            } else {
                $("#" + player.id()).find(".vjs-HD-button").removeClass("hdoff");
                $("#" + player.id()).find(".vjs-HD-button").addClass("hdon");

                player.src([{type: "video/mp4", src: player.hdurl}]).one('loadedmetadata', function() {
                    player.currentTime(current_time);
                    if (!is_paused) {
                        player.play();
                    }
                });
                player.videoHD = true;  // this line could probably be removed
            }
        };

        videojs.plugin('HDPlugin', function(options) {
            var player = this;
            player.chgsrc = function(src) {
                player.src([{type: "video/mp4", src: src }]);
                player.play();
            };
            var HDPlugin = new videojs.HDPlugin(this, {
                el: videojs.Component.prototype.createEl(null, {
                    className: 'vjs-HD-button vjs-control',
                    innerHTML: '<div class="vjs-control-content">HD</div>',
                    role: 'button',
                    'aria-live': 'polite',
                    tabIndex: 0
                }),
                videoHD: false
            });
            // Add the button to the control bar object and the DOM
            this.controlBar.HDPlugin = this.controlBar.addChild(HDPlugin);
        });

    } // if $videoElement
    /** fin HD **/

    var showCues = function(cues) {
        if(!$("." + subtitle_id).is(':visible')) {
            $("." + subtitle_id).show();   // ??
            $("#" + subtitle_id).show();   // ??
            $("#" + videoplayer_id).attr('style', 'width:61%; float:left');
            $("#" + videoplayer_id).find('.vjs-control[role="button"]').css('width','3em');
        }

        document.getElementById(subtitle_id).innerHTML = ""; //Open/Close <span class=\"togglesub\">&nbsp;</span><br/>

        for (var j = 0; j < cues.length; ++j) {
            var cue = cues[j];
            document.getElementById(subtitle_id).innerHTML += "<span class='cue' id='" + subtitle_id + "_cue_" + cue.id + "' begin='" + cue.startTime + "'>&nbsp;-&nbsp;" + cue.text + "</span><br/>";
        }

        $("#" + subtitle_id + " span.cue").click(function() {
            videoPlayer.currentTime($(this).attr('begin'));
        });

    }

    var is_saving_user_state = false;
    var save_user_state = function() {
        var data = {
            'saved_video_position': parseInt(videoPlayer.currentTime()),
        };
        if (is_saving_user_state === false) {
            is_saving_user_state = true;
            $.post(saveHandlerUrl, JSON.stringify(data)).complete(function() {
               setTimeout(function (){
                   is_saving_user_state = false;
               }, 1000);
           });
        }

    }

    var trackload = new Array(); // array contening tracks id and cues (queues ?)

    /* Here's where you'd do things on page load. */
    $(function ($) {
        if (video_id) {
            if (!videoPlayer) {
                delete videojs.players[video_id];
            }
            videojs(video_id, {}, function() {
                log('video_player_ready', {}, video_id.replace(/video_/, ''));
                videoPlayer = this;
                videoPlayer.on('seeked', function() {
                    save_user_state(saveHandlerUrl);
                    log('seek_video', {'new_time': parseInt(videoPlayer.currentTime())});
                });
                videoPlayer.on('ended', function() {
                    save_user_state(saveHandlerUrl);
                    log('stop_video', {'currentTime': parseInt(videoPlayer.currentTime())});
                });
                videoPlayer.on('pause', function() {
                    save_user_state(saveHandlerUrl);
                    log('pause_video', {'currentTime': parseInt(videoPlayer.currentTime())});
                });
                videoPlayer.on('play', function() {
                    log('play_video', {'currentTime': parseInt(videoPlayer.currentTime())})
                });
                videoPlayer.on('loadstart', function() {
                    log('load_video', {})
                });

                videoPlayer.sdurl = sdurl;
                videoPlayer.hdurl = hdurl;

                //Load tracks
                var tracks = videoPlayer.textTracks();
                for (var i = 0; i < tracks.length; i++) {
                    var track = tracks[i]; // or whichever track you need
                    track.on('loaded', function() {
                        trackload[this.id()] = this.cues();
                        showCues(this.cues());
                    });
                }
                videoPlayer.on('subtitlestrackchange', function() {
                    //ChangeClassVideoJS
                    var kids = videoPlayer.getChild('textTrackDisplay').children();
                    if (kids && kids.length > 0) {
                        if (trackload[kids[0].id()]) showCues(trackload[kids[0].id()]);
                    } else {
                        $("#" + videoplayer_id).attr('style','width:100%');
                        $("#" + subtitle_id).hide(); // ??
                        $("." + subtitle_id).hide();
                    }
                });
                videoPlayer.on('cuechange', function(){
                    $("#" + subtitle_id + " span").removeClass("current");
                    var tabActiveCues = videoPlayer.getChild('textTrackDisplay').children()[0].activeCues();
                    var lastcueid = 0;
                    var cue = null;
                    for (cue in tabActiveCues) {
                        $("#" + subtitle_id + "_cue_" + tabActiveCues[cue].id).addClass("current");
                        lastcueid = tabActiveCues[cue].id;
                    }
                    if ($("#" + subtitle_id + " span.cue").is(':visible') && lastcueid > 0 && $("#" + subtitle_id + "_cue_" + lastcueid).length) {
                        newtop = $("#" + subtitle_id).scrollTop() - $("#" + subtitle_id).offset().top + $("#" + subtitle_id + "_cue_" + lastcueid).offset().top;
                        $("#" + subtitle_id).animate({
                            scrollTop: newtop
                        }, 500);
                    }
                });
                if (hdurl) {
                    videoPlayer.HDPlugin({});
                }

            });
        }  //end if video_id
    });// end function

    /**
    Show or hide subtitle panel on right
    **/
    $("." + subtitle_id).click(function() {
        if ($("#" + subtitle_id).is(':visible')) {
            $("#" + subtitle_id).hide();
            $("#" + videoplayer_id).attr('style', 'width:100%; float:left');
            $("#" + videoplayer_id).find('.vjs-control[role="button"]').css('width', '4em');
            log('video_hide_subtitle', {'currentTime': parseInt(videoPlayer.currentTime())});
        } else {
            $("#" + subtitle_id).show();
            $("#" + videoplayer_id).attr('style', 'width:61%; float:left');
            $("#" + videoplayer_id).find('.vjs-control[role="button"]').css('width', '3em');
            log('video_show_subtitle', {'currentTime': parseInt(videoPlayer.currentTime())});
        }
    });
    /**
    event to track into tracking file play back rate
    **/
    $(element).find('.vjs-playback-rate').click(function() {
        log('speed_change_video', {
            'currentTime': parseInt(videoPlayer.currentTime()),
            'newSpeed': videoPlayer.playbackRate()
        });
    });
    /**
    send log event to save it into tracking file
    **/
    function log(eventName, data) {
        // Default parameters that always get logged.
        var logInfo = {
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
