const { WebClient } = require('@slack/web-api');
const EventEmitter = require('events');

module.exports = class SlackData extends EventEmitter {
  constructor({ token, interval, org: host }) {
    super();
    this.host = host;
    this.token = token;
    this.interval = interval;
    this.ready = false;
    this.org = {};
    this.users = {};
    this.channelsByName = {};

    this.client = new WebClient(token);

    this.init();
    this.fetch();
  }

  init() {
    this.client.channels.list().then(({ channels }) => {
      (channels || []).forEach(channel => {
        this.channelsByName[channel.name] = channel;
      });
    });

    this.client.team.info().then(({ team }) => {
        if (!team) {
          throw new Error(
            'Bad Slack response. Make sure the team name and API keys are correct'
          );
        }
        this.org.name = team.name;
        if (!team.icon.image_default) {
          this.org.logo = team.icon.image_132;
        }
    });
  }

  fetch() {
    this.client.users.list({ presence: 1 }).then(({ members }) => {
      if (!members || !members.length) {
        let err = new Error('Invalid Slack response: no members');
        this.emit('error', err);
        return this.retry();
      }

      // remove slackbot and bots from users
      // slackbot is not a bot, go figure!
      const users = members.filter(x => {
        return x.id != 'USLACKBOT' && !x.is_bot && !x.deleted;
      });

      let total = users.length;
      let active = users.filter(user => {
        return 'active' === user.presence;
      }).length;

      if (this.users) {
        if (total != this.users.total) {
          this.emit('change', 'total', total);
        }
        if (active != this.users.active) {
          this.emit('change', 'active', active);
        }
      }

      this.users.total = total;
      this.users.active = active;

      if (!this.ready) {
        this.ready = true;
        this.emit('ready');
      }

      setTimeout(this.fetch.bind(this), this.interval);
      this.emit('data');
    });
    this.emit('fetch');
  }

  getChannelId(name) {
    let channel = this.channelsByName[name];
    return channel ? channel.id : null;
  }

  retry(interval = this.interval * 2) {
    setTimeout(this.fetch.bind(this), interval);
    this.emit('retry');
  }
}
