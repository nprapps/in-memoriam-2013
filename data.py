#!/usr/bin/env python

import csv
import json
import re

import requests

FIELDNAMES = [
    'first_name',
    'last_name',
    'caps_first_name',
    'caps_last_name',
    'artist_page_seamus_id',
    'date_of_birth',
    'date_of_death',
    'also_known_as',
    'description',
    'obit_URL',
    'photo_filename',
    'photo_credit',
    'photo_caption',
    'start_time_in_mix',
    'song_name'
]

class Person(object):
    """
    Represents a single person from in memoriam.
    """

    def slugify(self):
        """
        Generate a slug for this artist.
        """
        bits = []

        for field in ['first_name', 'last_name']:
            attr = getattr(self, field)

            if attr:
                attr = attr.lower()
                attr = re.sub(r"[^\w\s]", '', attr)
                attr = re.sub(r"\s+", '-', attr)

                bits.append(attr)

        setattr(self, "slug", '-'.join(bits))


    def __init__(self, **kwargs):
        """
        Should handle any data cleanup.
        Loads each keyword argument as a class attribute.
        """
        for key, value in kwargs.items():
            value = unicode(value.decode('utf-8')).strip()

            setattr(self, key, value)

        self.slugify()

def init():
    get_csv()
    people = parse_csv()
    write_json(people)
    load_photos(people)

def get_csv():
    """
    Downloads the In Memoriam spreadsheet CSV.
    """
    r = requests.get('https://docs.google.com/spreadsheet/pub?key=0ArVJ2rZZnZpDdEFxUlY5eDBDN1NCSG55ZXNvTnlyWnc&output=csv')

    print 'Downloading CSV.'

    with open('data/in-memoriam.csv', 'wb') as writefile:
        writefile.write(r.content)

def parse_csv():
    """
    Reads the In Memoriam CSV.
    Instantiates a class for each row.
    Class init handles cleanup.
    """
    payload = []

    with open('data/in-memoriam.csv', 'rb') as readfile:
        people = list(csv.DictReader(readfile, fieldnames=FIELDNAMES))

    people = people[1:]

    print 'Parsing %s people.' % len(people)

    for idx, person in enumerate(people):
        p = Person(**person)
        payload.append(p.__dict__)

    return payload

def write_json(people):
    """
    Writes the payload to JSON.
    Lord help you if it's not a list or a dictionary.
    """
    print 'Writing %s people to JSON.' % len(people)

    with open('www/live-data/in-memoriam.json', 'wb') as writefile:
        writefile.write(json.dumps(people))

def load_photos(people):
    print "Loading %s photos from S3." % len(people)

    for person in people:
        r = requests.get('http://apps.npr.org/in-memoriam-2013/img/people/originals/%s' % person['photo_filename'])
        if r.status_code == 200:
            with open('unversioned/%s' % person['photo_filename'], 'wb') as writefile:
                writefile.write(r.content)
                print 'Downloading photo: %s' % person['photo_filename'].replace('_', ' ').replace('.jpg', '')

if __name__ == "__main__":
    init()
