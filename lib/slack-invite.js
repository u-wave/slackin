const request = require('superagent');

module.exports = async function invite({ org, token, email, channel }) {
  let data = { email, token };

  if (channel) {
    data.channels = channel;
    data.ultra_restricted = 1;
    data.set_active = true;
  }

  const res = await request
    .post(`https://${org}.slack.com/api/users.admin.invite`)
    .type('form')
    .send(data);

  if (200 != res.status) {
    throw new Error(`Invalid response ${res.status}.`);
  }

  // If the account that owns the token is not admin, Slack will oddly
  // return `200 OK`, and provide other information in the body. So we
  // need to check for the correct account scope and call the callback
  // with an error if it's not high enough.
  let { ok, error: providedError, needed } = res.body;
  if (!ok) {
    if (providedError === 'missing_scope' && needed === 'admin') {
      throw new Error(`Missing admin scope: The token you provided is for an account that is not an admin. You must provide a token from an admin account in order to invite users through the Slack API.`);
    } else if (providedError === 'already_invited') {
      throw new Error('You have already been invited to Slack. Check for an email from feedback@slack.com.');
    } else if (providedError === 'already_in_team') {
      throw new Error(`Sending you to Slack...`);
    } else {
      throw new Error(providedError);
    }
  }
}
