var Tyro = Tyro || {};

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
Tyro.Routes = function(options) {
  this.controllers = [], this.routes = {}, this.filters = {};
  this.options = $.extend({
    pageNotFoundUrl: "/page_not_found",
    routeMatched: null
  }, options || {});
  this.previousUrl = null;
}

  /**
 * Add a controller to the app
 * @param {Function} fn The reference to the controller constructor function
 * @memberOf Tyro#
 */
Tyro.Routes.prototype.addController = function(fn) {
  this.controllers.push(fn);
}

/**
 * Run the application
 * <br/><br/> Behind the scenes this initialises the controllers and sets up a hash change listener
 * @memberOf Tyro#
 */
Tyro.Routes.prototype.run = function() {
  this.initControllers();
  this.setupHashChange();
}

/**
 * Create instances of each controller that has been added to the application
 * @memberOf Tyro#
 * @private
 */
Tyro.Routes.prototype.initControllers = function() {
  $.each(this.controllers, function(i, controller) {
    if(controller) new controller();
  });
}

/**
 * Sets up a hash change listener to handle url changes in the hash portion of the url.
 * It also triggers a change so that the initial view can be setup from current hash.
 * @memberOf Tyro#
 */
Tyro.Routes.prototype.setupHashChange = function() {
  var win = $(window);
  win.hashchange($.proxy(this.handleHashChange, this));
  win.hashchange();
}

/**
 * Handles the hash change event
 * @memberOf Tyro#
 */
Tyro.Routes.prototype.handleHashChange = function() {
  this.triggerRoute(this.getHash());
}

/**
 * Sets the hash portion of the Url programmatically
 * @memberOf Tyro#
 * @param {String} hash The new hash i.e. /admin/campaigns
 */
Tyro.Routes.prototype.setHash = function(hash) {
  document.location.hash = hash;
}

/**
 * Get the hash portion of the Url
 * @memberOf Tyro#
 * @returns {String} The hash portion of the url (without the hash)
 */
Tyro.Routes.prototype.getHash = function() {
  return document.location.hash.substr(1);
}

/**
 * Trigger the callbacks stored against a particular route
 * @memberOf Tyro#
 * @param {String} url The url i.e. "/admin/campaigns"
 */
Tyro.Routes.prototype.triggerRoute = function(url) {
  var matches = null, urlFound = false;
  
  // loop through all the routes
  $.each(this.routes, $.proxy(function(i, route) {
    matches = url.match(route.regex);
    // if the route was matched        
    if(matches) {   
      urlFound = true;   
      return this.handleRouteFound(url, route, matches);
    }
  }, this));
  
  // if the url has not been found (matched to a route)
  if(!urlFound && this.options.pageNotFoundUrl) {
    // go to the page not found url
    this.setHash(this.options.pageNotFoundUrl);
  }
  
}

/**
 * When a route has been found it is handled in this function which is responsible
 * for the following:
 * <br/> Running the "route matched" generic callback
 * <br/> Running the before filters
 * <br/> Running the route callbacks themselves (the primary task)
 * <br/> Running the after filters
 * @param {String} url The url that matched the route i.e. /my/url/123/abc
 * @param {Object} route The object containing route information including regex, path, beforeFilters and afterFilters
 * @param {Array} matches The parameters that were in the path (i.e. /my/url/:uuid1/:uuid2) The values for :uuid1 and :uuid2 will be in the array
 * @return {Boolean}
 */
Tyro.Routes.prototype.handleRouteFound = function(url, route, matches) {
  
  var params = this.getParamsFromRoute(route.route, url);
  
  // tell the routeMatched callback if present about the route
  if(this.options.routeMatched) {
    this.options.routeMatched(url);
  }
  
  //matches = matches.splice(1);

  // check the before filters before running the route callbacks
  if(route.beforeFilters) {
    var beforeFiltersSuccess = true;
    $.each(route.beforeFilters, function(i, func) {
      if(!func(params)) {
        beforeFiltersSuccess = false;
        return false;
      }
    });
  }
  if(!beforeFiltersSuccess) return false;
  
  // we now want to loop through generic filters that match the matched route
  // to see if we need to do anything before running the route callback
  // useful for setting up generic stuff
  var filterMatches = null;
  $.each(this.filters, $.proxy(function(i, filter) {
    filterMatches = url.match(filter.regex);
    if(filterMatches) {
      this.handleFilterFound(url, filter, filterMatches);
    }    
  }, this));
  
  // run each callback against the route
  $.each(route.callbacks, function(i, fn) {    
    fn.call(null, params);
  });
  
  // check the after filters after running the route callbacks
  if(route.afterFilters) {
    $.each(route.afterFilters, function(i, fn) {
      fn.call(null, params);
    });
  }
  
  this.previousUrl = url;
  return false;
}

Tyro.Routes.prototype.handleFilterFound = function(url, filter, matches) {
  $.each(filter.callbacks, $.proxy(function(i, fn){
    fn.apply(this, matches);
  }, this));
}

/**
 * Add a callback to fire when the url changes to this particular route
 * @function
 * @public
 * @param {String} route The route i.e. "/my/url"
 * @param {Function} callback 
 */
Tyro.Routes.prototype.addRoute = function(route, callback, options) {
  options = $.extend({
    beforeFilters: [],
    afterFilters: []
  }, options);
  
  if(typeof route !== "string") {
    throw new TypeError("Tyro: addRoute: route should be a string");
  }
  if(typeof callback !== "function") {
    throw new TypeError("Tyro: addRoute: callback should be a function");
  }
  if(!this.routes[route]) {
    this.routes[route] = {
      regex: this.routeToRegExp(route),
      callbacks: [],
      beforeFilters: options.beforeFilters,
      afterFilters: options.afterFilters,
      route: route
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
Tyro.Routes.prototype.routeToRegExp = function(route) {
  
  if(typeof route !== "string") return route;
  
  // replace last / with empty string i.e. remove final slash if present
  route = route.replace(/\/$/, "");

  // replace * with anything but a forward slash zero or more times
  route = route.replace('*', ".*");

  // replace : and any character but a slash with a matcher that matches any character but a slash one or more times
  route = route.replace(/([^\?]):[^\/]*/g, "$1([^\/]+)");

  //return regex
  return new RegExp("^" + route + "\/?(?:\\?(.*))?$");
}

/**
 * Get the params from the route and url. If the route is
 * /path/:uuid and the url is /path/123 then the params object
 * will be  { uuid: "123"}
 * @param {String} route The route i.e. /my/path/:uuid
 * @param {String} url The url i.e. /my/path/123
 * @returns {Object} The object keyed by route param names
 */
Tyro.Routes.prototype.getParamsFromRoute = function(route, url) {
  var params = {};
  var paramsMatcher = /:([\w\d]+)/g;
  paramsMatcher.lastIndex = 0; // ie bug - check out sammy
  var pathReplacer = "([^\/]+)";
  var queryStringMatcher = /\/?\?([^#]*)$/;
  
  // strip querystring but store key valued object ready to merge later
  // after we have converted the regular url params in an object
  var qs = url.match(queryStringMatcher);
  if(qs) {
    qs = qs[1];
    qs = $.unDelimit(qs);
  }
  else {
    qs = {};
  }
  
  url = url.replace(queryStringMatcher, '');

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
  
  params = $.extend(params, qs);
  return params;
}

/**
 * Add a filter for a particular route. This is a powerful method, because
 * when a route is matched, all the filters will be checked to see if any filters
 * also match the url. If they do, their callbacks will be called before the route
 * callback.
 * @param {String/RegExp} route The route for the filter to work on
 * @param {Function} callback The function to run when the filter route is matched
 * @memberOf Tyro
 * @public
 * @function
 * @example
 * var t = new Tyro();
 * t.addFilter("/some/place/*", function() {});
 * // so when the following route is matched, the filter callbacks will run first
 * t.addRoute("/some/place/123/456");
 * 
 */
Tyro.Routes.prototype.addFilter = function(route, callback) {
  if(!this.filters[route]) {
    this.filters[route] = { regex: this.routeToRegExp(route), callbacks: [] };
  }
  var filter = this.filters[route];
  filter.callbacks.push(callback);
}