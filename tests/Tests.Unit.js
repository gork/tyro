function stubFn(returnValue) {
  var fn = function () {
    fn.called = true;
    fn.args = arguments;
    fn.thisValue = this;
    fn.callCount++;
    return returnValue;
  };

  fn.called = false;
  fn.callCount = 0;

  return fn;
}

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
  var reg = t._routeToRegExp("/woop/:uuid/twooop").toString()
  //equals(t._routeToRegExp("/woop/:uuid/twooop").toString(), "/^/woop/([^/]+)/twooop/?$/", "The regex returned was correctly replaced.");
});

module("getParamsFromRoute()")

test("Get params from route returns object with param names as keys", function() {
  var t = new Tyro();
  var obj = t.getParamsFromRoute("/setup/:uuid/:whatever", "/setup/123/56d");
  equals(obj.uuid, "123");
  equals(obj.whatever, "56d");
})

module("_triggerRoute()");

test("Triggering a route that does not exist should set the hash to the pageNotFoundUrl (defined in the options property)", function() {
  var t = new Tyro();
  t.setHash = stubFn(); 
  t._triggerRoute();
  ok(t.setHash.called, "The setHash function was called.");
  equals(t.setHash.args[0], t.options.pageNotFoundUrl, "The first argument passed to setHash was the pageNotFoundUrl options property value.");
});

test("Triggering a route that exists should call the callback functions", function() {
  var t = new Tyro();
  var func1 = stubFn();
  t.addRoute("/my/url", func1);
  t._triggerRoute("/my/url");
  ok(func1.called, "The callback function was called.");
});

test("Triggering a route with a particular :param should pass the value to the callback.", function() {
  var t = new Tyro();
  var func1 = stubFn();
  var func2 = stubFn();
  t.addRoute("/admin/:uuid", func1);
  t.addRoute("/admin/:uuid/something/:whatever", func2);
  t._triggerRoute("/admin/1");
  t._triggerRoute("/admin/2345abc/something/fd54")
  equals(func1.args[0], "1", "The param was passed to the function.");  
  equals(func2.args[0], "2345abc", "The param was passed to the function.");  
  equals(func2.args[1], "fd54", "The param was passed to the function.");
});

module("_handleHashChange()");

test("Handling the hash change should call _triggerRoute()", function() {
  var t = new Tyro();
  t.getHash = stubFn("hello");
  t._triggerRoute = stubFn();
  t._handleHashChange();
  ok(t.getHash.called, "getHash() was called.");
  equals(t._triggerRoute.args[0], "hello", "The getHash() value was passed to _triggerRoute as the firsrt argument.");
});

module("_setupHashChange()", {
  setup: function() {
    this.origHashChange = $.fn.hashchange;
    $.fn.hashchange = stubFn();
  },
  teardown: function() {
    $.fn.hashchange = this.origHashChange;
  }
});

test("Setting up the hash change handler should call $('obj').hashchange", function() {
  var t = new Tyro();
  t._setupHashChange();  
  ok($.fn.hashchange.called, "The hashchange was called.");
  equals($.fn.hashchange.thisValue[0], window, "The 'this' value is a jQuery collection with the window object inside the first item.");
  equals($.fn.hashchange.callCount, 2, "The method should have been called twice.");
});

module("_initControllers()");

test("Initiating the controllers should loop through each controller constructor and create a new instance.", function() {
  var Controller1 = stubFn();
  var Controller2 = stubFn();
  var t = new Tyro();
  t.controllers = [Controller1, Controller2];
  t._initControllers();
  ok(Controller1.called, "Constructor invoked");
  notEqual(Controller1.thisValue, window, "The this value is not window - i.e. a new instance was created.");
  ok(Controller2.called, "Constructor invoked");
  notEqual(Controller2.thisValue, window, "The this value is not window - i.e. a new instance was created.");
});

module("run()");

test("Running the application should call _initControllers and _setupHashChange", function() {
  var t = new Tyro();
  t._initControllers = stubFn();
  t._setupHashChange = stubFn();
  t.run();
  ok(t._initControllers.called, "The _initControllers method was called.");
  ok(t._setupHashChange.called, "The _setupHashChange method was called.");
});

module("addFilter()");

test("Adding a filter adds the callbacks to the filters object", function() {
  var t = new Tyro();
  var func = stubFn();
  var func2 = stubFn();
  
  //t.addFilter("^/setup/([^\/]*)\/?([^\/]*)\/?$", func);
  
  t.addFilter("/setup/*", func);
  t.addRoute("/setup/:uuid", func2);
  t._triggerRoute("/setup/123/");
  
  ok(t.filters["/setup/*"], "The filter has been added to the filters collection.");
  ok(func.called, "The filter callback was called.");
});

test("2 Adding a filter adds the callbacks to the filters object", function() {
  var t = new Tyro();
  var func = stubFn();
  var func2 = stubFn();
  t.addFilter("/woop/*", func2)
  t.addRoute("/woop/wop/etc/so/on", func);
  t._triggerRoute("/woop/wop/etc/so/on");
  ok(t.filters["/woop/*"], "The filter has been added to the filters collection.");
  ok(func2.called, "The function was called for the second filter");
});

test("3 Adding a filter adds the callbacks to the filters object", function() {
  var t = new Tyro();
  var func = stubFn();
  var func2 = stubFn();
  t.addFilter("/nat/*", func2)
  t.addRoute("/nat/na/na/nah/:uuid", func);
  t._triggerRoute("/nat/na/na/nah/123d");
  ok(t.filters["/nat/*"], "The filter has been added to the filters collection.");
  ok(func2.called, "The function was called for the second filter");  
});