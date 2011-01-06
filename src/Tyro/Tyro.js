/**
 * Creates a new Tyro instance.
 * <br/><br/> The Tyro constructor is very simple, it exposes 3 main methods for use:
 * <br/><br/> - addController() which adds you controller constructor function references to the app
 * <br/><br/> - run() which effectively starts the app by listening for hash changes and creating new
 * instances of the controllers.
 * <br/><br/> - setHash() which is a helper function to set the hash part of the url
 * @constructor 
 * @class
 * @name Tyro
 * @param {Object} options The options for the instance
 * @param {String} pageNotFoundUrl The url that the hash will be set to if a route cannot be matched. Null will mean the hash is unaffected.
 * @param {Function} routeMatched A function to be called when a route is matched.
 */
function Tyro(options) {
  this.controllers = [], this.routes = {};
  this.options = $.extend({
    pageNotFoundUrl: "/page_not_found",
    routeMatched: null
  }, options || {});
}

(function(p){
  /**
   * Add a controller to the app
   * @param {Function} fn The reference to the controller constructor function
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   */
  p.addController = function(fn) {
    this.controllers.push(fn);
  }
  
  /**
   * Run the application
   * <br/><br/> Behind the scenes this initialises the controllers and sets up a hash change listener
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   */
  p.run = function() {
    this._initControllers();
    this._setupHashChange();
  }
  
  /**
   * Create instances of each controller that has been added to the application
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   * @private
   */
  p._initControllers = function() {
    $.each(this.controllers, function(i, controller) {
      if(controller) new controller();
    });
  }
  
  /**
   * Sets up a hash change listener to handle url changes in the hash portion of the url.
   * It also triggers a change so that the initial view can be setup from current hash.
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   */
  p._setupHashChange = function() {
    var win = $(window);
    win.hashchange($.proxy(this._handleHashChange, this));
    win.hashchange();
  }
  
  /**
   * Handles the hash change event
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   */
  p._handleHashChange = function() {
    this._triggerRoute(this.getHash());
  }
  
  /**
   * Sets the hash portion of the Url programmatically
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   * @param {String} hash The new hash i.e. /admin/campaigns
   */
  p.setHash = function(hash) {
    document.location.hash = hash;
  }
  
  /**
   * Get the hash portion of the Url
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   * @returns {String} The hash portion of the url (without the hash)
   */
  p.getHash = function() {
    return document.location.hash.substr(1);
  }
  
  /**
   * Trigger the callbacks stored against a particular route
   * @exports p as Tyro.prototype
   * @memberOf Tyro#
   * @param {String} url The url i.e. "/admin/campaigns"
   */
  p._triggerRoute = function(url) {
    var matches = null;
    var urlFound = false;
    $.each(this.routes, $.proxy(function(i, route) {
      matches = url.match(route.regex);
      if(matches) {
        if(this.options.routeMatched) {
          this.options.routeMatched(url);
        }
        matches = matches.splice(1);
        $.each(route.callbacks, function(i, callback) {
          callback.apply(null, matches);
        });        
        urlFound = true;  
        return false;
      }
    }, this));
    if(!urlFound && this.options.pageNotFoundUrl) {
      this.setHash(this.options.pageNotFoundUrl);
    }
  }
  
  /**
   * Add a callback to fire when the url changes to this particular route
   * @function
   * @public
   * @param {String} route The route i.e. "/my/url"
   * @param {Function} callback 
   */
  p.addRoute = function(route, callback) {
    if(typeof route !== "string") {
      throw new TypeError("Tyro: addRoute: route should be a string");
    }
    if(typeof callback !== "function") {
      throw new TypeError("Tyro: addRoute: callback should be a function");
    }
    if(!this.routes[route]) {
      this.routes[route] = {
        regex: this._routeToRegExp(route),
        callbacks: []
      };
    }
    route = this.routes[route];
    route.callbacks.push(callback);
  }
  
  Tyro.prototype.getParamsFromRoute = function(route, url) {
    var params = {};
    var paramsMatcher = /:([\w\d]+)/g;
    paramsMatcher.lastIndex = 0; // ie bug - check out sammy
    var pathReplacer = "([^\/]+)";
    var queryStringMatcher = /\?([^#]*)$/;

    var param_names = [], path_match, path = route, path_params;
    while ((path_match = paramsMatcher.exec(route)) !== null) {
      param_names.push(path_match[1]);
    }
    // replace with the path replacement
    path = new RegExp("^" + path.replace(paramsMatcher, pathReplacer) + "$");

    if ((path_params = path.exec(url)) !== null) {

      // dont want the first bit
      path_params.shift();
      // for each of the matches
      $.each(path_params, function(i, param) {
        // if theres a matching param name
        if (param_names[i]) {
          // set the name to the match
          params[param_names[i]] = param;
        } else {
          // get splat code from sammy if/as you need it
        }
      });   

    }

    return params;
  }
    
  /**
   * This will take a route
   * i.e. /campaigns
   * i.e. /campaigns/add
   * i.e. /campaigns/:uuid
   * i.e. /campaigns/:uuid/edit
   * and create a regex to match on when routing
   *
   * When adding routes you must order as follows
   * addRoute("/admin/campigns/add") as this is more specific
   * addRoute("/admin/campaigns/:uuid") than this
   *
   * If you flipped the above to
   * addRoute("/admin/campaigns/:uuid")
   * addRoute("/admin/campigns/add")
   * then when the url is /admin/campaigns/add the /admin/campaigns/:uuid route will be incorrectly fired
   *
   */
  p._routeToRegExp = function(route) {
    // replace last / with empty string i.e. remove final slash if present
    route = route.replace(/\/$/, "");
  
    // replace * with anything but a forward slash zero or more times
    route = route.replace(/(^\*)|\/\*/, "[^\/]*");
  
    // replace : and any character but a slash with a matcher that matches any character but a slash one or more times
    route = route.replace(/([^\?]):[^\/]*/g, "$1([^\/]+)");
  
    //return regex
    return new RegExp("^" + route + "\/?$");
  }
  
})(Tyro.prototype);