function DmCloudVideo(runtime, element) {
    console.log($('.xblock-save-button', element));
    var dmvideoelement = element;    

    //var handlerUrl = runtime.handlerUrl(element, 'studio_submit');
    
    
    
    
    $(function (require, $) {
        'use strict';
        /* Here's where you'd do things on page load. */
        require(
        [
            'video/01_initialize.js',
            'video/025_focus_grabber.js',
            'video/035_video_accessible_menu.js',
            'video/04_video_control.js',
            'video/05_video_quality_control.js',
            'video/06_video_progress_slider.js',
            'video/07_video_volume_control.js',
            'video/08_video_speed_control.js',
            'video/09_video_caption.js'
        ],
        function (
            initialize,
            FocusGrabber,
            VideoAccessibleMenu,
            VideoControl,
            VideoQualityControl,
            VideoProgressSlider,
            VideoVolumeControl,
            VideoSpeedControl,
            VideoCaption
        ) {
        var youtubeXhr = null,
                oldVideo = window.DmCloudVideo;

            window.DmCloudVideo = function () {
                
            
                
            var previousState = window.DmCloudVideo.previousState,
                    state;

            

                // Check for existance of previous state, uninitialize it if necessary, and create a new state. Store
                // new state for future invocation of this module consturctor function.
                if (previousState && previousState.videoPlayer) {
                    previousState.saveState(true);
                    $(window).off('unload', previousState.saveState);
                }

                state = {};
                // Because this constructor can be called multiple times on a single page (when the user switches
                // verticals, the page doesn't reload, but the content changes), we must will check each time if there
                // is a previous copy of 'state' object. If there is, we will make sure that copy exists cleanly. We
                // have to do this because when verticals switch, the code does not handle any Xmodule JS code that is
                // running - it simply removes DOM elements from the page. Any functions that were running during this,
                // and that will run afterwards (expecting the DOM elements to be present) must be stopped by hand.
                window.DmCloudVideo.previousState = state;

                state.modules = [
                    FocusGrabber,
                    VideoAccessibleMenu,
                    VideoControl,
                    VideoQualityControl,
                    VideoProgressSlider,
                    VideoVolumeControl,
                    VideoSpeedControl,
                    VideoCaption
                ];

                state.youtubeXhr = youtubeXhr;
                initialize(state, dmvideoelement);
                if (!youtubeXhr) {
                    youtubeXhr = state.youtubeXhr;
                }

                $(element).find('.video').data('video-player-state', state);

                // Because the 'state' object is only available inside this closure, we will also make it available to
                // the caller by returning it. This is necessary so that we can test Video with Jasmine.
                return state;
            };

            window.DmCloudVideo.clearYoutubeXhr = function () {
                youtubeXhr = null;
            };

            // Invoke the mock Video constructor so that the elements stored within it can be processed by the real
            // `window.Video` constructor.
            oldVideo(null, true);
        }
    );
}(window.RequireJS.require, window.jQuery));
}