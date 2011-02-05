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
var Tyro = Tyro || {};
Tyro.PageController = function() {
	this.partialViews = {};	
}

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
				returnVal = returnVal.concat(this.getPartialViewsChildrenActive(topLevelPartialViewActiveNonAttached))
		}
		return returnVal.reverse();
}

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

Tyro.PageController.prototype.getPartialViewsInActiveParents = function(partialViewId) {
		var returnVal = [];
		while(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false ) {
				returnVal.push(this.partialViews[partialViewId]);
				partialViewId = this.partialViews[partialViewId].partialViewId;
		}
		return returnVal.reverse();
}

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

Tyro.PageController.prototype.teardownPartialViews = function(arr) {
		for(var i = 0; i < arr.length; i++) {
				this.teardownPartialView(arr[i].id);
		}
}

Tyro.PageController.prototype.getPartialViewDomContainer = function(partialViewId) {
		var returnVal = null;
		var pv = this.partialViews[partialViewId];
		if(pv && pv.view && pv.view.container) {
				returnVal = pv.view.container;
		}
		return returnVal;
}

Tyro.PageController.prototype.addChildView = function(partialViewId, view) {
		var pv = this.partialViews[partialViewId];
		var existingView = null;
		if(pv) {
				this.teardownChildView(partialViewId, view.container);
				pv.childViews.push(view);
		}
}

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

Tyro.PageController.prototype.isPartialViewActive = function(partialViewId) {
		return this.partialViews[partialViewId].active;
}

Tyro.PageController.prototype.renderPartialViews = function(partialViews) {
		for(var i = 0; i < partialViews.length; i++) {
				partialViews[i].view.render();
				partialViews[i].active = true;
		}
}

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
