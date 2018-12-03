import requests
import argparse
import logging

def execute():
    print "Not implemented yet"
parser = argparse.ArgumentParser(description='Searches through all pages of Singapore Land Transport Authority Datamall API for stop coordinates for a given service')
parser.add_argument("bus", help="Buses to get data for, known as ServiceNo on Datamall API")
parser.add_argument("accountKey", help="Specify account key LTA Datamall API")

args = parser.parse_args()
if __name__ == "__main__":
execute(args.bus, args.email, args.password, args)
