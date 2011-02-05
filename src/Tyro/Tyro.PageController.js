/*
	  controller.prototype.action = function() {		
				this.app.pageController.renderPartialView({partialViewId: "dashboard", this.view})
				this.view.showLoader();
				this.view.hideLoader();
				this.view.render();		
		}
*/

var Tyro = Tyro || {};
Tyro.PageController = function() {
	this.partialViews = {};	
}

/**
 * This is the primary method called within other controllers in order to render
 * and teardown the appropriate partialViews and normal views so that we gain flexibility
 * in providing "layouts" whilst maintaining a performant code base.
 * @example
 * pageController.render({partialViewId: "dashboard", view: "your view object" })
 * @param {Object} options The options for the render method
 * @param {String} options.partialViewId The partialViewId required to render before the view is rendered
 * @param {Boolean} options.special When this option is set to true, it is assumed that the partialView is already rendered
 * which is useful when a partialView notifies other controllers that it is now rendered, so that a navigation view is shown
 * but we don't want the partialView to be rerendered or childviews of child partials etc to be torn down
 * @function
 * @public
 * @memberOf Tyro.PageController
 */
Tyro.PageController.prototype.render = function(options) {
  console.log("------------------------------PAGECONTROLLER > RENDER");
	
	// assume the partialViews parents are already ready
  if(options.special && this.partialViews[options.partialViewId].active) {
		this.renderView(options.partialViewId, options.view);
		return;
  }
  
	// if the partial view is already active then we dont need to sort out parents
	// we only need to sort out the children
  if(this.partialViews[options.partialViewId].active) {
    this.teardownChildPartialViews(options.partialViewId);
  	this.renderView(options.partialViewId, options.view);
  }
	// if the partial view is not active then we need to do a lot more prep work
  else {
    //console.log("1. teardown non attached parents");
    this.teardownNonAttachedPartialViews(options.partialViewId);
    //console.log("2. teardown children");
    this.teardownChildPartialViews(options.partialViewId); // children    
    //console.log("3. ensure that the partialView dom node container is not taking the place of any parent partial view child views, teardown if nec");
    var partialViewContainer = this.getPartialViewDomContainer(options.partialViewId);
    var partialViewParentsChildren = this.getPartialViewParentsChildren(options.partialViewId);
    for(var i = 0; i < partialViewParentsChildren.length; i++) {
      if(partialViewParentsChildren[i].container === partialViewContainer) {
        partialViewParentsChildren[i].teardown();
        partialViewParentsChildren.splice(i, 1);
        break;
      }
    }    
    //console.log("4. render parents");
    this.renderParentPartialViews(options.partialViewId);
    //console.log("5. render the view"); // 5. also need to make sure that the view we are about to render is not taking the place of anything....
    this.renderView(options.partialViewId, options.view);
  }
}

/**
 * This is the last method to be called. It will tear down any childViews
 * for the partialView that we need to teardown before rendering the view.
 * Because the view that we are trying to render may be injecting itself
 * into the same container.
 * @param {String} partialViewId The partialView
 * @param {Object} view The view object we want to render
 *
 */
Tyro.PageController.prototype.renderView = function(partialViewId, view) {
  
	// teardown necessary childViews
	var childViews = this.partialViews[partialViewId].childViews;
  for(var i = 0; i < childViews.length; i++) {
    if(childViews[i].container === view.container) {
      childViews[i].teardown();
			childViews.splice(i, 1);
			i--;
			break;
    }
  }
  
	// add this view to the partialView childViews array
  childViews.push(view);
  this.partialViews[partialViewId].active = true;
  view.render();
}

/*********************** NEW ***********************/

Tyro.PageController.prototype.getPartialViewsNonAttachedActive = function(partialViewId) {
		var returnVal = [];
		var topLevelPartialViewActiveNonAttached = null;
		for(var pv in this.partialViews) {
				if(this.partialViews[pv].partialViewId === null) {
						if(this.partialViews[pv].active) {
								topLevelPartialViewActiveNonAttached = pv;
								returnVal.push(this.partialViews[pv]);
								break;
						}
				}
		}
		if(topLevelPartialViewActiveNonAttached) {				
				returnVal = returnVal.concat(this.getPartialViewsChildrenActive(topLevelPartialViewActiveNonAttached))
		}
		return returnVal.reverse();
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
				this.teardownPartialView(arr[i]);
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
		if(pv) {
				pv.childViews.push(view);
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