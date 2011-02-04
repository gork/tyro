var fixtures = {};
fixtures.main = {	
	"loggedOut": {
		id:"loggedOut",
		view: {
			render: function() {},
			teardown: function() {},
			container: "some container"
		},
		active: false,
		partialViewId: null,
		childViews: []
	},
	"loggedIn": {
		id:"loggedIn",
		view: {
			render: function() {},
			teardown: function() {},
			container: "some container"
		},
		active: false,
		partialViewId: null,
		childViews: []
	},
	"dashboard": {
		id:"dashboard",
		view: {
			render: function() {},
			teardown: function() {},
			container: "some container"
		},
		active: false,
		partialViewId: "loggedIn",
		childViews: []
	},
	"setup": {
		id: "setup",
		view: {
			render: function() {},
			teardown: function() {},
			container: "some container"
		},
		active: false,
		partialViewId: "loggedIn",
		childViews: []
	},
	"campaigns": {
		id: "campaigns",
		view: {
			render: function() {},
			teardown: function() {},
			container: "some container"
		},
		active: false,
		partialViewId: "setup",
		childViews: []
	}
}



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

module("new Tyro.PageController()");

test("Tyro.PageController is a constructor function", function() {
  equals(typeof Tyro.PageController, "function", "Tyro.PageController is of type function.");
});

test("Each instance has a partialViews object.", function() {
  var pc = new Tyro.PageController();
	equals(typeof pc.partialViews, "object");
});

module("Tyro.addPartialView()");

test("The instance has a addPartialView() method", function() {
	var pc = new Tyro.PageController();
	equals(typeof pc.addPartialView, "function");
});

test("Adding a partial view with no arguments throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView();
	}, "raised");
});

test("Adding a partial view without the an id property throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({});
	}, "raised");
});

test("Adding a partial view without an active property throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup"		
		});
	}, "raised");
});

test("Adding a partial view without a partialViewId property throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true
		});
	}, "raised");
});
test("Adding a partial view without a childViews array property throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true,
			partialViewId: "loggedIn"
		});
	}, "raised");
});

test("Adding a partial view without a view property throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true,
			partialViewId: "loggedIn",
			childViews: []
		});
	}, "raised");
});

test("Adding a partial view with a view property but doesnt have correct members throws an error", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true,
			partialViewId: "loggedIn",
			childViews: [],
			view: {}
		});
	}, "raised");
	
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true,
			partialViewId: "loggedIn",
			childViews: [],
			view: {render: function() {}}
		});
	}, "raised");
	
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true,
			partialViewId: "loggedIn",
			childViews: [],
			view: {render: function() {}, teardown: function() {}}
		});
	}, "raised");
	
});

test("Adding a partialView should add it to the partialViews collection on the instance", function() {
	var pc = new Tyro.PageController();
	pc.addPartialView({
		id: "setup",
		active: false,
		partialViewId: "loggedIn",
		childViews: [],
		view: {
			render: function() {},
			container: "#main",
			teardown: function() {}
		}
	});
	
	equals(typeof pc.partialViews["setup"], "object");
	
});

module("getPartialViewsChildrenActive()");

test("Invoking this method returns the active partial views for this particular partialViewId", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true,{}, fixtures.main);
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	
	var result = pc.getPartialViewsChildrenActive("loggedIn");
	equals(result[0], pc.partialViews["campaigns"]);
	equals(result[1], pc.partialViews["setup"]);
});

test("Invoking this method returns the active partial views for this particular partialViewId", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	
	var result = pc.getPartialViewsChildrenActive("setup");
	equals(result[0], pc.partialViews["campaigns"]);
	
	var result2 = pc.getPartialViewsChildrenActive("campaigns");
	equals(result2.length, 0);
	
});

module("getPartialViewsNonAttachedActive()");

test("Getting non attached partial views when there are none should return an empty array", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	var result = pc.getPartialViewsNonAttachedActive();
	ok($.isArray(result));
});

test("1) Getting non attached partial views should return the non attached active partial views", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	pc.partialViews["loggedOut"].active = true;
	var result = pc.getPartialViewsNonAttachedActive("setup");
	equals(result[0], pc.partialViews["loggedOut"]);
});

test("2) Getting non attached partial views should return the non attached active partial views", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["dashboard"].active = true;
	var result = pc.getPartialViewsNonAttachedActive("loggedOut");
	equals(result.length, 2);
	equals(result[0], pc.partialViews["dashboard"]);
	equals(result[1], pc.partialViews["loggedIn"]);
});

module("getPartialViewsInActiveParents()");

test("Is a method", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.getPartialViewsInActiveParents, "function");
});

test("Getting inactive parent partial views should return the correct items.", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	
	var result = pc.getPartialViewsInActiveParents("dashboard");
	equals(result.length, 2);
	equals(result[0], pc.partialViews["loggedIn"]);
	equals(result[1], pc.partialViews["dashboard"]);
	
});
