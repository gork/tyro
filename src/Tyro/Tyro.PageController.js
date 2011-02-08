/**
 * @namespace Holds functionality relating to Tyro.
 */
var Tyro = Tyro || {};

/**
 * A special controller to handle the rendering and tearing down of partial-views
 * @class
 * @constructor
 * @memberOf Tyro
 * @example
 * var pc = new Tyro.PageController();
 * function controllerAction() {
 * 		pc.render("dashboard");
 * 		pc.addChildView("dashboard", dashboardHomeView);
 * 		dashboardHomeView.showLoader();
 * 		dashboardHomeView.hideLoader();
 * 		dashboardHomeView.render();
 * }
 */
Tyro.PageController = function() {
	this.partialViews = {};	
}

/**
 * Gets an array of non attached active partial-views
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Array} A list of non attached active partial-views (in teardown order)
 */ 
Tyro.PageController.prototype.getPartialViewsNonAttachedActive = function(partialViewId) {
		var returnVal = [];
		var topLevelPartialViewActiveNonAttached = null;
		for(var pv in this.partialViews) {
				if(this.partialViews[pv].partialViewId === null) {
						if(this.partialViews[pv].active) {
								if(this.partialViews[pv] !== this.getPartialViewTopLevel(partialViewId)) {
										topLevelPartialViewActiveNonAttached = pv;
										returnVal.push(this.partialViews[pv]);
										break;
								}
						}
				}
		}
		if(topLevelPartialViewActiveNonAttached) {				
				returnVal = returnVal.concat(this.getPartialViewsChildrenActive(topLevelPartialViewActiveNonAttached).reverse());
		}
		return returnVal.reverse();
}

/**
 * Gets the top level partial-view for a particular partial-view specified
 * e.g. If we have Top > Second > Third and we ask for the top level partial-view
 * for "Second" or "Third" it should return the "top" partial-view
 * @example
 * var pc = new Tyro.PageController();
 * pc.getPartialViewTopLevel("dashboard");
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Object} The top level partial-view
 */
Tyro.PageController.prototype.getPartialViewTopLevel = function(partialViewId) {
		var topLevel = null;
		
		if(this.partialViews[partialViewId].partialViewId !== null) {
				topLevel = this.getPartialViewTopLevel(this.partialViews[partialViewId].partialViewId);
		}
		else {
				topLevel = this.partialViews[partialViewId];
		}
		return topLevel;
}

/**
 * Gets an array of child partial-views that are active for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.getPartialViewsChildrenActive = function(partialViewId) {
	var viewId = null;
	var arr = [];
	for(var view in this.partialViews) {
		if(this.partialViews[view].active) {
			if(partialViewId == this.partialViews[view].partialViewId) {
				viewId = view;
				arr.push(this.partialViews[view]);
				break;
			}
		}
	}
	if(viewId) {
		arr = arr.concat(this.getPartialViewsChildrenActive(viewId));
	}
	return arr.reverse();
}

/**
 * Gets an array of parent partial-views that are in-active (to be rendered) for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.getPartialViewsInActiveParents = function(partialViewId) {
		var returnVal = [];
		while(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false ) {
				returnVal.push(this.partialViews[partialViewId]);
				partialViewId = this.partialViews[partialViewId].partialViewId;
		}
		return returnVal.reverse();
}

/**
 * Tears down a partial-view for a given partial-view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.teardownPartialView = function(partialViewId) {
		var pv = this.partialViews[partialViewId];
		if(!pv) return;
		var childViews = pv.childViews;
		for(var i = 0; i < childViews.length; i++) {
				childViews[i].teardown();
				childViews.splice(i, 1);
				i--;
		}
		pv.view.teardown();
		pv.active = false;		
}

/**
 * Tears down multiple partial-views given an array of partial-views
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.teardownPartialViews = function(arr) {
		for(var i = 0; i < arr.length; i++) {
				this.teardownPartialView(arr[i].id);
		}
}

/**
 * Gets a partial-view's dom container
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {String} A string representing the dom node i.e. a selector
 */
Tyro.PageController.prototype.getPartialViewDomContainer = function(partialViewId) {
		var returnVal = null;
		var pv = this.partialViews[partialViewId];
		if(pv && pv.view && pv.view.container) {
				returnVal = pv.view.container;
		}
		return returnVal;
}

/**
 * Adds a view to become a stored child view for a particular partial-view. So that
 * the partial-view can keep track of what child views it may or may not need to teardown
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @param {Object} view The view object
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.addChildView = function(partialViewId, view) {
		var pv = this.partialViews[partialViewId];
		var existingView = null;
		if(pv) {
				this.teardownChildView(partialViewId, view.container);
				pv.childViews.push(view);
		}
}

/**
 * Teardown a child-view for a particular partial-view
 * @public
 * @function
 * @example
 * var pc = new Tyro.PageController()
 * // will teardown any child-views that dashboard contains that has a container of "#mainDomNode"
 * pc.teardownChildView("dashboard", "#mainDomNode"); 
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @param {String} container The selector for the dom node
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.teardownChildView = function(partialViewId, container) {
		var pv = this.partialViews[partialViewId];
		if(pv) {
				for(var i = 0; i < pv.childViews.length; i++) {
						if(pv.childViews[i].container === container) {
								pv.childViews[i].teardown();
								pv.childViews.splice(i, 1);
								break;
						}
				}
		}
}

/**
 * Adds a new partial-view for the page-controller to manage. 
 * Must conform to particular interface to be accepted.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {Object} pv The partial-view object
 * @returns {Array} An array of partial-views
 */
Tyro.PageController.prototype.addPartialView = function(pv) {
		if(typeof pv !== "object") {
				throw new TypeError("Tyro: PageController: addPartialView: provide a partial view");
		}
		if(typeof pv.id !== "string") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide an id");
		}
		if(typeof pv.active !== "boolean") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide an active property");
		}
		if(typeof pv.partialViewId !== "string") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide an partialViewId property");
		}
		if(!$.isArray(pv.childViews)) {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide a childViews array property");
		}
		if(typeof pv.view !== "object") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide a view object property");
		}
		if(typeof pv.view.render !== "function") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide a view with a render method");
		}
		if(typeof pv.view.teardown !== "function") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide a view with a teardown method");
		}
		if(typeof pv.view.container !== "string") {
				throw new TypeError("Tyro: PageController: addPartialView: Must provide a view with a container property");
		}
		
		this.partialViews[pv.id] = pv;
}

/**
 * Checks to see if a particular partial-view is active or not
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 * @returns {Boolean} Returns true when active, otherwise false
 */
Tyro.PageController.prototype.isPartialViewActive = function(partialViewId) {
		return this.partialViews[partialViewId].active;
}

/**
 * Renders a collection of partial-views
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.renderPartialViews = function(partialViews) {
		for(var i = 0; i < partialViews.length; i++) {
				partialViews[i].view.render();
				partialViews[i].active = true;
		}
}

/**
 * The function which is responsible for the tearing down and rendering of partial-views.
 * It works out what is currently rendered, what needs to be rendered and what needs to be
 * torn down and in what order all that happens.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The id of the partial-view i.e. "dashboard"
 */
Tyro.PageController.prototype.render = function(partialViewId) {
		if(!partialViewId) {
				throw new TypeError("Tyro: PageController: render: Must provide a partialViewId");
		}
		
		if(this.isPartialViewActive(partialViewId)) {
				this.teardownPartialViews(this.getPartialViewsChildrenActive(partialViewId));
		}
		else {
				this.teardownPartialViews(this.getPartialViewsNonAttachedActive(partialViewId));
				
				this.teardownPartialViews(this.getPartialViewsChildrenActive(partialViewId));
				
				var inactiveParents = this.getPartialViewsInActiveParents(partialViewId);
				if(inactiveParents.length) {
						var childrenToTeardown = this.getPartialViewsChildrenActive(inactiveParents[0].partialViewId);
						this.teardownPartialViews(childrenToTeardown);
				}
				
				var parent = this.partialViews[this.partialViews[partialViewId].partialViewId];
				
				if(parent) {
						this.teardownChildView(parent.id, this.partialViews[partialViewId].view.container);
				}

				this.teardownPartialView(this.getPartialViewIdActiveWithDomContainer(this.partialViews[partialViewId].view.container))

				this.renderPartialViews(this.getPartialViewsInActiveParents(partialViewId));		
		}
}

/**
 * Gets the partial-view id with a particular dom container.
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} container The DOM selector i.e. "#mainDomNode"
 * @returns {String/Null} Returns the partial-view id if found, otherwise null
 */
Tyro.PageController.prototype.getPartialViewIdActiveWithDomContainer = function(container) {
		var returnVal = null;
		for(var pv in this.partialViews) {
				if(this.partialViews[pv].active) {
						if(this.partialViews[pv].view.container === container) {
								returnVal = this.partialViews[pv].id;
								break;
						}
				}
		}
		return returnVal;
}
