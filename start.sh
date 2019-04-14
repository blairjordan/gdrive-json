#!/bin/sh

node index.js list VIDEO_DIRECTORY_ID;
node index.js thumbs;
node index.js videos;

mv files.videos.json videos.json
rm files.*
