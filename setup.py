# -*- coding: utf-8 -*-

# Imports ###########################################################

import os
from setuptools import setup

# Functions #########################################################

def package_data(pkg, root_list):
    """Generic function to find package_data for `pkg` under `root`."""
    data = []
    for root in root_list:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}

# Main ##############################################################

setup(
    name='dmcloud-xblock',
    version='0.2',
    description='XBlock - DM Cloud Video Player',   # TODO: write a better description.
    packages=[
        'dmcloud',
    ],
    install_requires=[
        'XBlock',
    ],
    entry_points={
        'xblock.v1': [
            'dmcloud = dmcloud:DmCloud',
        ]
    },
    #package_data=package_data("dmcloud", "static"),
    package_data=package_data("dmcloud", ["templates", "public", "locale"]), 
)