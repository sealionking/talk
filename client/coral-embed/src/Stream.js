/* global __webpack_public_path__ */ // eslint-disable-line no-unused-vars

import queryString from 'querystringify';
import pym from 'pym.js';
import EventEmitter from 'eventemitter2';
import { buildUrl } from 'coral-framework/utils/url';
import Snackbar from './Snackbar';
import onIntersect from './onIntersect';
import {
  createStorage,
  connectStorageToPym,
} from 'coral-framework/services/storage';

const NOTIFICATION_OFFSET = 200;

// Ensure there is a trailing slash.
function ensureEndSlash(p) {
  return p.match(/\/$/) ? p : `${p}/`;
}

// Build the URL to load in the pym iframe.
function buildStreamIframeUrl(talkBaseUrl, query) {
  let url = talkBaseUrl + 'embed/stream?';

  url += queryString.stringify(query);

  return url;
}

// Get dimensions of viewport.
function viewportDimensions() {
  let e = window,
    a = 'inner';
  if (!('innerWidth' in window)) {
    a = 'client';
    e = document.documentElement || document.body;
  }

  return {
    width: e[`${a}Width`],
    height: e[`${a}Height`],
  };
}

export default class Stream {
  constructor(el, talkBaseUrl, query, config) {
    this.query = query;

    // Extract the non-opts opts from the object.
    const {
      events = null,
      snackBarStyles = null,
      onAuthChanged = null,
      talkStaticUrl = talkBaseUrl,
      ...opts
    } = config;

    this.onAuthChanged = onAuthChanged;
    this.el = el;
    this.talkBaseUrl = ensureEndSlash(talkBaseUrl);
    this.talkStaticUrl = ensureEndSlash(talkStaticUrl);
    this.opts = opts;
    this.snackBar = new Snackbar(snackBarStyles || {});
    this.emitter = new EventEmitter({ wildcard: true });

    // Because we're loading chunks dynamically below, we need to point to the
    // static URL.
    //
    // The __webpack_public_path__ can be referenced:
    // https://webpack.js.org/configuration/output/#output-publicpath
    //
    __webpack_public_path__ = this.talkStaticUrl + 'static/';

    // Attach to the events emitted by the pym parent.
    if (events) {
      events(this.emitter);
    }
    if (config.lazy || process.env.TALK_DEFAULT_LAZY_RENDER === 'TRUE') {
      const renderOnIntersect = () => onIntersect(this.el, () => this.render());
      if (!window.IntersectionObserver) {
        // Include a polyfill for the intersection observer.
        import('intersection-observer')
          .then(() => {
            // Polyfill applied.
            renderOnIntersect();
          })
          .catch(e => {
            console.error(e);
            // Loading polyfill failed, just render it directly.
            this.render();
          });
      } else {
        // No need for polyfill.
        renderOnIntersect();
      }
    } else {
      this.render();
    }
  }

  assertRendered() {
    if (!this.pym) {
      throw new Error('Stream Embed must be rendered first');
    }
  }

  isRendered() {
    return !!this.pym;
  }

  render() {
    if (this.pym) {
      throw new Error('Stream Embed already rendered');
    }
    this.pym = new pym.Parent(
      this.el.id,
      buildStreamIframeUrl(this.talkBaseUrl, this.query),
      {
        title: this.opts.title,
        id: `${this.el.id}_iframe`,
        name: `${this.el.id}_iframe`,
      }
    );

    // Workaround: IOS Safari ignores `width` but respects `min-width` value.
    this.pym.el.firstChild.style.width = '1px';
    this.pym.el.firstChild.style.minWidth = '100%';

    // Resize parent iframe height when child height changes
    let cachedHeight;
    this.pym.onMessage('height', height => {
      if (height !== cachedHeight) {
        this.pym.el.firstChild.style.height = `${height}px`;
        cachedHeight = height;
      }
    });

    this.pym.onMessage('getConfig', () => {
      this.pym.sendMessage('config', JSON.stringify(this.opts));
    });

    // If the auth changes, and someone is listening for it, then re-emit it.
    if (this.onAuthChanged) {
      this.pym.onMessage('coral-auth-changed', message => {
        this.onAuthChanged(message ? JSON.parse(message) : null);
      });
    }

    // Attach the snackbar to the pym parent and to the body of the page.
    this.snackBar.attach(window.document.body, this.pym);

    // Remove the permalink comment id from the hash.
    this.pym.onMessage('coral-view-all-comments', () => {
      const query = queryString.parse(location.search);

      // Remove the commentId url param.
      delete query.commentId;

      const search = queryString.stringify(query);

      const url = buildUrl({ ...location, search });

      // Change the url.
      window.history.replaceState({}, document.title, url);
    });

    // Remove the permalink comment id from the hash.
    this.pym.onMessage('coral-view-comment', id => {
      const search = queryString.stringify({
        ...queryString.parse(location.search),
        commentId: id,
      });

      // Remove the commentId url param.
      const url = buildUrl({ ...location, search });

      // Change the url.
      window.history.replaceState({}, document.title, url);
    });

    // Helps child show notifications at the right scrollTop.
    this.pym.onMessage('getPosition', () => {
      const { height } = viewportDimensions();
      let position = height + document.body.scrollTop;

      if (position > NOTIFICATION_OFFSET) {
        position = position - NOTIFICATION_OFFSET;
      }

      this.pym.sendMessage('position', position);
    });

    // When end-user clicks link in iframe, open it in parent context
    this.pym.onMessage('navigate', url => {
      window.open(url, '_blank').focus();
    });

    // Pass events from iframe to the event emitter.
    this.pym.onMessage('event', raw => {
      const { eventName, value } = JSON.parse(raw);
      this.emitter.emit(eventName, value);
    });

    // If the user clicks outside the embed, then tell the embed.
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Listens to local storage requests on pym and relay it to local storage.
    connectStorageToPym(
      createStorage('localStorage'),
      this.pym,
      'localStorage'
    );

    // Listens to session storage requests on pym and relay it to session storage.
    connectStorageToPym(
      createStorage('sessionStorage'),
      this.pym,
      'sessionStorage'
    );
  }

  enablePluginsDebug() {
    this.assertRendered();
    this.pym.sendMessage('enablePluginsDebug');
  }

  disablePluginsDebug() {
    this.assertRendered();
    this.pym.sendMessage('disablePluginsDebug');
  }

  login(token) {
    this.assertRendered();
    this.pym.sendMessage('login', token);
  }

  logout() {
    this.assertRendered();
    this.pym.sendMessage('logout');
  }

  remove() {
    this.assertRendered();
    // Remove the event listeners.
    document.removeEventListener('click', this.handleClick.bind(this));
    this.emitter.removeAllListeners();

    // Remove the snackbar.
    this.snackBar.remove();

    // Remove the pym parent.
    this.pym.remove();
  }

  handleClick() {
    this.assertRendered();
    this.pym.sendMessage('click');
  }
}
