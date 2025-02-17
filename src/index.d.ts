import { ChildProcess } from "child_process"

declare module "minecraft-bedrock-server" {
  function getLatestVersions(): Promise<{
    id: string,
    type: string,
    url: string,
    time: string,
    releaseTime: string
  }[]>

  type GameMode = "survival" | "creative" | "adventure";
  type Difficulty = "peaceful" | "easy" | "normal" | "hard";
  type PermissionLevel = "visitor" | "member" | "operator";

  type ServerOptions = {
    "server-name"?: string; // Used as the server name
    "gamemode"?: GameMode; // Sets the game mode for new players
    "force-gamemode"?: boolean; // Prevents the server from sending to the client gamemode values other than the gamemode value saved by the server during world creation
    "difficulty"?: Difficulty; // Sets the difficulty of the world
    "allow-cheats"?: boolean; // If true then cheats like commands can be used
    "max-players"?: number; // The maximum number of players that can play on the server
    "online-mode"?: boolean; // If true then all connected players must be authenticated to Xbox Live
    "white-list"?: boolean; // If true then all connected players must be listed in the separate whitelist.json file
    "server-port"?: number; // Which IPv4 port the server should listen to
    "server-portv6"?: number; // Which IPv6 port the server should listen to
    "view-distance"?: number; // The maximum allowed view distance in number of chunks
    "tick-distance"?: number; // The world will be ticked this many chunks away from any player
    "player-idle-timeout"?: number; // After a player has idled for this many minutes they will be kicked
    "max-threads"?: number; // Maximum number of threads the server will try to use
    "level-name"?: string; // Name of the level
    "level-seed"?: string; // Use to randomize the world
    "default-player-permission-level"?: PermissionLevel; // Permission level for new players joining for the first time
    "texturepack-required"?: boolean; // Force clients to use texture packs in the current world
    "content-log-file-enabled"?: boolean; // Enables logging content errors to a file
    "compression-threshold"?: number; // Determines the smallest size of raw network payload to compress
    "server-authoritative-movement"?: "client-auth" | "server-auth" | "server-auth-with-rewind"; // Enables server authoritative movement
    "player-movement-score-threshold"?: number; // The number of incongruent time intervals needed before abnormal behavior is reported
    "player-movement-distance-threshold"?: number; // The difference between server and client positions that needs to be exceeded before abnormal behavior is detected
    "player-movement-duration-threshold-in-ms"?: number; // The duration of time the server and client positions can be out of sync before the abnormal movement score is incremented
    "correct-player-movement"?: boolean; // If true, the client position will get corrected to the server position if the movement score exceeds the threshold
    "server-authoritative-block-breaking"?: boolean; // If true, the server will compute block mining operations in sync with the client
    // continue from above server.properties that are not yet in type list
    "use-native-transport"?: boolean; // If true, the server will use the native transport (EPOLL on Linux, KQUEUE on OSX, IOCP on Windows)

  };
  type ServerOptionsEx = ServerOptions & {
    path?: string, // where to save the folder
    root?: string // where the path is relative to (eg dirname)
  }

  // Downloads the server jar
  function downloadServer(version: string, options: ServerOptionsEx): Promise<{ path: string, version: string }>

  // Starts the server
  // Options is an array of server.properties options.
  // `options.path` is the path to where the server will be started.
  function startServer(version: string, onStart: () => void, options: ServerOptionsEx): Promise<ChildProcess>

  // Starts the server and waits
  function startServerAndWait(version: string, withTimeout: number, options: ServerOptionsEx): Promise<ChildProcess>

  // Starts the server and waits. On failure, reset state and try again once more.
  function startServerAndWait2(version: string, withTimeout: number, options: ServerOptionsEx): Promise<ChildProcess>
}