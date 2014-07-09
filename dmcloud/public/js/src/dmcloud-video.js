/* Javascript for DmCloud. */
function DmCloudVideo(runtime, element) {
    //console.log($('.xblock-save-button', element));
    
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');
    //alert('ok1');
    var video_id = $(element).find('video').attr('id');
    var select_id = $(element).find('select').attr('id');
    
    var myPlayer;
    
    videojs(video_id, {}, function(){
        // Player (this) is initialized and ready.
        myPlayer=this;
        myPlayer.on('subtitlestrackchange', function(){
            console.log("subtitlestrackchange");
            //console.log($(myPlayer.getChild('textTrackDisplay')));
            console.log(myPlayer.getChild('textTrackDisplay')); // -> getChild
            //console.log(myPlayer.getChild('textTrack'));
            //console.log(myPlayer.getChild('textTrackDisplay').cues());
            
        });
        myPlayer.on('cuechange', function(){
            console.log("cuechange");
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

