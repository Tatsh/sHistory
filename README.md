# Compatibility

* Internet Explorer 7+
* Firefox 3.6+
* Chrome
* Safari 5+

# How to use

Include like normal. The original code is also 100% compatible with Closure Compiler.

    // Bind your event listeners first
    // This callback takes no arguments
    sHistory.addEventListener(function () {
      // Get the page number, returns string
      sHistory.getState('page_number');

      // Get the page number, returns a number (int and integer do the same)
      sHistory.getState('page_number', 'number');

      // Get this value from the hash, returns boolean
      sHistory.getState('is_full_screen', 'boolean');

      // Get this value from the hash, returns a floating point number
      sHistory.getState('amount_of_money', 'float');

      // This value is not in the hash, so null is returned
      sHistory.getState('nonexistant');

      // This value is reserved for use with the fallback in IE7 and always returns null
      sHistory.getState('__t');

      // Push a state, adding to the current state
      sHistory.pushState('my_state', 1);

      // Push a boolean value
      sHistory.pushState('is_ok', true);
      // To retrieve this back as a boolean (and not as a string 'true'):
      sHistory.getState('is_ok', 'bool');

      // Push a state and remove all other states
      sHistory.pushState('page', 'begin', false);

      // Push a set of states, merging with the current state
      sHistory.pushStates({'page': 'begin', 'is_ok': true});

      // Push a set of states, removing all other states
      sHistory.pushStates({'page': 'begin', 'is_ok': true}, false);

      // Remove all states (hash changes to #)
      sHistory.removeState();
    });

    // Start the history (required)
    sHistory.start();
