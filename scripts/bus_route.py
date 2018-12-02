import requests
import argparse
import logging

import polyline
def decodePolyline(encodedtext):
    return polyline.decode(encodedtext)
def execute(buses, email, password, options):
    r = requests.post("https://developers.onemap.sg/privateapi/auth/post/getToken", headers={
        'mimeType': "multipart/form-data",
    }, files ={
        'email' : (None, email),
        'password': (None, password)
    })
    if options.folder is None:
        options.folder = "./"
    access_token = r.json()['access_token']
    for bus in buses.split(","):
        r = requests.get("https://developers.onemap.sg/publicapi/busexp/getOneBusRoute", params={
            'busNo': bus,
            'direction': 1,
            'token': access_token
        })
        data = r.json()
        stopCoordinates = []
        for key, stops in data.items():
            for stop in stops:
                path = decodePolyline(stop['GEOMETRIES'])
                stopCoordinates.append(str(path))
            text = (','.join(stopCoordinates).replace("(", "[").replace(")", "]"))
            f = open("./"+options.folder+"/route_"+bus+".json", "w")
            f.write(text)
parser = argparse.ArgumentParser(description='Generates geojson route data for bus service  from OneMap')
parser.add_argument("bus", help="Buses to get data for")
parser.add_argument("email", help="Email for OneMap API Account")
parser.add_argument("password", help="Password for OneMap API Account")
parser.add_argument("--folder", help="Indicate where to save json files for the generated geojson text")

args = parser.parse_args()
if __name__ == "__main__":
    execute(args.bus, args.email, args.password, args)
