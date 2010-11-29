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

module("addController()", {

});

test("Adding a controller should add it to the controllers array", function() {
	var t = new Tyro();
	var func = function() {};
	t.addController(func);
	equals(t.controllers[0], func, "The array contains the function that was added.");
});