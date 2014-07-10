/* Javascript for DmCloud. */
function DmCloud(runtime, element) {
    //console.log($('.xblock-save-button', element));
    var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
    
    $('.save-button', element).bind('click', function() {
        if($('#video_id').val()!='') {
            var data = {
                'display_name': $('#edit_display_name').val(),
                'id_video': $('#video_id').val(),
                'allow_download_video': $('#allow_download_video').val()
            };
            $.post(handlerUrl, JSON.stringify(data)).complete(function() {
                window.location.reload(false);
            });
        } else {
            alert('You must give a video id');
        }
    });

    $('.cancel-button', element).bind('click', function() {
        runtime.notify('cancel', {});
    });
    $(function ($) {
        /* Here's where you'd do things on page load. */
    });
}