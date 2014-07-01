# -*- coding: utf-8 -*-
#
################################################################################
# Globals Imports ##############################################################

import pkg_resources
from pkg_resources import resource_string
import logging

from django.utils.translation import ugettext as _

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String, Boolean

from xmodule.fields import RelativeTime
from collections import OrderedDict

from xblock.fragment import Fragment
from django.template import Context, Template

import time, sys

from edxmako import LOOKUP
from edxmako.shortcuts import *
import datetime
import json
from operator import itemgetter
from django.conf import settings

#from xmodule.video_module import VideoModule

################################################################################
#  Globals Var #################################################################
log = logging.getLogger(__name__)

################################################################################
#  Specifics Imports ###########################################################
try:
    from cloudkey import CloudKey
    from cloudkey import sign_url
except:
    log.error("You have to install cloudkey before using this block")
try:
    from universities.models import University
except:
    log.error("You have to install universities application before using this block")

################################################################################
class DmCloud(XBlock):
    """
    XBlock providing a video player for videos hosted on DMCloud
    This Xblock show video in iframe using DMCloud Api and video_id
    """
    def __init__(self, runtime, field_data, scope_ids):
        """
        Initiate couldKey to get video url with video_id
        Get the university from the organisation code fill during creating course
        """
        super(DmCloud, self).__init__(runtime, field_data, scope_ids)
        self.cloudkey = None
        try:
            # Get the university from the org code of course
            univ = University.objects.get(code=self.location.org)
            self.cloudkey = CloudKey(univ.dm_user_id, univ.dm_api_key)
        except:
            log.error("university not found")

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.
    #title = String(help=_('Title of the video'), default=_('My new video'), scope=Scope.content, display_name=_('Title'))
    
    video_time = 0
    icon_class = 'video'

    # To make sure that js files are called in proper order we use numerical
    # index. We do that to avoid issues that occurs in tests.
    #module = __name__.replace('.video_module', '', 2)
    module="xmodule"
    js = {
        'js': [
            resource_string(module, 'js/src/video/00_video_storage.js'),
            resource_string(module, 'js/src/video/00_resizer.js'),
            resource_string(module, 'js/src/video/00_async_process.js'),
            resource_string(module, 'js/src/video/00_sjson.js'),
            resource_string(module, 'js/src/video/00_iterator.js'),
            resource_string(module, 'js/src/video/01_initialize.js'),
            resource_string(module, 'js/src/video/025_focus_grabber.js'),
            resource_string(module, 'js/src/video/02_html5_video.js'),
            resource_string(module, 'js/src/video/03_video_player.js'),
            resource_string(module, 'js/src/video/035_video_accessible_menu.js'),
            resource_string(module, 'js/src/video/04_video_control.js'),
            resource_string(module, 'js/src/video/05_video_quality_control.js'),
            resource_string(module, 'js/src/video/06_video_progress_slider.js'),
            resource_string(module, 'js/src/video/07_video_volume_control.js'),
            resource_string(module, 'js/src/video/08_video_speed_control.js'),
            resource_string(module, 'js/src/video/09_video_caption.js'),
            resource_string(module, 'js/src/video/10_main.js')
        ]
    }
    css = {'scss': [
        resource_string(module, 'css/video/display.scss'),
        resource_string(module, 'css/video/accessible_menu.scss'),
    ]}
    js_module_name = "Video"
    
    
    
    display_name = String(
        help=_("The name students see. This name appears in the course ribbon and as a header for the video."),
        display_name=_("Component Display Name"),
        default="Dm Cloud Video",
        scope=Scope.settings
    )
    
    id_video = String(
        scope=Scope.content,
        help=_('Fill this with the ID of the video found on DM Cloud'),
        default="",
        display_name=_('Video ID')
    )
    
    allow_download_video = Boolean(
        help=_("Allow students to download this video."),
        display_name=_("Video Download Allowed"),
        scope=Scope.settings,
        default=False
    )
    
    saved_video_position = RelativeTime(
        help="Current position in the video.",
        scope=Scope.user_state,
        default=datetime.timedelta(seconds=0)
    )
    
    sub = String(
        help="The default transcript for the video, from the Default Timed Transcript field on the Basic tab. This transcript should be in English. You don't have to change this setting.",
        display_name="Default Timed Transcript",
        scope=Scope.settings,
        default=""
    )
    
    show_captions = Boolean(
        help="Specify whether the transcripts appear with the video by default.",
        display_name="Show Transcript",
        scope=Scope.settings,
        default=True
    )

    def resource_string(self, path):
        """Gets the content of a resource"""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def render_template(self, template_path, context={}):
        """
        Evaluate a template by resource path, applying the provided context
        """
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        return template.render(Context(context))

    def student_view(self, context=None):
        """
        Player view, displayed to the student
        """
        transcript_language = u'en'
        languages = {'en': 'English'}
        sorted_languages = OrderedDict(sorted(languages.items(), key=itemgetter(1)))
        
        
        ### LOAD Edx video template
        test_data = {
            'transcript_language': "", 
            'display_name': "Video", 
            'yt_test_url': 'gdata.youtube.com/feeds/api/videos/', 
            'general_speed': 1.0, 
            'sources': {"mp4": u'http://vjs.zencdn.net/v/oceans.mp4',"webm": u'http://vjs.zencdn.net/v/oceans.webm', 'main': u'http://vjs.zencdn.net/v/oceans.mp4'}, 
            'show_captions': 'false', 
            'transcript_download_format': 'srt', 
            'speed': 'null', 
            'id': self.location.html_id(), 
            'transcript_languages': json.dumps({}), 
            'data_dir': None, 
            'sub': u'', 
            'start': 0.0, 
            'track': None, 
            'yt_api_url': 'www.youtube.com/iframe_api', 
            'transcript_download_formats_list': [{'display_name': 'SubRip (.srt) file', 'value': 'srt'}, {'display_name': 'Text (.txt) file', 'value': 'txt'}], 
            'ajax_url': self.runtime.handler_url(self, 'studio_submit'), 
            'end': 0.0, 
            'youtube_streams': u'1.00:oceans.webm', 
            'yt_test_timeout': 1500, 
            'transcript_available_translations_url': '/preview/xblock/i4x:;_;_CNAM;_CNAM002;_video;_ab312a5f718547ef94d4d979d96d7cf9/handler/transcript/available_translations', 
            'transcript_translation_url': '/preview/xblock/i4x:;_;_CNAM;_CNAM002;_video;_ab312a5f718547ef94d4d979d96d7cf9/handler/transcript/translation', 
            'handout': None, 
            'saved_video_position': 0.0, 
            'autoplay': False
            }
        
        #print "CONTEXT : %s" %context
        
        #context.update(test_data)
        
        data = {
            'ajax_url': "",
            'autoplay': False,
            # This won't work when we move to data that
            # isn't on the filesystem
            'data_dir': None,
            'display_name': self.display_name,
            'end': 0,
            'handout': "",
            'id': self.location.html_id(),
            'show_captions': json.dumps(self.show_captions),
            'sources': {u'mp4': u'http://vjs.zencdn.net/v/oceans.mp4',u'webm': u'http://vjs.zencdn.net/v/oceans.webm', 'main': u'http://vjs.zencdn.net/v/oceans.mp4'},
            'speed': json.dumps(float(1)),
            'general_speed': float(1),
            'saved_video_position': self.saved_video_position.total_seconds(),
            'start': 0,
            'sub': self.sub,
            'track': "",
            'youtube_streams': "",
            # TODO: Later on the value 1500 should be taken from some global
            # configuration setting field.
            'yt_test_timeout': 1500,
            'yt_api_url': settings.YOUTUBE['API'],
            'yt_test_url': settings.YOUTUBE['TEST_URL'],
            'transcript_download_format': "",
            'transcript_download_formats_list': None,
            'transcript_language': transcript_language,
            'transcript_languages': json.dumps(sorted_languages),
            'transcript_translation_url': self.runtime.handler_url(self, 'transcript', 'translation').rstrip('/?'),
            'transcript_available_translations_url': self.runtime.handler_url(self, 'transcript', 'available_translations').rstrip('/?'),
        }
        
        html = render_to_string('video.html', test_data, None, "lms.main")
        
        frag = Fragment(html)
        for css in self.css.get('scss'):
            frag.add_css(css)
        #print 20*"*"
        #print self.js.get('js')
        #print 20*"*"
        #for js in self.js.get('js'):
        #    frag.add_javascript(js)
            
        #frag.initialize_js('Video')
        #frag.add_css(self.resource_string("public/css/dmcloud.css"))
        frag.add_javascript(self.resource_string("public/js/src/dmcloud-video.js"))
        #frag.initialize_js('DmCloud')
        frag.initialize_js('DmCloudVideo')
        
        return frag
        
        ###
        # VIDEO MODULE
        #
        #### => work and load dailymotion cloud player
        frag = Fragment()
        embed_url = ""
        stream_url = ""
        if self.id_video != "":
            try:
                embed_url = self.cloudkey.media.get_embed_url(id=self.id_video, expires = time.time() + 3600 * 24 * 7)
                if self.allow_download_video :
                    stream_url = self.cloudkey.media.get_stream_url(id=self.id_video, download=True)
            except:
                pass
        frag.add_content(self.render_template("templates/html/dmcloud.html", {
            'self': self,
            'url': embed_url,
            'stream_url' : stream_url
        }))
        frag.add_css(self.resource_string("public/css/dmcloud.css"))
        return frag
    
    def studio_view(self, context=None):
        """
        Editing view in Studio
        """
        frag = Fragment()
        frag.add_content(self.render_template("/templates/html/dmcloud-studio.html", {'self': self}))
        frag.add_css(self.resource_string("public/css/dmcloud.css"))
        frag.add_javascript(self.resource_string("public/js/src/dmcloud.js"))
        frag.initialize_js('DmCloud')
        return frag    
    
    @XBlock.json_handler
    def studio_submit(self, submissions, suffix=''):
        if submissions['id_video']== "":
            response = {
                'result': 'error',
                'message': 'You should give a video ID'
            }
        else:
            log.info(u'Received submissions: {}'.format(submissions))
            self.display_name = submissions['display_name']
            self.id_video = submissions['id_video']
            self.allow_download_video = submissions['allow_download_video']
            response = {
                'result': 'success',
            }
        return response
    
    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("DmCloud",
             """<vertical_demo>
                <dmcloud/>
                </vertical_demo>
             """),
        ]