# gdrive-json

This is a script to download a Google Drive video collection to a structured JSON file, including thumbnail references and playback information.

## Getting started

### Structure your content

Your videos should be contained in named folders, with video files directly contained under each folder, along with any thumbnails or cover art.

**Example:**

 - Video 1
	 - Part 1.mp4
	 - Part 2.mp4
	 - Thumbnail 1.png
	 - Thumbnail 2.png
	 - ...
- Video 2
	- Full Video.avi
	- Thumbnail 1.png
	- ...
- ...

### Enable Drive API

Visit https://console.developers.google.com and enable the Drive API for your project.

Download your client configuration and save the `credentials.json` to the project home directory.

### Fetch your video directory ID

The video directory ID will be the parent folder for all videos.

Open `start.sh` and replace `VIDEO_DIRECTORY_ID` with the ID of your Google Drive video directory.

### Run start.sh

Follow the instructions to authorise your app to read from Google Drive.

Once this script has finished, it will generate `videos.json` and populate `/images`.
