var ably = require('ably')
var uuid = require('uuid')
var microtime = require('microtime')
var math = require('mathjs')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

yargs(hideBin(process.argv))
  .command('sender [channelName]', 'Send Messages', (yargs) => {
    return yargs
      .positional('channelName', {
        describe: 'Channel Name to publish messages',
        default: 'rTimer'
      })
  }, (argv) => {
    if (argv.verbose) console.info(`Publishing Messages to :${argv.channelName}`)
    sender(argv)
  })
  .command('receiver [channelName]', 'Recieve Messages', (yargs) => {
    return yargs
      .positional('channelName', {
        describe: 'Channel Name to subscribe/listen for messages',
        default: 'rTimer'
      })
  }, (argv) => {
    if (argv.verbose) console.info(`Listening for Messages on :${argv.channelName}`)
    receiver(argv)
  })
  .example('$0 sender rTimer -u Papa -i 6000 -n 30 -t 40000', 'Send 100 meesages to rTimer as user Papa with 6 second interval with 40 seconds timeout')
  .example('$0 receiver rTimer -u Bob -i 3000 ', 'Receive meesages from rTimer as user Bob with 3 second message response interval')
  .option("instanceId", {
    alias: "u",
    type: "string",
    default: 'Alice',
    normalize: true,
    describe: "Instance Id to identify sender",
  })
  .option("initialMessages", {
    alias: "n",
    default: 3,
    type: "number",
    normalize: true,
    describe: "Intial Messages to send",
  })
  .option("messageInterval", {
    alias: "i",
    default: 5000,
    type: "number",
    normalize: true,
    describe: "Interval between sending messages in ms",
  })
  .option("listenTimeoout", {
    alias: "t",
    default: 30000,
    type: "number",
    normalize: true,
    describe: "Listen Timeout for responses in ms",
  })
  .argv;

function init(args) {
  var ablyApiKey = process.env.ABLY_API_KEY || null

  if (!ablyApiKey) {
    console.log("Missing ABLY_API_KEY environment variable.!")
    process.exit(1)
  }

  var ably = new require('ably').Realtime(ablyApiKey)

  ably.connection.on('connected', function () {
    console.log("Connected Successfully to Ably")
  });

  ably.connection.on('failed', function () {
    console.log("Connection to Ably Failed.!!")
    process.exit(1)
  });

  var client = ably.channels.get(args.channelName)
  return client
}

function sender(args) {
  // Publish the message to Timer
  var channel = init(args)
  channel.attach(function (err) {
    if (err) { return console.error("Channel attach failed", err) }
    for (let i = 0; i < args.initialMessages; i++) {
      var data = { id: uuid.v4(), from: args.instanceId, sent: microtime.now() }
      /* Channel is now created, so the publish can happen immediately as the channel is "ready" */
      channel.publish('Timer', data, function (err) {
        if (err) { return console.error("publish failed with error ", err) }
        setTimeout(() => { }, args.messageInterval);
      });
    }
  });

  var preRtt = {}

  // Subscribe to messages on Timer
  channel.subscribe('Responder', function (message) {
    // console.log(message.data)
    var data = message.data
    if (!preRtt[data.from]) {
      preRtt[data.from] = []
    }
    preRtt[data.from].push(data.received - data.sent)
  });

  setTimeout(function () {
    // console.log(rtt)
    var rtt = []
    for (const [user, rtts] of Object.entries(preRtt)) {
      // console.log(user, math.min(...rtts), math.max(...rtts), math.median(...rtts) )
      rtt.push({ User: user, Min: math.min(...rtts), Max: math.max(...rtts), Median: math.median(...rtts), SampleSize: rtts.length })
    }
    if (rtt.length > 0) {
      console.table(rtt)
      console.log("** Min, Max, Median are in micro seconds")
    } else {
      console.log(`No Response Received in ${args.listenTimeoout}ms`)
    }
    process.exit(0)
  }, args.listenTimeoout);
}

function receiver(args) {
  var channel = init(args)
  // Subscribe to messages on Timer
  channel.subscribe('Timer', function (message) {
    console.log(message.data)
    var data = message.data
    // Publish the message to Timer
    channel.attach(function (err) {
      if (err) { return console.error("Channel attach failed", err) }
      var resp = { id: data.id, from: args.instanceId, sent: data.sent, received: microtime.now() }
      /* Channel is now created, so the publish can happen immediately as the channel is "ready" */
      channel.publish('Responder', resp, function (err) {
        if (err) { return console.error("publish failed with error ", err) }
        setTimeout(() => { }, args.messageInterval);
      });
    });
  });
}