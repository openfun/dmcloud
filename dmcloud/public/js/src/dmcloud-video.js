/* Javascript for DmCloud. */
function DmCloudVideo(runtime, element) {
    //console.log($('.xblock-save-button', element));
    
    var handlerUrl = runtime.handlerUrl(element, 'save_user_state');
    //alert('ok1');
    
    videojs("my_video", {}, function(){
        // Player (this) is initialized and ready.
        //alert('ok2');
    });
    
    $(function ($) {
        /* Here's where you'd do things on page load. */
        //alert('page load');
    });
}