# node-json

TODO: Update these instructions, as well as args for index.js.

## Getting started

### Enable Drive API

Visit https://console.developers.google.com and enable the Drive API for your project.

Download your client configuration and save the `credentials.json` to the project home directory.

### Fetch your video directory ID

*TODO: Create instruction here*

The video directory ID will be the parent folder for all videos.

### Structure your content

Videos in the directory above should be contained in folders, with video files directly contained under each folder, along with any thumbnails or cover art.

**Example:**

 - Video 1
	 - Part 1.mp4
	 - Part 2.mp4
	 - Thumbnail 1.png
	 - Thumbnail 2.png
	 - ...
- Video 2
	- Part 1.avi
	- Part 2.avi
	- Thumbnail 1.png
	- ...
- ...


### Generate your json output
Using the parent directory above, run the following command, specifying your video directory and json output:

`node index.js list YOUR_ROOT_DIRECTORY JSON_FILE`
 
#### Append thumbnails
`node index.js thumbs JSON_FILE`

#### Append videos
`node index.js videos JSON_FILE`
