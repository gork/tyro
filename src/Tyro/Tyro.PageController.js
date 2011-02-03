var Tyro = Tyro || {};
Tyro.PageController = function() {
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
	
	this.activeChildren = [];	
}

Tyro.PageController.prototype.render = function(options) {
  console.log("PAGECONTROLLER > RENDER");

  if(options.special && this.partialViews[options.partialViewId].active) {
	this.renderView(options.partialViewId, options.view);
	return;
  }

  if(this.partialViews[options.partialViewId].active) {
    this.teardownChildPartialViews(options.partialViewId);
  	this.renderView(options.partialViewId, options.view);
  }
  else {
    console.log("1. teardown non attached parents");
    this.teardownNonAttachedPartialViews(options.partialViewId);
    console.log("2. teardown children");
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

Tyro.PageController.prototype.getPartialViewDomContainer = function(partialViewId) {
  return this.partialViews[partialViewId].view.container || null;
}

Tyro.PageController.prototype.getPartialViewParentsChildren = function(partialViewId) {
  var pv = this.partialViews[partialViewId];
  pv = this.partialViews[pv.partialViewId];
  if(!pv) {
	return [];
  }
  else {
	return pv.childViews;
  }  
}

Tyro.PageController.prototype.teardownNonAttachedPartialViews = function(partialViewId) {
  this.getActiveNonAttachedParents(partialViewId);
  this.activeChildren.reverse();
  if(this.activeChildren.length) {
	this.teardownChildren();
  }
}

Tyro.PageController.prototype.renderParentPartialViews = function(partialViewId) {
  var inActiveParents = this.getInActiveParentViews(partialViewId).reverse();
  for(var i = 0; i < inActiveParents.length; i++) {
		inActiveParents[i].active = true;
		inActiveParents[i].view.render();		
	}
}

Tyro.PageController.prototype.teardownChildPartialViews = function(partialViewId) {
	this.getActiveChildrenViews(partialViewId);
	this.teardownChildren();
}

Tyro.PageController.prototype.teardownChildren = function() {
  for(var j = 0; j < this.activeChildren.length; j++) {
		var child = this.activeChildren[j];
		for(var k = 0; k < child.childViews.length; k++) {
			child.childViews[k].teardown();

			// we need to remove this
			child.childViews.splice(k, 1);
			k--;
		}
		child.view.teardown();
		child.active = false;
	}
	this.activeChildren = [];
}

Tyro.PageController.prototype.renderView = function(partialViewId, view) {
  var childViews = this.partialViews[partialViewId].childViews;
  for(var i = 0; i < childViews.length; i++) {
    if(childViews[i].container === view.container) {
      childViews[i].teardown();
			childViews.splice(i, 1);
			i--;
			break;
    }
  }
  
  childViews.push(view);
  this.partialViews[partialViewId].active = true;
  view.render();
}


Tyro.PageController.prototype.getActiveChildrenViews = function(partialViewId) {
	var viewId = null;
	for(var view in this.partialViews) {
		if(this.partialViews[view].active) {
			if(partialViewId == this.partialViews[view].partialViewId) {
				viewId = view;
				this.activeChildren.push(this.partialViews[view]);
				break;
			}
		}
	}
	if(viewId) {
		this.getActiveChildrenViews(viewId);
	}
}

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
		arr.concat(this.getActiveChildrenViews(viewId));
	}
	return arr;
}


Tyro.PageController.prototype.getActiveNonAttachedParents = function(partialViewId) {
	if(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false) {
		this.getActiveNonAttachedParents(this.partialViews[partialViewId].partialViewId);
	}
	else {
		this.getActiveChildrenViews(partialViewId);
	}
}

Tyro.PageController.prototype.getInActiveParentViews = function(partialViewId) {
	var inActiveViews = [];
	while(this.partialViews[partialViewId] && this.partialViews[partialViewId].active == false ) {
		inActiveViews.push(this.partialViews[partialViewId]);
		partialViewId = this.partialViews[partialViewId].partialViewId;
	}
	return inActiveViews;
}
