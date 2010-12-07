  /**
   * Creates a new SuperApp instance.
   * <br/><br/> The SuperApp constructor is very simple, it exposes 3 main methods for use:
   * <br/><br/> - addController() which adds you controller constructor function references to the app
   * <br/><br/> - run() which effectively starts the app by listening for hash changes and creating new
   * instances of the controllers.
   * <br/><br/> - setHash() which is a helper function to set the hash part of the url
   * @constructor 
   * @class
   * @name SuperApp
   */
  function Tyro(options) {
    this.controllers = [], this.routes = {};
    this.options = $.extend({
      pageNotFoundUrl: "/admin/page_not_found"
    }, options || {});
  }
  
  (function(p){
    /**
     * Add a controller to the app
     * @param {Function} fn The reference to the controller constructor function
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     */
    p.addController = function(fn) {
      this.controllers.push(fn);
    }
    
    /**
     * Run the application
     * <br/><br/> Behind the scenes this initialises the controllers and sets up a hash change listener
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     */
    p.run = function() {
      this._initControllers();
      this._setupHashChange();
    }
    
    /**
     * Create instances of each controller that has been added to the application
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
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
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     */
    p._setupHashChange = function() {
      var win = $(window);
      win.hashchange($.proxy(this._handleHashChange, this));
      win.hashchange();
    }
    
    /**
     * Handles the hash change event
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     */
    p._handleHashChange = function() {
      this._triggerRoute(this.getHash());
    }
    
    /**
     * Sets the hash portion of the Url programmatically
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     * @param {String} hash The new hash i.e. /admin/campaigns
     */
    p.setHash = function(hash) {
      document.location.hash = hash;
    }
    
    /**
     * Get the hash portion of the Url
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     * @returns {String} The hash portion of the url (without the hash)
     */
    p.getHash = function() {
      return document.location.hash.substr(1);
    }
    
    /**
     * Trigger the callbacks stored against a particular route
     * @exports p as SuperApp.prototype
     * @memberOf SuperApp#
     * @param {String} url The url i.e. "/admin/campaigns"
     */
    p._triggerRoute = function(url) {
      var matches = null;
      var urlFound = false;
      $.each(this.routes, function(i, route) {
        if(matches = url.match(route.regex)) {
          matches = matches.splice(1);
          $.each(route.callbacks, function(i, callback) {
            callback.apply(null, matches);
          });        
          urlFound = true;  
          return false;
        }
      });
      if(!urlFound) {
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
      route = route.replace("*", "[^\/]*");
    
      // replace : and any character but a slash with a matcher that matches any character but a slash one or more times
      route = route.replace(/:[^\/]*/g, "([^\/]+)");
    
      //return regex
      return new RegExp("^" + route + "\/?$");
    }
    
  })(Tyro.prototype);