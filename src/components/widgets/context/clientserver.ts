export interface Msg {
  who: "user" | "model";
  text: string;
}

export const CONVO: Msg[] = [
  { who: "user", text: "What's 2 plus 2?" },
  { who: "model", text: "4." },
  { who: "user", text: "Now times ten?" },
  { who: "model", text: "40." },
];

export type Dir = "none" | "toServer" | "toDevice";

export interface Frame {
  label: string;
  /** How many messages are shown on the device. */
  device: number;
  /** Which messages the server is holding right now (empty = it forgot). */
  serverHolds: number[];
  dir: Dir;
  payload: string;
}

export const FRAMES: Frame[] = [
  {
    label: "You type a message. Your device holds the whole conversation.",
    device: 1,
    serverHolds: [],
    dir: "none",
    payload: "",
  },
  {
    label: "The app sends the entire conversation to the server and asks what comes next.",
    device: 1,
    serverHolds: [0],
    dir: "toServer",
    payload: "1 message",
  },
  {
    label: "The server works out the reply and sends it back.",
    device: 2,
    serverHolds: [0],
    dir: "toDevice",
    payload: "reply: “4”",
  },
  {
    label: "Then the server forgets you. It keeps no memory between requests.",
    device: 2,
    serverHolds: [],
    dir: "none",
    payload: "",
  },
  {
    label: "You send another message. The app adds it and sends the whole conversation again — all of it.",
    device: 3,
    serverHolds: [0, 1, 2],
    dir: "toServer",
    payload: "3 messages",
  },
  {
    label: "The server replies.",
    device: 4,
    serverHolds: [0, 1, 2],
    dir: "toDevice",
    payload: "reply: “40”",
  },
  {
    label: "And forgets again. Every request stands alone — that is what stateless means.",
    device: 4,
    serverHolds: [],
    dir: "none",
    payload: "",
  },
];
