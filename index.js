const fs = require("fs");
const readline = require("readline");
const process = require("process");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
const TOKEN_PATH = "token.json";
const OUTFILE = "files";
const IMAGE_PATH = "./images";
const WAIT_INTERVAL = 15;

const op = process.argv[2];
const fileId = (process.argv.length === 4) ? process.argv[3] : ""; 

fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  
  if (op === "list")
    authorize(JSON.parse(content), listFiles); // 1. fetch folder list
  else if (op === "thumbs")
    authorize(JSON.parse(content), fetchThumbs); // 2. fetch thumbnails list
  else if (op === "videos")
    authorize(JSON.parse(content), fetchVideos); // 3. fetch video list
  else
    console.log("unknown op");
});

const authorize = (credentials, callback) => {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
};

const getAccessToken = (oAuth2Client, callback) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
};

downloadFiles = (auth, files) => {
  const drive = google.drive({version: "v3", auth});
  let promises = [];
  for (let i = 0; i < files.length; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        if (files[i].length === 0)
          resolve();
        else {
          let interval = WAIT_INTERVAL * 100;
          setTimeout( (j) => { // avoid rate limit
            const dest = fs.createWriteStream(`${IMAGE_PATH}/${files[i].name}`);
            
            drive.files.get({
              fileId: files[i].id,
              alt: 'media' 
            },
            { responseType: 'stream' },
            function(err, res){
                res.data
                .on('end', () => {
                  process.stdout.write("+");
                })
                .on('error', err => {
                  console.log(err);
                  reject();
                })
                .pipe(dest);
            })
          }, interval * i, i);
          resolve();
        }
      })
    );
  }

  return Promise.all(promises).then(() => {
    return;
  });
}

// fetches thumbs and appends to files list
const fetchVideos = auth => {
  const orig = JSON.parse(fs.readFileSync(`${OUTFILE}.thumbs.json`, "utf8"));
  const filtered = orig.filter(f => f.mimeType === "application/vnd.google-apps.folder");
  const drive = google.drive({version: "v3", auth});
  let interval = WAIT_INTERVAL * 100;
  
  let promises = [];
  for (let i = 0; i < filtered.length; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        setTimeout( (j) => { // avoid rate limit
          drive.files.list({
            includeRemoved: false,
            spaces: "drive",
            pageSize: 1000,
            fields: "nextPageToken, files(id, name, parents, mimeType, webViewLink, modifiedTime, videoMediaMetadata)",
            q: `"${filtered[i].id}" in parents and (mimeType contains 'video')`,
            orderBy: "name"
          }, (err, res) => {
            if (err) { 
              console.log(err);
              reject(err);
            }
            orig.filter(o => o.id === filtered[i].id)[0].videos = res.data.files;
            process.stdout.write(">");
            resolve();
          });
        }, interval * i, i);
      })
    );
  }

  return Promise.all(promises).then(() => {
    const file = fs.createWriteStream(`${OUTFILE}.videos.json`);
    file.write(JSON.stringify(orig));
    file.end();
  });
};

// fetches thumbs and appends to files list
const fetchThumbs = auth => {
  if (!fs.existsSync(IMAGE_PATH)) {
    fs.mkdirSync(IMAGE_PATH);
  }
  const orig = JSON.parse(fs.readFileSync(`${OUTFILE}.json`, "utf8"));
  const filtered = orig.filter(f => f.mimeType === "application/vnd.google-apps.folder");
  const drive = google.drive({version: "v3", auth});
  let interval = 10 * 100;
  
  let promises = [];
  for (let i = 0; i < filtered.length; i++) {
    promises.push(
      new Promise((resolve, reject) => {
        setTimeout( (j) => { // avoid rate limit
          drive.files.list({
            includeRemoved: false,
            spaces: "drive",
            pageSize: 1000,
            fields: "nextPageToken, files(id, name, parents, mimeType, modifiedTime)",
            q: `"${filtered[i].id}" in parents and (mimeType contains 'jpeg' or mimeType contains 'png' )`,
            orderBy: "name"
          }, (err, res) => {
            if (err) { 
              console.log(err);
              reject(err);
            }
            orig.filter(o => o.id === filtered[i].id)[0].images = res.data.files;
            process.stdout.write(".");
            downloadFiles(auth, res.data.files);
            resolve(orig.filter(o => o.id === filtered[i].id)[0]);
          });
        }, interval * i, i);
      })
    );
  }

  return Promise.all(promises).then(() => {
    const file = fs.createWriteStream(`${OUTFILE}.thumbs.json`);
    file.write(JSON.stringify(orig));
    file.end();
  });
};

const listFiles = auth => {
  const drive = google.drive({version: "v3", auth});
  drive.files.list({
    includeRemoved: false,
    spaces: "drive",
    pageSize: 1000,
    fileId,
    fields: "nextPageToken, files(id, name, parents, mimeType, modifiedTime, trashed)",
    q: `"${fileId}" in parents and (mimeType contains 'folder' )`,
    orderBy: "name"
  }, (err, res) => {
    if (err) { console.log(err); return err; }
    let files = res.data.files;
    if (files.length) {
      console.log("Files:");
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });

      files = files.filter(f => f.trashed === false);
      
      const file = fs.createWriteStream(`${OUTFILE}.json`);
      file.write(JSON.stringify(files));
      file.end();
    } else {
      console.log("No files found.");
    }
  });
};
