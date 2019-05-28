const nock = require('nock');
const request = require('supertest');
const slackin = require('../lib/index');

describe('slackin', () => {
  describe('POST /invite', () => {
    beforeEach(() => {
      nock('https://slack.com')
        .post('/api/users.list', 'token=mytoken&presence=1')
        .reply(200, {
          ok: true,
          members: [{}]
        });

      nock('https://slack.com')
        .post('/api/channels.list', 'token=mytoken')
        .reply(200, {
          ok: true,
          channels: [{}]
        });

      nock('https://slack.com')
        .post('/api/team.info', 'token=mytoken')
        .reply(200, {
          ok: true,
          team: {icon: {}}
        })
    });

    it("returns success for a successful invite", (done) => {
      let opts = {
        token: 'mytoken',
        org: 'myorg'
      };

      // TODO simplify mocking
      nock(`https://${opts.org}.slack.com`)
        .post('/api/users.admin.invite')
        .reply(200, { ok: true });

      let app = slackin(opts);

      request(app)
        .post('/invite')
        .send({ email: 'foo@example.com' })
        .expect('Content-Type', /json/)
        .expect(200, { msg: 'WOOT. Check your email!' })
        .end(done);
    });

    it("returns a failure for a failure message", (done) => {
      let opts = {
        token: 'mytoken',
        org: 'myorg'
      };

      // TODO simplify mocking
      nock(`https://${opts.org}.slack.com`)
        .post('/api/users.admin.invite')
        .reply(200, {
          ok: false,
          error: "other error"
        });

      let app = slackin(opts);

      request(app)
        .post('/invite')
        .send({ email: 'foo@example.com' })
        .expect('Content-Type', /json/)
        .expect(400, { msg: "other error" })
        .end(done);
    });
  });

  describe('GET /.well-known/acme-challenge/:id', () => {
    beforeEach(() => {
      process.env.LETSENCRYPT_CHALLENGE = 'letsencrypt-challenge';

      nock('https://slack.com')
        .post('/api/users.list', 'token=mytoken&presence=1')
        .reply(200, {
          ok: true,
          members: [{}]
        });

      nock('https://slack.com')
        .post('/api/channels.list', 'token=mytoken')
        .reply(200, {
          ok: true,
          channels: [{}]
        });

      nock('https://slack.com')
        .post('/api/team.info', 'token=mytoken')
        .reply(200, {
          ok: true,
          team: {icon: {}}
        })
    });

    it('returns the contents of the environment variable LETSENCRYPT_CHALLENGE', (done) => {
      let opts = {
        token: 'mytoken',
        org: 'myorg'
      };

      let app = slackin(opts);

      request(app)
        .get('/.well-known/acme-challenge/deadbeef')
        .expect(200, 'letsencrypt-challenge')
        .end(done);
    })
  });
});
