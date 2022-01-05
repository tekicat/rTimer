# Ably Realtime Monitor

This tool can be used to monitor the realtime message delivery on ably platform. This tool consists of two parts sender and receiver. 

**sender**: Sends messages to a channel and waits for response from the receiver to calculate the time to deliver message.
**reciver**: Receives the messages from the channel and responds back with received time.

## Initial Setup
* [Install NodeJS](https://heynode.com/tutorial/install-nodejs-locally-nvm/) 14.18.0 or higher
* Install the requied depnedencies with `npm install` in the root dir.
* Tested on NodeJS 14.18.0, may run on other versions

## To Run

`export ABLY_API_KEY="XXXX"`

```
node rTimer.js --help

rTimer.js [command]

Commands:
  rTimer.js sender [channelName]    Send Messages
  rTimer.js receiver [channelName]  Recieve Messages

Options:
      --help             Show help                                     [boolean]
      --version          Show version number                           [boolean]
  -u, --instanceId       Instance Id to identify sender
                                                     [string] [default: "Alice"]
  -n, --initialMessages  Intial Messages to send           [string] [default: 3]
  -i, --messageInterval  Interval between sending messages in ms
                                                        [string] [default: 5000]
  -t, --listenTimeoout   Listen Timeout for responses in ms
                                                       [string] [default: 30000]

Examples:
  rTimer.js sender rTimer -u Papa -i 6000   Send 100 meesages to rTimer as user
  -n 100 -t 40000                           Papa with 6 second interval with 40
                                            seconds timeout
  rTimer.js receiver rTimer -u Bob -i 3000  Receive meesages from rTimer as user
                                            Bob with 3 second message response
                                            interval
```
