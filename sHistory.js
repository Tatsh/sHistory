/*jshint scripturl:true, expr:true */
/**
 * Page state management. Uses real hashcange event if possible. Partially
 *   based on work by Ben Alman.<br>
 * To compile: <code>closure-compiler --warning_level VERBOSE --compilation_level ADVANCED_OPTIMIZATIONS --js sHistory.js --js export.js --output_wrapper "(function(){%output%}())" > shistory.min.js</code>
 *
 * @see http://benalman.com/projects/jquery-bbq-plugin/
 * @constructor
 * @returns {sHistory} The history object.
 * @license sHistory (c) 2012 Andrew Udvare | http://www.opensource.org/licenses/mit-license.php
 */
var sHistory = function () {
  if (!sHistory.hasNativeSupport) {
    // From ba-bbq
    /**
     * @param {string} [url]
     * @returns {string}
     * @private
     */
    var getFragment = function (url) {
      url = url || location.href;
      return '#' + url.replace(/^[^#]*#?(.*)$/, '$1');
    };

    // Create an iframe
    var iframe = document.createElement('iframe');
    iframe.setAttribute('tabindex', -1);
    iframe.setAttribute('title', 'empty');
    iframe.setAttribute('src', 'javascript:0');
    //iframe.setAttribute('id', 'shistory');
    iframe.style.display = 'none';

    // The original hash
    var lastHash = getFragment();

    // Some callbacks that will be defined fully upon loading the iframe
    var fnRet = function (v) { return v; };
    var getHistory = fnRet;
    var setHistory = fnRet;

    var callEventHandlers = function () {
      for (var i = 0; i < sHistory._eventListeners.length; i++) {
        sHistory._eventListeners[i]();
      }
    };

    // The polling callback
    var poll = function () {
      var hash = getFragment();
      var historyHash = getHistory();

      if (hash !== lastHash) {
        lastHash = hash;
        setHistory(lastHash, historyHash);

        // Call the event handlers
        callEventHandlers();
      }
      else if (historyHash !== lastHash) {
        // First hash change
        location.href = location.href.replace(/#.*/, '') + historyHash;
      }

      setTimeout(poll, 50);
    };
    // Upon the iframe loading, make sure we begin polling for hash changes
    var loadOnceCallback = function () {
      var contentIframe = iframe.contentWindow;

      // Define set/getHistory
      getHistory = function () {
        return getFragment(contentIframe.location.href);
      };
      setHistory = function (hash, historyHash) {
        if (hash !== historyHash) {
          var iframeDoc = contentIframe.document;
          //iframeDoc.title = document.title;
          iframeDoc.open(); // This triggers a history event
          iframeDoc.close();
          contentIframe.location.hash = hash;
        }
      };

      // Make the iframe's hash the same as the page's
      contentIframe.document.open();
      contentIframe.location.hash = location.hash;

      // Begin polling
      poll();

      // This is always called from .start() so call the event handlers
      //   for first hash event
      callEventHandlers();

      // Unbind
      if (iframe.detachEvent) {
        iframe.detachEvent('onload', loadOnceCallback);
      }
      else if (iframe.removeEventListener) {
        iframe.removeEventListener('load', loadOnceCallback);
      }
    };
    // Bind the one-time callback
    if (iframe.attachEvent) {
      iframe.attachEvent('onload', loadOnceCallback);
    }
    else if (iframe.addEventListener) {
      iframe.addEventListener('load', loadOnceCallback, false);
    }

    // Add the iframe to the page
    document.body.appendChild(iframe);

    if (document.attachEvent) {
      // Keep the title in sync so the history entries look nicer
      document.attachEvent('onpropertychange', function () {
        try {
          if (window.event.propertyName === 'title') {
            iframe.contentWindow.document.title = document.title;
          }
        }
        catch (e) {}
      });
    }
  }

  return this;
};
/**
 * If the browser supports the <code>hashchange</code> event natively.
 * @type boolean
 */
sHistory.hasNativeSupport = (function () {
  var mode = document.documentMode;
  return 'onhashchange' in window && (mode === undefined || mode > 7);
})();
/**
 * Just in case called incorrectly.
 * @private
 */
sHistory.prototype.constructor = function () {};
/**
 * Get full URI.
 * @private
 * @returns {string}
 */
sHistory._getFullURI = function () {
  var url = location.protocol + '//' + location.hostname + location.pathname;
  var qs = location.search ? location.search.substr(1) : '';

  if (qs) {
    url += '?' + qs;
  }

  return url;
};
/**
 * Push a state. Note that setting an empty state can cause a browser to
 *   scroll.
 * @param {string} stateKey State name to push. If merge is <code>true</code>,
 *   then this will replace the current state of the same key name. The
 *   <code>__t</code> key is reserved.
 * @param {string|boolean|number} stateValue Value to set.
 * @param {boolean} [merge=true] Whether or not to merge with the current
 *   state.
 */
sHistory.pushState = function (stateKey, stateValue, merge) {
  merge === undefined && (merge = true);

  if (stateKey === undefined || stateValue === undefined) {
    return;
  }

  if (stateKey === '__t') {
    return;
  }

  var url = sHistory._getFullURI();
  var hash = location.hash.replace(/^#&/, '#');
  var euc = encodeURIComponent;

  if (!hash) {
    hash = '#';
  }

  if (merge) {
    if (sHistory.getState(stateKey) !== null) {
      var keyValues = hash.substr(1).split('&'), split;
      for (var i = 0; i < keyValues.length; i++) {
        split = keyValues[i].split('=');
        if (split[0] === stateKey) {
          keyValues[i] = stateKey + '=' + euc(stateValue.toString());
        }
      }
      hash = '#' + keyValues.join('&');
    }
    else {
      if (location.hash) {
        hash += '&';
      }
      hash += stateKey + '=' + euc(stateValue.toString());
    }
  }
  else {
    hash = '#' + stateKey + '=' + euc(stateValue.toString());
  }

  location.href = url + hash;
};
/**
 * Push states. Note that the <code>__t</code> key is reserved.
 * @param {Object} stateObject Object of keys to values (string, number, or
 *   boolean).
 * @param {boolean} [merge=true] Whether or not to merge with the current
 *   state.
 */
sHistory.pushStates = function (stateObject, merge) {
  merge === undefined && (merge = true);
  stateObject === undefined && (stateObject = {});

  var euc = encodeURIComponent;
  var url = sHistory._getFullURI();
  var key, hash = '#';
  var keyValues;

  if (!location.hash || location.hash === '#') {
    merge = false;
  }

  if (merge) {
    // Compare the 2 objects, still need to keep order or 2 states would be pushed
    // TODO Make this more efficient.
    keyValues = location.hash.substr(1).split('&');
    var found = false, split;

    for (key in stateObject) {
      if (stateObject.hasOwnProperty(key)) {
        if (sHistory.getState(key) !== null) {
          for (var i = 0; i < keyValues.length; i++) {
            split = keyValues[i].split('=');
            if (split[0] === key) {
              if (stateObject[key] === true) {
                stateObject[key] = 'true';
              }
              else if (stateObject[key] === false) {
                stateObject[key] = 'false';
              }
              keyValues[i] = key + '=' + euc(stateObject[key]);
            }
          }
        }
        else {
          keyValues.push(key + '=' + euc(stateObject[key]));
        }
      }
    }

    hash += keyValues.join('&');
  }
  else {
    keyValues = [];

    for (key in stateObject) {
      if (stateObject.hasOwnProperty(key)) {
        // Reserved key
        if (key === '__t') {
          continue;
        }

        if (stateObject[key] === true) {
          stateObject[key] = 'true';
        }
        else if (stateObject[key] === false) {
          stateObject[key] = 'false';
        }

        keyValues.push(key + '=' + euc(stateObject[key]));
      }
    }

    hash = '#' + keyValues.join('&');
  }

  location.href = url + hash;
};
/**
 * Remove a state. If no arguments are passed, all states will be removed.
 * @param {string} [stateName] The state to remove.
 */
sHistory.removeState = function (stateName) {
  if (stateName === undefined) {
    location.href = sHistory._getFullURI() + '#';
    return;
  }

  if (sHistory.getState(stateName) !== null) {
    // Get the entire hash and remove this state
    var states = location.hash.substr(1).split('&');
    var toPush = {};
    for (var split, i = 0; i < states.length; i++) {
      split = states[i].split('=');
      if (split[0] === stateName) {
        continue;
      }

      toPush[split[0]] = decodeURIComponent(split[1]);
    }

    var length = 0;
    for (var key in toPush) {
      if (toPush.hasOwnProperty(key)) {
        length++;
      }
    }
    if (length === 0) {
      sHistory.removeState();
    }

    sHistory.pushStates(toPush, false);
  }
};
/**
 * Get a state by key name. If no arguments are passed, returns whether or not
 *   <code>location.hash</code> is empty.
 * @param {string} [key] Key to use. Case-sensitive.
 * @param {string} [castTo='string'] Cast to string, number (integer), float,
 *   boolean.
 * @param {string|number|boolean|null} [defaultValue] The default value to
 *   return if the value does not exist.
 * @returns {string|number|boolean|null} If <code>location.hash</code> is an
 *   empty string, the state value requrested, the default value if specified,
 *   or <code>null</code> if no such state exists.
 */
sHistory.getState = function (key, castTo, defaultValue) {
  if (arguments.length === 0) {
    if (location.hash.match(/^#__t=\d+$|^#$/)) {
      return false;
    }

    return !!location.hash;
  }

  if (!key || key === '__t') {
    return null;
  }

  castTo === undefined && (castTo = 'string');

  var keyValues = location.hash.substr(1).split('&');
  var split, ret = null, lcRet = null;
  var trues = {
    'true': 1,
    'on': 1,
    'yes': 1
  };
  var falses = {
    'false': 1,
    'no': 1,
    'off': 1
  };

  for (var i = 0; i < keyValues.length; i++) {
    split = keyValues[i].split('=');
    if (split[0] === key) {
      ret = decodeURIComponent(split[1]);
      lcRet = ret.toLowerCase();
      break;
    }
  }

  if (ret === null && defaultValue !== undefined) {
    return defaultValue;
  }

  if (castTo !== 'string') {
    switch (castTo) {
      case 'number':
      case 'integer':
      case 'int':
        ret = parseInt(ret, 10);
        if (isNaN(ret)) {
          ret = 0;
        }
        break;

      case 'float':
        ret = parseFloat(ret);
        break;

      case 'boolean':
      case 'bool':
        if (trues[lcRet] !== undefined) {
          return true;
        }
        else if (falses[lcRet] !== undefined) {
          return false;
        }
        return !!ret;
    }
  }

  return ret;
};
/**
 * Triggered first event.
 * @type boolean
 * @private
 */
sHistory._started = false;
/**
 * Dispatches first hashchange event.
 * @private
 */
sHistory._dispatchFirst = function () {
  var event;

  if (sHistory.hasNativeSupport) {
    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent('hashchange', true, false);
      window.dispatchEvent(event);
    }
    else {
      // For others, manually trigger the event by changing location.hash replacing __t with a new value
      var hash = location.hash;
      hash = hash.replace(/([\&\#])__t=+\d+\&?/, '$1');
      if (hash.length !== 1) { // would be '#'
        hash += '&';
      }
      // Fix any malformations
      hash = hash.replace(/([\&=])+/g, '$1').replace(/^\#\&/, '#');
      hash += '__t=' + (new Date()).getTime();
      location.hash = hash;
    }
  }
  else {
    sHistory();
  }
};
/**
 * Trigger the first <code>hashchange</code> event. Should be called once per
 *   page and only after all listeners have been registered using
 *   <code>sHistory.addEventListener</code>.
 * @param {string} [defaultState] The default state key name.
 * @param {string|number|boolean} [defaultStateValue] The default state value.
 */
sHistory.start = function (defaultState, defaultStateValue) {
  if (!sHistory._started) {
    if (defaultState !== undefined &&
        defaultStateValue !== undefined &&
        sHistory.getState(defaultState) === null) {
      // Simply trigger the first hash change with a value
      // IE cannot do this, so call sHistory() to initialise the polling
      if (!sHistory.hasNativeSupport) {
        sHistory();
      }

      sHistory.pushState(defaultState, defaultStateValue);
    }
    else {
      sHistory._dispatchFirst();
    }

    sHistory._started = true;
  }
};
/**
 * @private
 * @type Array
 */
sHistory._eventListeners = [];
/**
 * Add an event listener. These are called every time the hash changes, which
 *   means that if one key changes but another state stays the same, then all
 *   listeners will still be called.
 * <p>If you want to prevent the callback from running repetitively, save the
 *   last state value outside of the function and make sure it is different
 *   within the callback before the callback can continue.</p>
 * @param {function()} func Callback.
 */
sHistory.addEventListener = function (func) {
  if (!sHistory.hasNativeSupport) {
    sHistory._eventListeners.push(func);
    return;
  }

  if (window.addEventListener) {
    window.addEventListener('hashchange', func, false);
  }
  else if (window.attachEvent) {
    window.attachEvent('onhashchange', func);
  }
};
