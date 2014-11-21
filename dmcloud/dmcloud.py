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
LANGUAGE = trans.get_language()
t = gettext.translation('dmcloud', os.path.join(os.path.dirname(os.path.realpath(__file__)), 'locale'), languages=[LANGUAGE], fallback=True)
_ = t.ugettext

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String, Boolean

from xblock.fragment import Fragment
from django.template import Context, Template

from webob import Response  # send response from handler

import time
import sys

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
        self.univ = None
        try:
            # Get the university from the org code of course
            self.univ = University.objects.get(code=self.location.org)
            self.cloudkey = CloudKey(self.univ.dm_user_id, self.univ.dm_api_key)
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
            {'name': "2 (%s)" % _("Faster"), 'val': "2.0"},
            {'name': "1.5 (%s)" % _("Faster"), 'val': "1.5"},
            {'name': "%s" % _("Real time"), 'val': "1.0"},
            {'name': "0.7 (%s)" % _("Slower"), 'val': "0.7"},
            {'name': "0.5 (%s)" % _("Slower"), 'val': "0.5"},
        ],
        default="1.0"
    )

    player = String(
        display_name=_("Player"),
        help=_("Player use to display the video"),
        scope=Scope.settings,
        values=[
            {'name': "HTML5", 'val': "HTML5"},
            {'name': "Dailymotion", 'val': "Dailymotion"},
        ],
        default="HTML5"
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
        download_url_ld = ""
        download_url_std = ""
        download_url_hd = ""
        thumbnail_url = ""
        subs_url = {}
        auth_key = ""

        if self.id_video != "":
            try:
                if self.player == "Dailymotion":
                    #embed_url = self.cloudkey.media.get_embed_url(id=self.id_video, expires=time.time() + 3600 * 24 * 7)
                    embed_url = self.cloudkey.media._get_url(base_path="/player/embed", id=self.id_video, expires=time.time() + 3600 * 24 * 7) #It works with api...
                    auth_index = embed_url.find("auth=")
                    auth_key = embed_url[auth_index+5:len(embed_url)]
                    if self.allow_download_video:
                        download_url_ld = self.cloudkey.media.get_stream_url(
                            id=self.id_video, asset_name='mp4_h264_aac_ld', download=True, expires=time.time() + 3600 * 24 * 7)
                        download_url_std = self.cloudkey.media.get_stream_url(
                            id=self.id_video, download=True, expires=time.time() + 3600 * 24 * 7)
                        download_url_hd = self.cloudkey.media.get_stream_url(
                            id=self.id_video, asset_name='mp4_h264_aac_hd', download=True, expires=time.time() + 3600 * 24 * 7)
                else:
                    #assets['jpeg_thumbnail_source']['stream_url']
                    #mp4_h264_aac
                    #mp4_h264_aac_ld
                    #mp4_h264_aac_hq -> 480
                    #mp4_h264_aac_hd -> 720
                    #jpeg_thumbnail_medium
                    thumbnail_url = self.cloudkey.media.get_stream_url(id=self.id_video, asset_name='jpeg_thumbnail_source')
                    stream_url = self.cloudkey.media.get_stream_url(id=self.id_video, expires=time.time() + 3600 * 24 * 7)
                    assets = self.cloudkey.media.get_assets(id=self.id_video)
                    if assets.get('mp4_h264_aac_hd'):
                        stream_url_hd = self.cloudkey.media.get_stream_url(
                            id=self.id_video, asset_name='mp4_h264_aac_hd', expires=time.time() + 3600 * 24 * 7)
                    elif assets.get('mp4_h264_aac_hq'):
                        stream_url_hd = self.cloudkey.media.get_stream_url(
                            id=self.id_video, asset_name='mp4_h264_aac_hq', expires=time.time() + 3600 * 24 * 7)
                    #assets = self.cloudkey.media.get_assets(id=self.id_video)
                    subs_url = self.cloudkey.media.get_subs_urls(
                        id=self.id_video, type="srt")
                    if self.allow_download_video:
                        download_url_ld = self.cloudkey.media.get_stream_url(
                            id=self.id_video, asset_name='mp4_h264_aac_ld', download=True, expires=time.time() + 3600 * 24 * 7)
                        download_url_std = self.cloudkey.media.get_stream_url(
                            id=self.id_video, download=True, expires=time.time() + 3600 * 24 * 7)
                        download_url_hd = self.cloudkey.media.get_stream_url(
                            id=self.id_video, asset_name='mp4_h264_aac_hd', download=True, expires=time.time() + 3600 * 24 * 7)
            except:
                msg = u'\n***** DmCloud error :%s - %s' % (sys.exc_info()[0], sys.exc_info()[1])
                log.error(msg)
                print msg

        #create url for videojs to add it directly in the template
        videojsurl = self.runtime.local_resource_url(self, "public/video-js-4.10.2/video.js")
        dmjsurl = self.runtime.local_resource_url(self, "public/js/src/dmplayer-sdk.js")

        frag.add_content(self.render_template("templates/html/dmcloud.html", {
            'self': self,
            'id': self.location.html_id(),
            'embed_url': embed_url,
            #dmplayer
            'auth_key':auth_key,
            'video_id':self.id_video,
            'user_id':self.univ.dm_user_id,
            'dmjsurl':dmjsurl,
            #end dmplayer
            'download_url_ld': download_url_ld,
            'download_url_std': download_url_std,
            'download_url_hd': download_url_hd,
            'stream_url': stream_url,
            'stream_url_hd': stream_url_hd,
            'subs_url': subs_url,
            'thumbnail_url': thumbnail_url,
            "transcript_url": self.runtime.handler_url(self, 'transcript', 'translation').rstrip('/?'),
            "videojsurl": videojsurl
        }))

        #frag.add_css_url("public/videojs-4.6/video-js.css")
        frag.add_css_url(self.runtime.local_resource_url(self, "public/video-js-4.10.2/video-js.min.css"))
        #load locally to work with more than one instance on page
        #frag.add_css(self.resource_string("public/css/dmcloud.css"))
        frag.add_css_url(self.runtime.local_resource_url(self, "public/css/dmcloud.css"))

        #frag.add_javascript(self.resource_string("public/video-js-4.6-full/video.js"))
        #frag.add_javascript_url(self.runtime.local_resource_url(self,"public/video-js-4.6-full/video.js"))
        
        if self.player == "Dailymotion":
            #frag.add_javascript_url("//api.dmcloud.net/static/dmplayer/dmplayer-sdk.js")
            frag.add_javascript(self.resource_string("public/js/src/dmcloud-dm.js"))
            frag.initialize_js('DmCloudPlayer')
        else:
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
        if submissions['id_video'] == "":
            response = {
                'result': 'error',
                'message': 'You should give a video ID'
            }
        else:
            log.info(u'Received submissions: {}'.format(submissions))
            self.display_name = submissions['display_name']
            self.id_video = submissions['id_video'].strip()
            self.allow_download_video = submissions['allow_download_video']
            self.player = submissions['dmcloud_player']
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
            response = Response("%s" % r.content)
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
