const util = require("util");
const request = require("request");
const path = require("path");
const http = require("http");

const post = util.promisify(request.post);
const get = util.promisify(request.get);

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

let timeout = 0;

const streamURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream?tweet.fields=context_annotations&expansions=author_id"
);

const rulesURL = new URL(
  "https://api.twitter.com/2/tweets/search/stream/rules"
);

const sleep = async (delay) => {
  return new Promise((resolve) => setTimeout(() => resolve(true), delay));
};

const getRules = async () => {
  const token = BEARER_TOKEN;
  const requestConfig = {
    url: rulesURL,
    auth: {
      bearer: token
    },
    json: true,
  };

  try {
    const response = await get(requestConfig);

    if (response.statusCode !== 200) {
        console.error(response.body.error.message);
    }

    console.log(response.body);
  } catch (e) {
    console.error(e);
  }
};

const streamTweets = () => {
  const token = BEARER_TOKEN;
  let stream;

  const config = {
    url: streamURL,
    auth: {
      bearer: token,
    },
    timeout: 31000,
  };

  try {
    const stream = request.get(config);

    stream
      .on("data", (data) => {
        try {
          const json = JSON.parse(data);
          if (json.connection_issue) {
            console.error(json);
            reconnect(stream);
          } else {
            if (json.data) {
              console.log("tweet -> ", JSON.stringify(json, null, 4));
            } else {
              console.error("authError", json);
            }
          }
        } catch (e) {
          console.error("heartbeat");
        }
      })
      .on("error", (error) => {
        // Connection timed out
        console.error("error -> ", errorMessage);
        reconnect(stream);
      });
  } catch (e) {
    console.error("authError", authMessage);
  }
};

const reconnect = async (stream) => {
  timeout++;
  stream.abort();
  await sleep(2 ** timeout * 1000);
  streamTweets();
};

(async () => {
  await streamTweets();
})();