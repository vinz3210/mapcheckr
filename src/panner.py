import json
import os

# get all files in the in folder

files = []

with os.scandir('./in') as entries:
    for entry in entries:
        files.append(entry.name)


import math

def calculate_heading(our_pos, pos_we_want_to_look_at):
    print(our_pos)
    print(pos_we_want_to_look_at)
    lat1 = our_pos['lat']
    lon1 = our_pos['lng']
    lat2 = pos_we_want_to_look_at['lat']
    lon2 = pos_we_want_to_look_at['lng']

    delta_lat = math.radians(lat2 - lat1) 
    delta_lon = math.radians(lon2 - lon1) # Approximate heading using arcsin 
    heading = math.degrees(math.atan2(delta_lon, delta_lat)) # Normalize to 0-360 degrees 
    heading = (heading + 360) % 360 
    print(heading)
    return heading


    return 


#filter files for "_checked" in the name
checked_files = [file for file in files if "_checked" in file]

for file in checked_files:
    new_locations = []
    filepath = './in/' + file
    unchecked_file_path = filepath.replace("_checked", "")
    old_data = {}
    with open (unchecked_file_path, encoding="utf-8") as f:
        loading_old_data = json.load(f).get("customCoordinates")
        for line in loading_old_data:
            print(line)
            old_data[line.get("extra")["index"]] = line

    with open(filepath, encoding="utf-8") as f:
        data = json.load(f)
        for location in data:
            locId = location.get("extra")["index"]
            if locId in old_data:
                old_location = old_data[locId]
                location["heading"] = calculate_heading(location, old_location)
                new_locations.append(location)
                

    with open("./out/" + file, 'w') as f:
        json.dump(new_locations, f, indent=4)
