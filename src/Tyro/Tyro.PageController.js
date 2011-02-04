var Tyro = Tyro || {};
Tyro.PageController = function() {
	
	// stores the partialViews object
	// this will be an empty object
	// and i will expose a public method
	// to add partialViews as long as the conform
	// to the following structure etc
	this.partialViews = {	
		"loggedOut": {
			id:"loggedOut",
			view: new Thick.Views.LoggedOut(),
			active: false,
			partialViewId: null,
			childViews: []
		},
		"loggedIn": {
			id:"loggedIn",
			view: new Thick.Views.LoggedIn(),
			active: false,
			partialViewId: null,
			childViews: []
		},
		"dashboard": {
			id:"dashboard",
			view: new Thick.Views.Dashboard(),
			active: false,
			partialViewId: "loggedIn",
			childViews: []
		},
		"setup": {
			id: "setup",
			view: new Thick.Views.Setup(),
			active: false,
			partialViewId: "loggedIn",
			childViews: []
		},
		"campaigns": {
			id: "campaigns",
			view: new Thick.Views.Campaigns(),
			active: false,
			partialViewId: "setup",
			childViews: []
		}
	}
	
	// this is because i don't know how to recurse properly - brain hurts
	this.activeChildren = [];	
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
 * @memberOf Tyro.PageController *
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
  			i--;
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
 * This returns the partialViews view container which will be a jquery selector
 * @function
 * @public
 * @return {String/Null} The container e.g. "#someSelector" or null
 * @memberOf Tyro.PageController
 */
Tyro.PageController.prototype.getPartialViewDomContainer = function(partialViewId) {
  return this.partialViews[partialViewId].view.container || null;
}

/**
 * This function gets the partialView's parent partialView's childViews.
 * So for example in the following example
 * getPartialViewParentsChildren("setup")
 * it will return the "loggedIn" partialView's childViews
 * @param {String} partialViewId The id of the partialView
 * @return {Array}
 */
Tyro.PageController.prototype.getPartialViewParentsChildren = function(partialViewId) {
  var pv = this.partialViews[partialViewId];
	// go up one
  pv = this.partialViews[pv.partialViewId];
  if(!pv) {
		return [];
  }
  else {
		return pv.childViews;
  }  
}

/**
 * This function is responsible for tearing down all the non attached partialViews
 * To elaborate, if we are viewing "dashboardHome" then we know that loggedIn and Dashboard
 * partialViews are rendered. If the user goes to "login" then we know they have become signed
 * out and there for a new top level parent needs to be rendered (i.e. "loggedOut"). So we
 * need to teardown the non attached partialViews (by non attached I mean there is no link from
 * "dashboardHome" to "login")
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The partial view id (that happens to not be attached)
 *
 */
Tyro.PageController.prototype.teardownNonAttachedPartialViews = function(partialViewId) {
	// this currently doesn't return anything, it pushes to this.activeChildren
	// because I don't know how to recurse :(
	this.getActiveNonAttachedParents(partialViewId);
	
	// reverse the array, because they are in the opposite order
  this.activeChildren.reverse();
	
	// if the activeChildren has a length of more than zero
  if(this.activeChildren.length) {
		// tear down the children - THIS IS A BIT MIS LEADING, as its not tearing down the children
		// its tearing down the non attached parents but i was tyring to reuse the function
		// as its effectively identical
		this.teardownChildren();
  }
}

Tyro.PageController.prototype.teardownNonAttachedPartialViewsNew = function(partialViewId) {
	this.activeChildren = this.getActiveNonAttachedParentsNew(partialViewId);
  this.activeChildren.reverse();
  if(this.activeChildren.length) {
		this.teardownChildren();
  }
}


/**
 * This function is responsible for rendering all partialViews required before
 * rendering the particular view. For example it will render "loggedIn" and "dashboard"
 * before rendering "dashboardHome" view
 * @param {String} partialViewId The partialView we are rendering
 * @function
 * @public
 * @memberOf Tyro.PageController
 */
Tyro.PageController.prototype.renderParentPartialViews = function(partialViewId) {
  // get all the in-active parents and reverse them
  var inActiveParents = this.getInActiveParentViews(partialViewId).reverse();
	// loop through, set to active and render them
  for(var i = 0; i < inActiveParents.length; i++) {
		inActiveParents[i].active = true;
		inActiveParents[i].view.render();		
	}
}

/**
 * Responsible for tearing down child partial views
 * @function
 * @public
 * @memberOf Tyro.PageController
 * @param {String} partialViewId The partialView we are rendering
 *
 */
Tyro.PageController.prototype.teardownChildPartialViews = function(partialViewId) {
	// again, set the this.activeChildren
	this.activeChildren = this.getActiveChildrenViewsNew(partialViewId);
	
	// if the activeChildren has a length of more than zero
  if(this.activeChildren.length) {
		// tear down the children - THIS IS A BIT MIS LEADING, as its not tearing down the children
		// its tearing down the non attached parents but i was tyring to reuse the function
		// as its effectively identical
		this.teardownChildren();
  }
}

/**
 * This function assumes the existence of this.activeChildren which has been
 * previously populated. Then proceeds to teardown the childViews of each, then
 * teardown itself.
 *
 * NOTE: I want this to accept a parameter of partialViews
 *
 *
 */
Tyro.PageController.prototype.teardownChildren = function() {
  for(var j = 0; j < this.activeChildren.length; j++) {
		var child = this.activeChildren[j];
		// tear down childViews first
		for(var k = 0; k < child.childViews.length; k++) {
			child.childViews[k].teardown();

			// we need to remove this
			child.childViews.splice(k, 1);
			k--;
		}
		// teardown itself
		child.view.teardown();
		child.active = false;
	}
	this.activeChildren = [];
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

/**
 * This gets the active children views the old way by populating this.activeChildren
 * and the getActiveNonAttachedParents() uses this.
 */
Tyro.PageController.prototype.getActiveChildrenViews = function(partialViewId) {
	var viewId = null;
	// loop through all views
	for(var view in this.partialViews) {
		// if active
		if(this.partialViews[view].active) {
		  // and if the partialViewId matches
			// then collect it and break
			if(partialViewId == this.partialViews[view].partialViewId) {
				viewId = view;
				this.activeChildren.push(this.partialViews[view]);
				break;
			}
		}
	}
	// once above loop finishes, get the activeChildren
	if(viewId) {
		this.getActiveChildrenViews(viewId);
	}
}

/**
 * The new and improved version of the above function
 * It is improved because it returns the activeChildren as opposed to setting the property
 */
Tyro.PageController.prototype.getActiveChildrenViewsNew = function(partialViewId) {
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
		arr.concat(this.getActiveChildrenViewsNew(viewId));
	}
	return arr;
}

/**
 * This function is annoying me, i want it to return the non attached parents
 * as opposed to set the activeChildren
 *
 */
Tyro.PageController.prototype.getActiveNonAttachedParents = function(partialViewId) {
	if(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false) {
		this.getActiveNonAttachedParents(this.partialViews[partialViewId].partialViewId);
	}
	else {
		this.getActiveChildrenViews(partialViewId);
	}
}

Tyro.PageController.prototype.getActiveNonAttachedParentsNew = function(partialViewId, found) {
	var arr = [];
	if(found) {
		arr.concat(this.getActiveChildrenViewsNew(partialViewId));
	}
	else {
			if(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false) {
				arr.concat(this.getActiveNonAttachedParentsNew(this.partialViews[partialViewId].partialViewId));
			}
			else {
				arr.concat(this.getActiveNonAttachedParentsNew(partialViewId, true));
			}
	}

	return arr;
}

/**
 * Get the inactive parent views
 * @param {String} partialViewId The partial view id
 * @public
 * @function
 * @memberOf Tyro.PageController
 * @return {Array} The inactive views we need to render
 */
Tyro.PageController.prototype.getInActiveParentViews = function(partialViewId) {
	var inActiveViews = [];
	// while the partialView exists and its not active
	while(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false ) {
		// collect
		inActiveViews.push(this.partialViews[partialViewId]);
		// ok now try to move up one level
		partialViewId = this.partialViews[partialViewId].partialViewId;
	}
	return inActiveViews;
}
