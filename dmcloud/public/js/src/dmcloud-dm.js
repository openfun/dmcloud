var is_saving_user_state = false;

function DmCloudPlayer(runtime, element) {
    var saveHandlerUrl = runtime.handlerUrl(element, 'save_user_state');
    //console.log("DmCloudPlayer : "+saveHandlerUrl);
    $(element).find('.dmplayer').attr('data-save',saveHandlerUrl);
}

window.dmAsyncInit = function()
{
    //console.log("dmAsyncInit");
    initialisePlayer();
};

function initialisePlayer(){
    $(".dmplayer").each(function(){
        //console.log(this.id+" - "+this.tagName+" - "+$(this).is('div'));
        if($(this).is('div')){
            var video = $(this).attr('data-video');
            var saveurl = $(this).attr('data-save');
            //console.log(this.id+" - "+video+" - "+saveurl);
            var keyauth = document.location.protocol==='https:'?$(this).attr('data-auths'):$(this).attr('data-auth');
            
            var params = {
                auth: keyauth,
            };
            var player = DM.player(this.id, {video: video, width: "100%", height: "360", params: params});
            player.addEventListener("apiready", function(e)
            {
                //e.target.play();
                //console.log("apiready : " + this.id);
            });
            if(saveurl) {
                player.addEventListener('seeked', function(){ the_save_user_state(this, saveurl);});
                player.addEventListener('ended', function(){ the_save_user_state(this, saveurl);});
                player.addEventListener('pause', function(){ the_save_user_state(this, saveurl);});
            }
        }
    });
}


function the_save_user_state(theplayer, saveurl) {
    //console.log(theplayer+" - "+saveurl+" - "+parseInt(theplayer.currentTime));
    var data = {
        'saved_video_position': parseInt(theplayer.currentTime),
    };
    if(is_saving_user_state===false) {
        //console.log("do");
        is_saving_user_state=true;
        $.post(saveurl, JSON.stringify(data)).complete(function() {
           //window.location.reload(false);
           //console.log("done");
           //is_saving_user_state=false;
           setTimeout(function (){
            is_saving_user_state=false;
           }, 1000);
       });
    }
}

