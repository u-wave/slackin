/* global io,data */

(function() {
  // give up and resort to `target=_blank`
  // if we're not modern enough
  if (
    !document.body.getBoundingClientRect ||
    !document.body.querySelectorAll ||
    !window.postMessage
  ) {
    return;
  }

  // the id for the script we capture
  var id;

  // listen on setup event from the parent
  // to set up the id
  window.addEventListener('message', function onmsg(e) {
    if (/^slackin:/.test(e.data)) {
      id = e.data.replace(/^slackin:/, '');
      document.body.addEventListener('click', function(ev) {
        var el = ev.target;
        while (el && 'A' != el.nodeName) el = el.parentNode;
        if (el && '_blank' === el.target) {
          ev.preventDefault();
          parent.postMessage('slackin-click:' + id, '*');
        }
      });
      window.removeEventListener('message', onmsg);

      // notify initial width
      refresh();
    }
  });

  // notify parent about current width
  var button = document.querySelector('.slack-button');
  var lastWidth;
  function refresh() {
    var width = button.getBoundingClientRect().width;
    if (top != window && window.postMessage) {
      var but = document.querySelector('.slack-button');
      width = Math.ceil(but.getBoundingClientRect().width);
      if (lastWidth != width) {
        lastWidth = width;
        parent.postMessage('slackin-width:' + id + ':' + width, '*');
      }
    }
  }

  if (typeof EventSource !== 'function') {
    var script = document.createElement('script');
    script.src = '/assets/eventsource.js';
    script.onload = connectEvents;
  } else {
    connectEvents();
  }
  function connectEvents() {
    // use dom element for better cross browser compatibility
    var url = document.createElement('a');
    url.href = window.location;
    var events = new EventSource(data.path + '/events');
    var count = document.getElementsByClassName('slack-count')[0];

    events.on('total', function(event) {
      update('total', event.data);
    });
    events.on('active', function(event) {
      update('active', event.data);
    });

    var anim;
    function update(key, n) {
      if (n != data[key]) {
        data[key] = n;
        var str = '';
        if (data.active) str = data.active + '/';
        if (data.total) str += data.total;
        if (!str.length) str = '–';
        if (anim) clearTimeout(anim);
        count.innerHTML = str;
        count.className = 'slack-count anim';
        anim = setTimeout(function() {
          count.className = 'slack-count';
        }, 200);
        refresh();
      }
    }
  }
  document.body.appendChild(script);
})();
