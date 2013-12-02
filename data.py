#!/usr/bin/env python

import csv
import json

import requests

FIELDNAMES = [
    "first_name",
    "last_name",
    "artist_page_seamus_id",
    "date_of_birth",
    "date_of_death",
    "also_known_as",
    "description",
    "obit_URL",
    "photo_filename",
    "photo_credit",
    "photo_caption",
    "start_time_in_mix",
    "song_name"
]

class Person(object):
    """
    Represents a single person from in memoriam.
    """
    def __init__(self, **kwargs):
        """
        Should handle any data cleanup.
        Loads each keyword argument as a class attribute.
        """
        for key, value in kwargs.items():
            value = unicode(value.decode('utf-8')).strip()
            setattr(self, key, value)

def init():
    get_csv()
    people = parse_csv()
    write_json(people)

def get_csv():
    """
    Downloads the In Memoriam spreadsheet CSV.
    """
    r = requests.get('https://docs.google.com/spreadsheet/pub?key=0ArVJ2rZZnZpDdEFxUlY5eDBDN1NCSG55ZXNvTnlyWnc&output=csv')

    print "Downloading CSV."

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

    print "Parsing %s people." % len(people)

    for person in people:
        p = Person(**person)
        payload.append(p.__dict__)

    return payload

def write_json(payload):
    """
    Writes the payload to JSON.
    Lord help you if it's not a list or a dictionary.
    """
    print "Writing %s people to JSON." % len(payload)

    with open('www/live-data/in-memoriam.json', 'wb') as writefile:
        writefile.write(json.dumps(payload))

if __name__ == "__main__":
    init()
