#!/usr/bin/env python

"""
Project-wide application configuration.

DO NOT STORE SECRETS, PASSWORDS, ETC. IN THIS FILE.
They will be exposed to users. Use environment variables instead.
See get_secrets() below for a fast way to access them.
"""

import os

"""
NAMES
"""
# Project name used for display
PROJECT_NAME = 'In Memoriam: Musicians And Entertainers Who Died In 2013'

# Project name in urls
# Use dashes, not underscores!
PROJECT_SLUG = 'music-memoriam-2013'

# The name of the repository containing the source
REPOSITORY_NAME = 'in-memoriam-2013'
REPOSITORY_URL = 'git@github.com:nprapps/%s.git' % REPOSITORY_NAME
REPOSITORY_ALT_URL = None # 'git@bitbucket.org:nprapps/%s.git' % REPOSITORY_NAME'

# The name to be used in paths on the server
PROJECT_FILENAME = 'in_memoriam_2013'

"""
DEPLOYMENT
"""
PRODUCTION_S3_BUCKETS = ['apps.npr.org', 'apps2.npr.org']
STAGING_S3_BUCKETS = ['stage-apps.npr.org']

PRODUCTION_SERVERS = ['cron.nprapps.org']
STAGING_SERVERS = ['50.112.92.131']

# Should code be deployed to the web/cron servers?
DEPLOY_TO_SERVERS = False

SERVER_USER = 'ubuntu'
SERVER_PYTHON = 'python2.7'
SERVER_PROJECT_PATH = '/home/%s/apps/%s' % (SERVER_USER, PROJECT_FILENAME)
SERVER_REPOSITORY_PATH = '%s/repository' % SERVER_PROJECT_PATH
SERVER_VIRTUALENV_PATH = '%s/virtualenv' % SERVER_PROJECT_PATH

# Should the crontab file be installed on the servers?
# If True, DEPLOY_TO_SERVERS must also be True
DEPLOY_CRONTAB = False

# Should the service configurations be installed on the servers?
# If True, DEPLOY_TO_SERVERS must also be True
DEPLOY_SERVICES = False

UWSGI_SOCKET_PATH = '/tmp/%s.uwsgi.sock' % PROJECT_FILENAME
UWSGI_LOG_PATH = '/var/log/%s.uwsgi.log' % PROJECT_FILENAME
APP_LOG_PATH = '/var/log/%s.app.log' % PROJECT_FILENAME

# Services are the server-side services we want to enable and configure.
# A three-tuple following this format:
# (service name, service deployment path, service config file extension)
SERVER_SERVICES = [
    ('app', SERVER_REPOSITORY_PATH, 'ini'),
    ('uwsgi', '/etc/init', 'conf'),
    ('nginx', '/etc/nginx/locations-enabled', 'conf'),
]

# These variables will be set at runtime. See configure_targets() below
S3_BUCKETS = []
S3_BASE_URL = ''
SERVERS = []
SERVER_BASE_URL = ''
DEBUG = True

"""
COPY EDITING
"""
COPY_GOOGLE_DOC_KEY = '1Hm9kywLuNhqZ6-1odS5RdvHDjuSYNgKSG1ZOOXQzS_8'

"""
SHARING
"""
PROJECT_DESCRIPTION = 'NPR Music remembers the musicians, composers, producers and other visionaries whom we lost in 2013.'
SHARE_URL = 'http://%s/%s/' % (PRODUCTION_S3_BUCKETS[0], PROJECT_SLUG)

TWITTER = {
    'TEXT': PROJECT_DESCRIPTION,
    'URL': SHARE_URL,
    # Will be resized to 120x120, can't be larger than 1MB
    'IMAGE_URL': 'http://%s/%s/img/promo-twitter.jpg' % (PRODUCTION_S3_BUCKETS[0], PROJECT_SLUG),
    'HASHTAG': 'nprmusic2013'
}

FACEBOOK = {
    'TITLE': PROJECT_NAME,
    'URL': SHARE_URL,
    'DESCRIPTION': PROJECT_DESCRIPTION,
    # Should be square. No documented restrictions on size
    'IMAGE_URL': 'http://%s/%s/img/promo-facebook.jpg' % (PRODUCTION_S3_BUCKETS[0], PROJECT_SLUG),
    'APP_ID': '138837436154588'
}

GOOGLE = {
    # Thumbnail image for Google News / Search.
    # No documented restrictions on resolution or size
    'IMAGE_URL': TWITTER['IMAGE_URL']
}

NPR_DFP = {
    'STORY_ID': '251637150',
    'TARGET': '',
    'ENVIRONMENT': 'NPR',
    'TESTSERVER': 'false'
}

"""
SERVICES
"""
GOOGLE_ANALYTICS_ID = 'UA-5828686-4'

"""
Utilities
"""
def get_secrets():
    """
    A method for accessing our secrets.
    """
    secrets = [
        'EXAMPLE_SECRET'
    ]

    secrets_dict = {}

    for secret in secrets:
        name = '%s_%s' % (PROJECT_FILENAME, secret)
        secrets_dict[secret] = os.environ.get(name, None)

    return secrets_dict

def configure_targets(deployment_target):
    """
    Configure deployment targets. Abstracted so this can be
    overriden for rendering before deployment.
    """
    global S3_BUCKETS
    global S3_BASE_URL
    global SERVERS
    global SERVER_BASE_URL
    global DEBUG
    global DEPLOYMENT_TARGET
    global MP3_LINK
    global OGG_LINK

    if deployment_target == 'production':
        S3_BUCKETS = PRODUCTION_S3_BUCKETS
        S3_BASE_URL = 'https://%s/%s' % (S3_BUCKETS[0], PROJECT_SLUG)
        SERVERS = PRODUCTION_SERVERS
        SERVER_BASE_URL = 'http://%s/%s' % (SERVERS[0], PROJECT_SLUG)
        DEBUG = False
        MP3_LINK = 'https://apps.npr.org/music-memoriam-2013/audio/in-memoriam.mp3'
        OGG_LINK = 'https://apps.npr.org/music-memoriam-2013/audio/in-memoriam.ogg'
    elif deployment_target == 'staging':
        S3_BUCKETS = STAGING_S3_BUCKETS
        S3_BASE_URL = 'http://%s/%s' % (S3_BUCKETS[0], PROJECT_SLUG)
        SERVERS = STAGING_SERVERS
        SERVER_BASE_URL = 'http://%s/%s' % (SERVERS[0], PROJECT_SLUG)
        DEBUG = True
        MP3_LINK = 'http://stage-apps.npr.org/music-memoriam-2013/audio/in-memoriam.mp3'
        OGG_LINK = 'http://stage-apps.npr.org/music-memoriam-2013/audio/in-memoriam.ogg'
    else:
        S3_BUCKETS = []
        S3_BASE_URL = 'http://127.0.0.1:8000'
        SERVERS = []
        SERVER_BASE_URL = 'http://127.0.0.1:8001/%s' % PROJECT_SLUG
        DEBUG = True
        MP3_LINK = 'http://stage-apps.npr.org/music-memoriam-2013/audio/in-memoriam.mp3'
        OGG_LINK = 'http://stage-apps.npr.org/music-memoriam-2013/audio/in-memoriam.ogg'

    DEPLOYMENT_TARGET = deployment_target

"""
Run automated configuration
"""
DEPLOYMENT_TARGET = os.environ.get('DEPLOYMENT_TARGET', None)

configure_targets(DEPLOYMENT_TARGET)

