const nock = require('nock');
const assert = require('assert');
const invite = require('../lib/slack-invite');

describe('slack-invite', () => {
  describe('.invite()', () => {
    var opts;

    before(() => {
      opts = {
        channel: 'mychannel',
        email: 'user@example.com',
        org: 'myorg',
        token: 'mytoken'
      };
    });

    it("succeeds when ok", async () => {
      nock(`https://${opts.org}.slack.com`).
        post('/api/users.admin.invite').
        reply(200, { ok: true });

      await invite(opts);
    });

    it("passes along an error message", async () => {
      nock(`https://${opts.org}.slack.com`).
        post('/api/users.admin.invite').
        reply(200, {
          ok: false,
          error: "other error"
        });

      await assert.rejects(() => invite(opts), { message: "other error" });
    });
  });
});
