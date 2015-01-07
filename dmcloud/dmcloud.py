# -*- coding: utf-8 -*-
#
################################################################################
# Globals Imports ##############################################################

import gettext
import logging
import os
import pkg_resources
import requests
import time
from webob import Response  # send response from handler

# Set up message catalog access
from django.template import Context, Template
from django.utils import translation as trans
LANGUAGE = trans.get_language()
t = gettext.translation(
    'dmcloud',
    os.path.join(
        os.path.dirname(os.path.realpath(__file__)), 'locale'),
    languages=[LANGUAGE], fallback=True
)
_ = t.ugettext

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String, Boolean

from xblock.fragment import Fragment

################################################################################
#  Globals Var #################################################################
log = logging.getLogger(__name__)

################################################################################
#  Specifics Imports ###########################################################
try:
    from cloudkey import CloudKey, SerializerError
except ImportError:
    log.error("You have to install cloudkey before using this block")
    raise
try:
    from universities.models import University
except ImportError:
    log.error("You have to install universities application before using this block")
    raise


################################################################################
class DmCloud(XBlock):
    """
    XBlock providing a video player for videos hosted on DMCloud
    This Xblock show video in iframe using DMCloud Api and video_id
    """

    URL_TIMEOUT = 3600 * 24 * 7

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


    def __init__(self, *args, **kwargs):
        super(DmCloud, self).__init__(*args, **kwargs)
        self._cloudkey = None
        self._univ = None

    @property
    def univ(self):
        """
        Get the university from the organisation code filled during the course creation.
        """
        if self._univ is None:
            try:
                self._univ = University.objects.get(code=self.location.org)
            except University.DoesNotExist:
                log.error("university not found: %s", self.location.org)
                raise
        return self._univ

    @property
    def cloudkey(self):
        """
        Initialize cloudKey to get video url with video_id.
        """
        if self._cloudkey is None:
            self._cloudkey = CloudKey(self.univ.dm_user_id, self.univ.dm_api_key)
        return self._cloudkey

    def resource_string(self, path):
        """Gets the content of a resource"""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def render_template(self, template_path, context=None):
        """
        Evaluate a template by resource path, applying the provided context
        """
        context = context or {}
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
        stream_url = ""
        stream_url_hd = ""
        download_url_ld = ""
        download_url_std = ""
        download_url_hd = ""
        thumbnail_url = ""
        subs_url = {}
        auth_key = ""
        auth_key_secure = ""

        if self.id_video != "":
            assets = self.cloudkey.media.get_assets(id=self.id_video)
            if self.player == "Dailymotion":
                auth_key = self.get_dailymotion_auth_key(False)
                auth_key_secure = self.get_dailymotion_auth_key(True)

            else:
                #assets['jpeg_thumbnail_source']['stream_url']
                #mp4_h264_aac
                #mp4_h264_aac_ld
                #mp4_h264_aac_hq -> 480
                #mp4_h264_aac_hd -> 720
                #jpeg_thumbnail_medium
                thumbnail_url = self.cloudkey.media.get_stream_url(
                    id=self.id_video, asset_name='jpeg_thumbnail_source'
                )
                stream_url = self.get_stream_url()
                if assets.get('mp4_h264_aac_hd'):
                    stream_url_hd = self.get_stream_url('mp4_h264_aac_hd', download=False)
                elif assets.get('mp4_h264_aac_hq'):
                    stream_url_hd = self.get_stream_url('mp4_h264_aac_hq', download=False)
                subs_url = self.get_subs_url()
            if self.allow_download_video:
                download_url_ld = self.get_stream_url('mp4_h264_aac_ld', download=True)
                download_url_std = self.get_stream_url(download=True)
                if assets.get('mp4_h264_aac_hd'):
                    download_url_hd = self.get_stream_url('mp4_h264_aac_hd', download=True)
                elif assets.get('mp4_h264_aac_hq'):
                    download_url_hd = self.get_stream_url('mp4_h264_aac_hq', download=True)

        #create url for videojs to add it directly in the template
        dmjsurl = self.runtime.local_resource_url(self, "public/js/src/dmplayer-sdk.js")

        frag = Fragment()
        frag.add_content(self.render_template("templates/html/dmcloud.html", {
            'self': self,
            'id': self.location.html_id(),
            #dmplayer
            'auth_key':auth_key,
            'auth_key_secure':auth_key_secure,
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
        }))


        #load locally to work with more than one instance on page
        frag.add_css_url(self.runtime.local_resource_url(self, "public/css/dmcloud.css"))

        if self.player == "Dailymotion":
            frag.add_javascript(self.resource_string("public/js/src/dmcloud-dm.js"))
            frag.initialize_js('DmCloudPlayer')
        else:
            frag.add_css_url(self.runtime.local_resource_url(self, "public/video-js-4.10.2/video-js.min.css"))
            frag.add_javascript_url(self.runtime.local_resource_url(self, "public/video-js-4.10.2/video.js"))
            frag.add_javascript(self.resource_string("public/js/src/dmcloud-video.js"))
            frag.initialize_js('DmCloudVideo')

        return frag

    def get_dailymotion_auth_key(self, secure):
        embed_url = self.get_embed_url(secure)
        auth_index = embed_url.find("auth=")
        auth_keys = embed_url[auth_index+5:len(embed_url)]
        return auth_keys

    def get_embed_url(self, secure):
        return self.cloudkey.media._get_url(
            base_path="/player/embed",
            id=self.id_video,
            expires=time.time() + self.URL_TIMEOUT,
            secure=secure
        )

    def get_stream_url(self, asset_name='mp4_h264_aac', download=False):
        return self.cloudkey.media.get_stream_url(
            id=self.id_video,
            asset_name=asset_name,
            download=download,
            expires=time.time() + self.URL_TIMEOUT
        )

    def get_subs_url(self):
        try:
            return self.cloudkey.media.get_subs_urls(id=self.id_video, type="srt")
        except SerializerError:
            return ""

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
            log.info(u'Received submissions: %s', submissions)
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
        self.saved_video_position = submissions['saved_video_position']
        response = {
            'result': 'success',
        }
        return response

    @XBlock.handler
    def transcript(self, request, dispatch):
        if request.GET.get('url'):
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
