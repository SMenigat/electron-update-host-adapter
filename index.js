const https = require("https");
const http = require("http");

const events = [];
let _feedUrl;

function fireEvent() {
  const type = arguments["0"];
  const functionArguments = [];
  Object.keys(arguments).forEach(index => {
    if (index !== "0") {
      functionArguments.push(arguments[index.toString()]);
    }
  });
  events.forEach(event => {
    if (event.type === type) {
      // we also inject the current event if its an 'update-downloaded' event
      const argumentsToPass =
        type === "update-downloaded"
          ? [event].concat(functionArguments)
          : functionArguments;

      event.callback.apply(event, argumentsToPass);
    }
  });
}

function registerEvent(type, callback) {
  events.push({
    type,
    callback
  });
}

class ElectronUpdater {
  setFeedURL(feedUrl) {
    _feedUrl = feedUrl;
  }
  getFeedURL() {
    return _feedUrl;
  }
  on(type, callback) {
    registerEvent(type, callback);
  }
  quitAndInstall() {
    // not implemented yet
  }
  checkForUpdates() {
    // we handle http and https connections
    const connectionManager = _feedUrl.startsWith("https://") ? https : http;

    fireEvent("checking-for-update");

    connectionManager
      .get(_feedUrl, resp => {
        const { statusCode, statusMessage } = resp;
        if (statusCode === 200) {
          fireEvent("update-available");
          let data = "";
          
          // A chunk of data has been recieved.
          resp.on("data", chunk => {
            data += chunk;
          });

          // The whole response has been received. Print out the result.
          resp.on("end", () => {
            try {
              const parsedResponse = JSON.parse(data);
              fireEvent(
                "update-downloaded",
                parsedResponse.releaseNotes,
                parsedResponse.releaseName,
                parsedResponse.releaseDate,
                parsedResponse.updateURL
              );
            } catch (err) {
              fireEvent("error", err.toString());
            }
          });
        } else if (statusCode === 204) {
          fireEvent("update-not-available");
        } else {
          fireEvent("error", `${statusCode} - ${statusMessage}`);
        }
      })
      .on("error", err => {
        fireEvent("error", err.toString());
      });
  }
}

module.exports = new ElectronUpdater();
