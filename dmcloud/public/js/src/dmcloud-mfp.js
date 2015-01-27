/* Javascript for DmCloud video. */
function DmCloudMFPVideo(runtime, element, data) {
    console.log("DmCloudMFPVideo");
    /*console.log(uiControls);
    console.log(runtime);
    console.log(data.local_ressource_url);
    basepath = data.local_ressource_url.substring(0, data.local_ressource_url.indexOf('client'));
    console.log(basepath);
    for(key in uiControls ){
        if(typeof uiControls[key] === 'string' && uiControls[key].indexOf('client')!=-1)
            uiControls[key] = basepath+uiControls[key];
        else {
            for(subkey in uiControls[key] ){
                if(typeof uiControls[key][subkey] === 'string' && uiControls[key][subkey].indexOf('client')!=-1)
                    uiControls[key][subkey] = basepath+uiControls[key][subkey];
            }
        }
    }
    console.log("---DmCloudMFPVideo---");
    */


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
    

    console.log("DmCloudMFPVideo2 : "+video_id);
    

    var is_saving_user_state = false;
    var save_user_state = function() {
        var data = {
            'saved_video_position': parseInt(myPlayer.currentTime()),
        };
        if(is_saving_user_state===false) {
            is_saving_user_state=true;
            $.post(saveHandlerUrl, JSON.stringify(data)).complete(function() {
               //window.location.reload(false);
               //is_saving_user_state=false;
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
                // add 25/09/2014 to force reload player
                delete videojs.players[video_id];
            }
            
            videojs(video_id, {preload: 'auto'}, function(){
                // Player (this) is initialized and ready.
                console.log('Player (this) is initialized and ready.');
                myPlayer=this;
                this.addClass('video-js');
                this.addClass('vjs-default-skin');
                //console.log($("#"+myPlayer.id()).children(':first').is("object"));
                //save_user_state
                /*
                myPlayer.on('seeked', function(){ save_user_state(saveHandlerUrl);});
                myPlayer.on('ended', function(){ save_user_state(saveHandlerUrl);});
                myPlayer.on('pause', function(){ save_user_state(saveHandlerUrl);});
                */
            });
            
        }//end if video_id
    //});// end function
}

