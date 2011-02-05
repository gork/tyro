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

test("Every instance of Tyro.PageController should have a partialViews object property.", function() {
  var pc = new Tyro.PageController();
	equals(typeof pc.partialViews, "object");
});

module("addPartialView()");

test("Every instance of Tyro.PageController should have an addPartialView() method.", function() {
	var pc = new Tyro.PageController();
	equals(typeof pc.addPartialView, "function");
});

test("When adding a partial-view with no arguments an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView();
	}, "raised");
});

test("When adding a partial-view without an 'id' property an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({});
	}, "raised");
});

test("When adding a partial-view without an 'active' property an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup"		
		});
	}, "raised");
});

test("When adding a partial-view without a 'partialViewId' property an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true
		});
	}, "raised");
});
test("When adding a partial-view without a 'childViews' property an error is thrown.", function() {
	var pc = new Tyro.PageController();
	raises(function() {
		pc.addPartialView({
			id: "setup",
			active: true,
			partialViewId: "loggedIn"
		});
	}, "raised");
});

test("When adding a partial-view without a 'view' property an error is thrown.", function() {
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

test("When adding a partial-view with a malformed 'view' property an error is thrown.", function() {
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

test("When adding a valid partialView it should be added to the partialViews collection.", function() {
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

test("This should return the active children partial-views as an array.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true,{}, fixtures.main);
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	
	var result = pc.getPartialViewsChildrenActive("loggedIn");
	equals(result[0], pc.partialViews["campaigns"]);
	equals(result[1], pc.partialViews["setup"]);
});

test("This should return the active children partial-views as an array.", function() {
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

test("When no partial-view is specificed, an empty array should be returned.", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	var result = pc.getPartialViewsNonAttachedActive();
	ok($.isArray(result));
});

test("When one non attached partial-view is active, that partial-view should be returned in an array.", function() {
	var pc = new Tyro.PageController();	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	pc.partialViews["loggedOut"].active = true;
	var result = pc.getPartialViewsNonAttachedActive("setup");
	equals(result[0], pc.partialViews["loggedOut"]);
});

test("When there are multiple non attached active partial-views, they should be returned in an array.", function() {
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

test("Every instance of Tyro.PageController should have a getPartialViewsInActiveParents() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.getPartialViewsInActiveParents, "function");
});

test("When there are partial-views that are inactive and parents it should return them in an array.", function() {
	var pc = new Tyro.PageController();	
	
	pc.partialViews = $.extend(true,{}, fixtures.main);
	var result1 = pc.getPartialViewsInActiveParents("loggedOut");
	equals(result1.length, 1);
	equals(result1[0], pc.partialViews["loggedOut"]);
	
	//1
	pc.partialViews = $.extend(true,{}, fixtures.main);
	var result2 = pc.getPartialViewsInActiveParents("dashboard");
	equals(result2.length, 2);
	equals(result2[0], pc.partialViews["loggedIn"]);
	equals(result2[1], pc.partialViews["dashboard"]);
	
	//2
	pc.partialViews = $.extend(true,{}, fixtures.main);
	var result3 = pc.getPartialViewsInActiveParents("campaigns");
	equals(result3.length, 3);
	equals(result3[0], pc.partialViews["loggedIn"]);
	equals(result3[1], pc.partialViews["setup"]);
	equals(result3[2], pc.partialViews["campaigns"]);
	
});

module("teardownPartialView()");

test("Every instance of Tyro.PageController should have a teardownPartialView() method", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.teardownPartialView, "function");
});

test("When tearing down a partial-view it should call teardown on it's childViews and then it's own view.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.partialViews["setup"] = $.extend(true,{}, fixtures.main["setup"]);
	pc.partialViews["setup"].active = true;
	var func = stubFn();
	pc.partialViews["setup"].childViews = [{teardown: func}];
	pc.partialViews["setup"].view.teardown = stubFn();
	// exercise
	pc.teardownPartialView("setup");
	
	// verify	
	ok(func.called);
	ok(pc.partialViews["setup"].view.teardown.called);
	equals(pc.partialViews["setup"].active, false);
	equals(pc.partialViews["setup"].childViews.length, 0);
	
});

module("teardownPartialViews()");

test("Every instance of Tyro.PageController should have a teardownPartialViews() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.teardownPartialViews, "function");
});

test("When tearing down many partial-views, it should delegate to the teardownPartialView() method.", function() {
	var pc = new Tyro.PageController();
	pc.teardownPartialView = stubFn();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	pc.partialViews["setup"].active = true;
	pc.partialViews["loggedIn"].active = true;
	var arr = [pc.partialViews["setup"], pc.partialViews["loggedIn"]]
	
	pc.teardownPartialViews(arr);
	
	equals(pc.teardownPartialView.callCount, 2);
	equals(pc.teardownPartialView.args[0], "loggedIn");
});

module("getPartialViewDomContainer()");

test("Every instance of Tyro.PageController should have a getPartialViewDomContainer() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.getPartialViewDomContainer, "function");
});

test("When the partial-view doesn't exist it should return null.", function() {
	var pc = new Tyro.PageController();
	
	var result = pc.getPartialViewDomContainer();
	
	equals(result, null);
});

test("When the partial-view does exist it should return the view container.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	
	var result = pc.getPartialViewDomContainer("setup");
	
	equals(result, "some container");
	
});

module("addChildView()");

test("Every instance of Tyro.PageController should have an addChildView() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.addChildView, "function");
});

test("When adding a view to a partial-view  it should be added to it's childViews array.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	
	var view = {
		render: stubFn(),
		teardown: stubFn(),
		container: "woop"
	}
	pc.addChildView("setup", view);
	
	equals(pc.partialViews["setup"].childViews.length, 1);
	equals(pc.partialViews["setup"].childViews[0], view);
	
});

test("When adding a view that has the same container as a view already in the partial-views childViews array, teardown and remove it first.",  function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	var view1 = { teardown: stubFn(), container: "container1" };
	var view2 = { teardown: stubFn(), container: "container2" };
	var view3 = { teardown: stubFn(), container: "container1" };
	pc.partialViews["setup"].childViews = [view1, view2];

	pc.addChildView("setup", view3);

	ok(view1.teardown.called);
	ok(!view2.teardown.called);
})

module("isPartialViewActive()");

test("Every instance of Tyro.PageController should have an isPartialViewActive() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.isPartialViewActive, "function");
});

test("When a view is active, this should return true", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	pc.partialViews["setup"].active = true;
	var result = pc.isPartialViewActive("setup");
	
	ok(result);
});

test("When a view is active, this should return true", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	var result = pc.isPartialViewActive("setup");
	
	ok(!result);
});

module("renderPartialViews()");

test("Every instance of Tyro.PageController should have a renderPartialViews() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.renderPartialViews, "function");
});

test("When invoking this method, it should render each of the partial-views view and set to active", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	var pvRender1 = stubFn();
	var pvRender2 = stubFn();
	pc.partialViews["loggedIn"].view = { render: pvRender1 };
	pc.partialViews["setup"].view = {	render: pvRender2 };


	pc.renderPartialViews([pc.partialViews["loggedIn"], pc.partialViews["setup"]]);

	ok(pvRender1.called);
	ok(pc.partialViews["loggedIn"].active);
	ok(pvRender2.called);
	ok(pc.partialViews["setup"].active);
});

module("render()");

test("Every instance of Tyro.PageController should have a render() method.", function() {
	var pc = new Tyro.PageController();	
	equals(typeof pc.render, "function");
});

test("When rendering a partial view, its parent partial-views should be rendered.", function() {
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	
	pc.partialViews["loggedIn"].view = {
		render: stubFn()
	}

	pc.partialViews["setup"].view = {
		render: stubFn()
	}

	pc.render("setup");

	ok(pc.partialViews["loggedIn"].view.render.called);
	ok(pc.partialViews["setup"].view.render.called);

});

test("When the partial-view is already rendered/active it should not re-render the parents.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	var pvRender1 = stubFn();
	var pvRender2 = stubFn();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["loggedIn"].view = {render: pvRender1};
	pc.partialViews["setup"].active = true;
	pc.partialViews["setup"].view = {render: pvRender2};
	
	// exercise
	pc.render("setup");
	
	// verify
	ok(!pvRender1.called);
	ok(!pvRender2.called);
});

test("When the partial-view is already rendered/active it should teardown the active-children partial-views.", function() {
	// setup
	var pc = new Tyro.PageController();
	pc.partialViews = $.extend(true, {}, fixtures.main);
	var pvTeardown = stubFn();
	pc.partialViews["loggedIn"].active = true;
	pc.partialViews["setup"].active = true;
	pc.partialViews["campaigns"].active = true;
	pc.partialViews["campaigns"].view = {teardown: pvTeardown};
	
// exercise
	pc.render("setup");
	
	// verify
	ok(pvTeardown.called);
});

test("Tearing down non attached parents", function() {

});

