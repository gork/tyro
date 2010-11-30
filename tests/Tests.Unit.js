module("new Tyro()");

test("Tyro is a constructor function", function() {
  equals(typeof Tyro, "function", "Tyro is of type function.");
});

test("A new Tyro application should have no controllers", function() {
	var t = new Tyro();
	equals(t.controllers.length, 0, "The controllers array is empty");
});

test("A new Tyro application should have no routes", function() {
	var t = new Tyro();
	ok($.isEmptyObject(t.routes), "The routes object is empty");
});

test("A new Tyro application should have a default pageNotFoundUrl option setting", function() {
	var t = new Tyro();
	equals(typeof t.options.pageNotFoundUrl, "string", "The default pageNotFoundUrl option is a string.");
});

module("addController()");

test("Adding a controller should add it to the controllers array", function() {
	var t = new Tyro();
	var func = function() {};
	t.addController(func);
	equals(t.controllers[0], func, "The array contains the function that was added.");
});

module("addRoute()", {
  setup: function() {
    this.t = new Tyro();
  },
  teardown: function() {
    this.t = null;
    delete this.t;
  }
});

test("Adding a route and callback should add it to the routes collection object", function() {
  var t = this.t;
  var func = function() {};
  var url = "/my/url";
  t.addRoute("/my/url", func);
  ok(t.routes.hasOwnProperty(url), "The routes collection object has a property key of '/my/url'.")
  equals(t.routes[url].callbacks[0], func, "The function was added to the callbacks array on the route item.");
  ok(t.routes[url].regex instanceof RegExp), "The regex property is an instance of a regular expression.";
});

test("Adding a route without any arguments should throw an exception.", function() {
  var t = this.t;
  raises(function() {
    t.addRoute();
  }, "An exception was raised.");
});

test("Adding a route with an invalid url (not a string) should throw an exception", function() {
  var t = this.t;
  raises(function() {
    t.addRoute(true);
  }, "An exception was raised.")
});

test("Adding a route with a valid url but invalid callback type should throw an exception", function() {
  var t = this.t;
  raises(function() {
    t.addRoute("/my/url", 1);
  }, "An exception was raised.")
});


test("Adding two callbacks to the same route url should only create one route item, but add two callbacks", function() {
  var t = this.t;
  var func1 = function() {};
  var func2 = function() {};
  var url = "/my/url";
  t.addRoute(url, func1);
  t.addRoute(url, func2);
  var routePropCount = 0;
  for(var p in t.routes) {
    routePropCount++;
  }
  equals(routePropCount, 1, "Only one route item is created.");
  equals(t.routes[url].callbacks.length, 2);
});

module("getHash()");

test("Getting the hash, should get the hash value from the document location without the # character", function() {
  var t = new Tyro();
  document.location.hash = "woop";
  equals("woop", t.getHash(), "The value returned should be woop.");
});

module("setHash()");

test("Setting hash, should change the hash value in document.location", function() {
  var t = new Tyro();
  t.setHash("woop2");
  equals(document.location.hash.substr(1), "woop2", "The document.location.hash value (without the #) is woop2.")
});

module("_routeToRegExp()");

test("Converting a route to a regex, should return a correctly formed regex", function() {
  var t = new Tyro();
  equals(t._routeToRegExp("/woop/:uuid/twooop"), "/^/woop/([^/]+)/twooop/?$/", "The regex returned was correctly replaced.");
});







