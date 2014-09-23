# -*- coding: utf-8 -*-
#
################################################################################
# Globals Imports ##############################################################

import pkg_resources
from pkg_resources import resource_string
import logging

#from django.utils.translation import ugettext as _
import gettext
import os

# Set up message catalog access
from django.utils import translation as trans
LANGUAGE=trans.get_language()
t = gettext.translation('dmcloud', os.path.join(os.path.dirname(os.path.realpath(__file__)), 'locale'), languages=[LANGUAGE], fallback=True)
_ = t.ugettext

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String, Boolean

from xblock.fragment import Fragment
from django.template import Context, Template

from webob import Response #send response from handler

import time, sys

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
    
    #display name already defined by xblock - we just redefined it to update translation
    display_name = String(
        help=_("The name students see. This name appears in the course ribbon and as a header for the video."),
        display_name=_("Component Display Name"),
        default=_("New video"),
        scope=Scope.settings
    )
    
    id_video = String(
        scope=Scope.settings,
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
    
    saved_video_position = Integer(
        help="Current position in the video.",
        scope=Scope.user_state,
        default=0
    )
    
    playback_rate = String(
        display_name=_("Playback rate"),
        help=_("Change current speed of the video"),
        scope=Scope.user_state,
        values=[
            {'name': "2 (%s)"%_("Faster"), 'val': "2.0"},
            {'name': "1.5 (%s)"%_("Faster"), 'val': "1.5"},
            {'name': "%s"%_("Real time"), 'val': "1.0"},
            {'name': "0.7 (%s)"%_("Slower"), 'val': "0.7"},
            {'name': "0.5 (%s)"%_("Slower"), 'val': "0.5"},
        ],
        default="1.0"
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
        ###
        # VIDEO MODULE
        #
        #### => work and load dailymotion cloud player
        frag = Fragment()
        embed_url = ""
        stream_url = ""
        stream_url_hd = ""
        download_url = ""
        thumbnail_url = ""
        subs_url = {}
        if self.id_video != "":
            try:
                embed_url = self.cloudkey.media.get_embed_url(id=self.id_video, expires = time.time() + 3600 * 24 * 7)
                stream_url = self.cloudkey.media.get_stream_url(id=self.id_video, expires = time.time() + 3600 * 24 * 7)
                assets = self.cloudkey.media.get_assets(id=self.id_video)
                #print 20*"-"
                #for k in assets:
                #    print "KEY : %s" %k
                #    print "VAL : %s" %assets[k]
                #print 20*"-"
                thumbnail_url = assets['jpeg_thumbnail_source']['stream_url']
                if assets['mp4_h264_aac_hq']:
                    stream_url_hd = self.cloudkey.media.get_stream_url(id=self.id_video, asset_name='mp4_h264_aac_hq', expires = time.time() + 3600 * 24 * 7)
                #print 20*"-"
                subs_url = self.cloudkey.media.get_subs_urls(id=self.id_video, type="srt")
                if self.allow_download_video :
                    download_url = self.cloudkey.media.get_stream_url(id=self.id_video, download=True, expires = time.time() + 3600 * 24 * 7)
            except:
                pass
        
        frag.add_content(self.render_template("templates/html/dmcloud.html", {
            'self': self,
            'id': self.location.html_id(),
            'url': embed_url,
            'download_url': download_url,
            'stream_url' : stream_url,
            'stream_url_hd' : stream_url_hd,
            'subs_url' : subs_url,
            'thumbnail_url' :thumbnail_url,
            "transcript_url" : self.runtime.handler_url(self, 'transcript', 'translation').rstrip('/?')
        }))
        
        frag.add_css(self.resource_string("public/css/dmcloud.css"))
        #frag.add_css_url("public/videojs-4.6/video-js.css")
        frag.add_css_url(self.runtime.local_resource_url(self,"public/video-js-4.6-full/video-js.min.css"))
        #frag.add_css_url("http://vjs.zencdn.net/4.6/video-js.css")
        #load locally to work with more than one instance on page
        frag.add_javascript(self.resource_string("public/video-js-4.6-full/video.js"))
        
        frag.add_javascript(self.resource_string("public/js/src/dmcloud-video.js"))
        frag.initialize_js('DmCloudVideo')
        
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
            self.id_video = submissions['id_video'].strip()
            self.allow_download_video = submissions['allow_download_video']
            response = {
                'result': 'success',
            }
        return response
    
    @XBlock.json_handler
    def save_user_state(self, submissions, suffix=''):
        #print u'Received submissions: {}'.format(submissions)
        #log.info(u'Received submissions: {}'.format(submissions))
        self.saved_video_position = submissions['saved_video_position']
        response = {
                'result': 'success',
            }
        return response
        
    @XBlock.handler
    def transcript(self, request, dispatch):
        #print "REQUEST GET: %s" %request.GET.get('url')
        if request.GET.get('url'):
            import requests
            r = requests.get(request.GET.get('url'))
            response = Response("%s" %r.content)
            response.content_type = 'text/plain'
        else:
            response = Response(status=404)
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
