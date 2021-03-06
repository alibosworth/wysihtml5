/**
 * Undo Manager for wysihtml5
 * slightly inspired by http://rniwa.com/editing/undomanager.html#the-undomanager-interface
 */

import { Constants } from "./constants";
import lang from "wysihtml5/lang";
import dom from "./dom";

var Z_KEY = 90;
var Y_KEY = 89;
var MAX_HISTORY_ENTRIES = 25;
var DATA_ATTR_NODE = "data-wysihtml5-selection-node";
var DATA_ATTR_OFFSET = "data-wysihtml5-selection-offset";

function cleanTempElements(doc) {
  var tempElement;
  while (tempElement = doc.querySelector("._wysihtml5-temp")) {
    tempElement.parentNode.removeChild(tempElement);
  }
}

var UndoManager = lang.Dispatcher.extend({
  constructor: function(composer) {
    this.composer = composer;
    this.editor = this.composer.parent;
    this.element = this.composer.element;
    this.reset();
    this._observe();
  },

  reset: function() {
    this.position = 0;
    this.historyStr = [];
    this.historyDom = [];
    this.transact();
  },

  _observe: function() {
    var that      = this,
        doc       = document,
        lastKey;

    // Catch CTRL+Z and CTRL+Y
    dom.observe(this.element, "keydown", function(event) {
      if (event.altKey || (!event.ctrlKey && !event.metaKey)) {
        return;
      }

      var keyCode = event.keyCode,
          isUndo = keyCode === Z_KEY && !event.shiftKey,
          isRedo = (keyCode === Z_KEY && event.shiftKey) || (keyCode === Y_KEY);

      if (isUndo) {
        that.undo();
        event.preventDefault();
      } else if (isRedo) {
        that.redo();
        event.preventDefault();
      }
    });

    // Catch delete and backspace
    // TODO move to a keyboard handler
    dom.observe(this.element, "keydown", function(event) {
      var keyCode = event.keyCode;
      if (keyCode === lastKey) {
        return;
      }

      lastKey = keyCode;

      if (keyCode === Constants.BACKSPACE_KEY || keyCode === Constants.DELETE_KEY) {
        that.transact();
      }
    });

    this.editor.on("newword:composer", function() {
      that.transact();
    });

    this.editor.on("beforecommand:composer", function() {
      that.transact();
    });
  },

  transact: function() {
    var previousHtml = this.historyStr[this.position - 1];
    var currentHtml = this.composer.getValue();

    if (currentHtml === previousHtml) {
      return;
    }

    var length = this.historyStr.length = this.historyDom.length = this.position;
    if (length > MAX_HISTORY_ENTRIES) {
      this.historyStr.shift();
      this.historyDom.shift();
      this.position--;
    }

    this.position++;

    var range   = this.composer.selection.getRange(),
        node    = (range && range.startContainer) ? range.startContainer : this.element,
        offset  = (range && range.startOffset) ? range.startOffset : 0,
        element,
        position;

    if (node.nodeType === Node.ELEMENT_NODE) {
      element = node;
    } else {
      element  = node.parentNode;
      position = this.getChildNodeIndex(element, node);
    }

    element.setAttribute(DATA_ATTR_OFFSET, offset);
    if (typeof(position) !== "undefined") {
      element.setAttribute(DATA_ATTR_NODE, position);
    }

    var clone = this.element.cloneNode(!!currentHtml);
    this.historyDom.push(clone);
    this.historyStr.push(currentHtml);

    element.removeAttribute(DATA_ATTR_OFFSET);
    element.removeAttribute(DATA_ATTR_NODE);
  },

  undo: function() {
    this.transact();

    if (!this.undoPossible()) {
      return;
    }

    this.set(this.historyDom[--this.position - 1]);
    this.editor.fire("undo:composer");
  },

  redo: function() {
    if (!this.redoPossible()) {
      return;
    }

    this.set(this.historyDom[++this.position - 1]);
    this.editor.fire("redo:composer");
  },

  undoPossible: function() {
    return this.position > 1;
  },

  redoPossible: function() {
    return this.position < this.historyStr.length;
  },

  set: function(historyEntry) {
    this.element.innerHTML = "";

    var i = 0,
        childNodes = historyEntry.childNodes,
        length = historyEntry.childNodes.length;

    for (; i<length; i++) {
      this.element.appendChild(childNodes[i].cloneNode(true));
    }

    // Restore selection
    var offset,
        node,
        position;

    if (historyEntry.hasAttribute(DATA_ATTR_OFFSET)) {
      offset    = historyEntry.getAttribute(DATA_ATTR_OFFSET);
      position  = historyEntry.getAttribute(DATA_ATTR_NODE);
      node      = this.element;
    } else {
      node      = this.element.querySelector("[" + DATA_ATTR_OFFSET + "]") || this.element;
      offset    = node.getAttribute(DATA_ATTR_OFFSET);
      position  = node.getAttribute(DATA_ATTR_NODE);
      node.removeAttribute(DATA_ATTR_OFFSET);
      node.removeAttribute(DATA_ATTR_NODE);
    }

    if (position !== null) {
      node = this.getChildNodeByIndex(node, +position);
    }

    this.composer.selection.set(node, offset);
  },

  getChildNodeIndex: function(parent, child) {
    var i = 0;
    var childNodes = parent.childNodes;
    var length = childNodes.length;

    for (; i<length; i++) {
      if (childNodes[i] === child) {
        return i;
      }
    }
  },

  getChildNodeByIndex: function(parent, index) {
    return parent.childNodes[index];
  }
});

export { UndoManager };
