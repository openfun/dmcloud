# -*- coding: utf-8 -*-
#
################################################################################
# Globals Imports ##############################################################

import pkg_resources
import logging

from django.utils.translation import ugettext as _

from xblock.core import XBlock
from xblock.fields import Scope, Integer, String, Boolean
from xblock.fragment import Fragment
from django.template import Context, Template

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
        frag = Fragment()
        embed_url = ""
        stream_url = ""
        if self.id_video != "":
            try:
                embed_url = self.cloudkey.media.get_embed_url(id=self.id_video)
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
