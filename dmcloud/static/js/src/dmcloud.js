/* Javascript for DmCloud. */
function DmCloud(runtime, element) {
    //console.log($('.xblock-save-button', element));
    

    var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
    
    $('.save-button', element).bind('click', function() {
        var data = {
            'video_title': $('#video_title').val(),
            'id_video': $('#video_id').val(),
        };

        $.post(handlerUrl, JSON.stringify(data)).complete(function() {
            window.location.reload(false);
            //console.log("ok");
        });
        /*
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify(data),
            success: window.location.reload(false)
        });
        */
    });

    $('.cancel-button', element).bind('click', function() {
        runtime.notify('cancel', {});
    });

    /*
    $('p', element).click(function(eventObject) {
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({"hello": "world"}),
            success: updateCount
        });
    });
    */
    $(function ($) {
        /* Here's where you'd do things on page load. */
    });
}

/*
function BrightcoveVideoEditBlock(runtime, element) {
    console.log($('.xblock-save-button', element));
    $('.save-button', element).bind('click', function() {
        var data = {
            'href': $('#video-href').val(),
            'api_key': $('#video-api-key').val(),
        };
        var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
        $.post(handlerUrl, JSON.stringify(data)).complete(function() {
            window.location.reload(false);
        });
    });

    $('.cancel-button', element).bind('click', function() {
        runtime.notify('cancel', {});
    });
}
*/