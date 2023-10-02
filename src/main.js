import Axios from "axios";
import { throwIfMissing } from "./utils.js";
import WebSocket from "ws";

function getRealtimeUrl() {
  const endpointUrl = new URL(process.env.ENDPOINT);
  const realtimeUrl = new URL("/v1/realtime", endpointUrl);
  realtimeUrl.protocol = "wss:";
  realtimeUrl.searchParams.append("project", process.env.PROJECT_ID);
  realtimeUrl.searchParams.append("channels[]", "account");

  return realtimeUrl.toString();
}

export default async ({ res }) => {
  throwIfMissing(process.env, ["ENDPOINT", "PROJECT_ID", "HEARTBEAT_URL"]);

  await new Promise((resolve, reject) => {
    let timeout;
    const websocket = new WebSocket(getRealtimeUrl(), {
      timeout: 5000,
    });

    websocket.on("open", () => {
      timeout = setTimeout(async () => {
        try {
          await Axios.get(process.env.HEARTBEAT_URL);
          websocket.close();
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 5000);
    });

    websocket.on("error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error: ${error}`));
    });

    websocket.on("close", (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket closed: ${error}`));
    });
  });

  return res.send("Finished");
};
