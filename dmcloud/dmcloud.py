"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
import logging
from xblock.core import XBlock
from xblock.fields import Scope, Integer, String
from xblock.fragment import Fragment
from django.template import Context, Template
import time, sys

from cloudkey import CloudKey, SecLevel
from cloudkey import AuthenticationError, NotFound, InvalidParameter, Exists, MissingParameter

# Globals ###########################################################
#BASE_URL='http://sebest.api.dev.int.dmcloud.net'



log = logging.getLogger(__name__)


class DmCloud(XBlock):
    """
    TO-DO: document what your XBlock does.
    For now, it does nothing...
    """
    
    #USER_ID=''
    #API_KEY=''
    # create a temporary py file to store DM Cloud User Id and ApiKey
    from key import *
    cloudkey = CloudKey(USER_ID, API_KEY)
    
    #print "--> RUNTIME : %s" %self.runtime

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.
    id_video = String(
        scope=Scope.content,
        help="The dmcloud video id",
        default=""
    )
    
    #url = String(help="The URL of the video to display", default='https://api.dmcloud.net/player/embed/52667d13947399581c000001/53686bf39473993104772d40?auth=1714817958-0-x9dbf06c-e1542d6a652904571bceddf39909d183', scope=Scope.content)
                  
    title = String(help="Title", default='My new video', scope=Scope.content)

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    def render_template(self, template_path, context={}):
        """
        Evaluate a template by resource path, applying the provided context
        """
        template_str = self.resource_string(template_path)
        template = Template(template_str)
        return template.render(Context(context))

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the DmCloud, shown to students
        when viewing courses.
        """
        print "RUNTIME STUDENT runtime : %s" %self.runtime
        print self.location.org #from opaque_keys.edx.locations import Location
        #category / name / course / tag / org / revision
        #print "RUNTIME STUDENT course_id: %s" %self.runtime.course_id #--> NONE
        #print "RUNTIME STUDENT modulestore: %s" %self.runtime.modulestore -> draft module store
        # --> ok 
        #print "RUNTIME STUDENT module_data : %s" %self.runtime.module_data
        # module_data: a dict mapping Location -> json that was cached from the underlying modulestore
        
        #print "RUNTIME STUDENT default_class: %s" %self.runtime.default_class
        #print "RUNTIME STUDENT cached_metadata: %s" %self.runtime.cached_metadata
        
        #html = self.resource_string("static/html/dmcloud.html")
        #frag = Fragment(html.format(self=self))
        frag = Fragment()
        url = self.cloudkey.media.get_embed_url(id=self.id_video)
        frag.add_content(self.render_template("static/html/dmcloud.html", {
            'self': self,
            'url': url
        }))
        frag.add_css(self.resource_string("static/css/dmcloud.css"))
        #frag.add_javascript(self.resource_string("static/js/src/dmcloud.js"))
        #frag.initialize_js('DmCloud')
        return frag
    
    def studio_view(self, context=None):
        """
        The primary view of the DmCloud, shown to students
        when viewing courses.
        """
        #print "SELF : %s" %self
        print 20*"~"
        print "RUNTIME Studio : %s" %self.runtime
        print "RUNTIME Studio : %s" %self.runtime.course_id
        print 20*"~"
        #log.info("CONTEXT : %s" %context)
        #log.info("PARENT : %s", self.parent)
        html = self.resource_string("static/html/dmcloud-studio.html")
        frag = Fragment(html.format(self=self))
        frag.add_css(self.resource_string("static/css/dmcloud.css"))
        frag.add_javascript(self.resource_string("static/js/src/dmcloud.js"))
        frag.initialize_js('DmCloud')
        return frag    
    
    @XBlock.json_handler
    def studio_submit(self, submissions, suffix=''):
        #log.info(u'Received submissions: {}'.format(submissions))

        self.id_video = submissions['id_video']

        #self.url = cloudkey.media.get_embed_url(id=self.id_video)
        
        self.title = submissions['video_title']

        return {
            'result': 'success',
        }
    
    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
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
