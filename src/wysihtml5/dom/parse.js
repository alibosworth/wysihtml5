/**
 * HTML Sanitizer
 * Rewrites the HTML based on given rules
 *
 * @param {Element|String} elementOrHtml HTML String to be sanitized OR element whose content should be sanitized
 * @param {Object} [rules] List of rules for rewriting the HTML, if there's no rule for an element it will
 *    be converted to a "span". Each rule is a key/value pair where key is the tag to convert, and value the
 *    desired substitution.
 * @param {Object} context Document object in which to parse the html, needed to sandbox the parsing
 *
 * @return {Element|String} Depends on the elementOrHtml parameter. When html then the sanitized html as string elsewise the element.
 *
 * @example
 *    var userHTML = '<div id="foo" onclick="alert(1);"><p><font color="red">foo</font><script>alert(1);</script></p></div>';
 *    wysihtml5.dom.parse(userHTML, {
 *      tags {
 *        p:      "div",      // Rename p tags to div tags
 *        font:   "span"      // Rename font tags to span tags
 *        div:    true,       // Keep them, also possible (same result when passing: "div" or true)
 *        script: undefined   // Remove script elements
 *      }
 *    });
 *    // => <div><div><span>foo bar</span></div></div>
 *
 *    var userHTML = '<table><tbody><tr><td>I'm a table!</td></tr></tbody></table>';
 *    wysihtml5.dom.parse(userHTML);
 *    // => '<span><span><span><span>I'm a table!</span></span></span></span>'
 *
 *    var userHTML = '<div>foobar<br>foobar</div>';
 *    wysihtml5.dom.parse(userHTML, {
 *      tags: {
 *        div: undefined,
 *        br:  true
 *      }
 *    });
 *    // => ''
 *
 *    var userHTML = '<div class="red">foo</div><div class="pink">bar</div>';
 *    wysihtml5.dom.parse(userHTML, {
 *      classes: {
 *        red:    1,
 *        green:  1
 *      },
 *      tags: {
 *        div: {
 *          rename_tag:     "p"
 *        }
 *      }
 *    });
 *    // => '<p class="red">foo</p><p>bar</p>'
 */

import lang from "wysihtml5/lang";
import { getAsDom } from "./get_as_dom";
import { getAttribute } from "./get_attribute";
import { getCorrectInnerHTML } from "../quirks/get_correct_inner_html";
import { hasClass } from "./class";
import { browser } from "../browser";
import { Constants } from "../constants";

var Parser = (function() {
  /**
   * It's not possible to use a XMLParser/DOMParser as HTML5 is not always well-formed XML
   * new DOMParser().parseFromString('<img src="foo.gif">') will cause a parseError since the
   * node isn't closed
   *
   * Therefore we've to use the browser's ordinary HTML parser invoked by setting innerHTML.
   */
  var NODE_TYPE_MAPPING = {
        "1": _handleElement,
        "3": _handleText
      },
      // Rename unknown tags to this
      DEFAULT_NODE_NAME   = "span",
      WHITE_SPACE_REG_EXP = /\s+/,
      defaultRules        = { tags: {}, classes: {} },
      currentRules        = {},
      uneditableClass     = false;

  /**
   * Iterates over all childs of the element, recreates them, appends them into a document fragment
   * which later replaces the entire body content
   */
   function parse(elementOrHtml, config) {
    lang.object(currentRules).merge(defaultRules).merge(config.rules).get();

    var context       = config.context || elementOrHtml.ownerDocument || document,
        fragment      = context.createDocumentFragment(),
        isString      = typeof(elementOrHtml) === "string",
        element,
        newNode,
        firstChild;

    if (isString) {
      element = getAsDom(elementOrHtml, context);
    } else {
      element = elementOrHtml;
    }

    while (element.firstChild) {
      firstChild = element.firstChild;
      newNode = _convert(firstChild, config.cleanUp);
      element.removeChild(firstChild);
      if (newNode) {
        fragment.appendChild(newNode);
        if (lang.array([
                "div", "pre", "p",
                "blockquote",
                "table", "td", "th",
                "ul", "ol", "li",
                "dd", "dl",
                "footer", "header", "section",
                "h1", "h2", "h3", "h4", "h5", "h6"
            ]).contains(newNode.nodeName.toLowerCase())) {
              fragment.appendChild(document.createTextNode("\n\n"));
        }
      }
    }

    // Clear element contents
    element.innerHTML = "";

    // Insert new DOM tree
    element.appendChild(fragment);

    return isString ? getCorrectInnerHTML(element) : element;
  }

  function _convert(oldNode, cleanUp) {
    var oldNodeType     = oldNode.nodeType,
        oldChilds       = oldNode.childNodes,
        oldChildsLength = oldChilds.length,
        method          = NODE_TYPE_MAPPING[oldNodeType],
        i               = 0,
        fragment,
        newNode,
        newChild;

    if (uneditableClass && oldNodeType === 1 && hasClass(oldNode, uneditableClass)) {
        return oldNode;
    }

    newNode = method && method(oldNode);

    if (!newNode) {
        if (newNode === false) {
            // false defines that tag should be removed but contents should remain (unwrap)

            fragment = oldNode.ownerDocument.createDocumentFragment();
            // TODO: try to minimize surplus spaces
            if (lang.array([
                "div", "pre", "p",
                "table", "td", "th",
                "ul", "ol", "li",
                "dd", "dl",
                "footer", "header", "section",
                "h1", "h2", "h3", "h4", "h5", "h6"
            ]).contains(oldNode.nodeName.toLowerCase()) && oldNode.parentNode.firstChild !== oldNode) {

                // add space as first when unwraping non-textflow elements
                fragment.appendChild(oldNode.ownerDocument.createTextNode(" "));
            }


            for (i=0; i<oldChildsLength; i++) {
              newChild = _convert(oldChilds[i], cleanUp);
              if (newChild) {
                fragment.appendChild(newChild);
              }
            }
            return fragment;
        } else {
            return null;
        }
    }

    for (i=0; i<oldChildsLength; i++) {
      newChild = _convert(oldChilds[i], cleanUp);
      if (newChild) {
        newNode.appendChild(newChild);
      }
    }

    // Cleanup senseless <span> elements
    if (cleanUp &&
        newNode.nodeName.toLowerCase() === DEFAULT_NODE_NAME &&
        (!newNode.childNodes.length ||
         ((/^\s*$/gi).test(newNode.innerHTML) && oldNode.className !== "_wysihtml5-temp-placeholder") ||
         !newNode.attributes.length)
        ) {
      fragment = newNode.ownerDocument.createDocumentFragment();
      while (newNode.firstChild) {
        fragment.appendChild(newNode.firstChild);
      }
      return fragment;
    }



    return newNode;
  }

  function _handleElement(oldNode) {
    var rule,
        newNode,
        tagRules    = currentRules.tags,
        nodeName    = oldNode.nodeName.toLowerCase(),
        scopeName   = oldNode.scopeName;


    /**
     * We already parsed that element
     * ignore it! (yes, this sometimes happens in IE8 when the html is invalid)
     */
    if (oldNode._wysihtml5) {
      return null;
    }
    oldNode._wysihtml5 = 1;

    if (oldNode.className === "wysihtml5-temp") {
      return null;
    }

    /**
     * IE is the only browser who doesn't include the namespace in the
     * nodeName, that's why we have to prepend it by ourselves
     * scopeName is a proprietary IE feature
     * read more here http://msdn.microsoft.com/en-us/library/ms534388(v=vs.85).aspx
     */
    if (scopeName && scopeName != "HTML") {
      nodeName = scopeName + ":" + nodeName;
    }
    /**
     * Repair node
     * IE is a bit bitchy when it comes to invalid nested markup which includes unclosed tags
     * A <p> doesn't need to be closed according HTML4-5 spec, we simply replace it with a <div> to preserve its content and layout
     */
    if ("outerHTML" in oldNode) {
      if (!browser.autoClosesUnclosedTags() &&
          oldNode.nodeName === "P" &&
          oldNode.outerHTML.slice(-4).toLowerCase() !== "</p>") {
        nodeName = "div";
      }
    }

    if (nodeName in tagRules) {
      rule = tagRules[nodeName];
      if (!rule || rule.remove) {
        return null;
      } else if (rule.unwrap) {
        return false;
      }

      // tests if type condition is met or node should be removed/unwrapped

      if (rule.one_of_type && !_testTypes(oldNode, currentRules, rule.one_of_type)) {
        return (rule.remove_action && rule.remove_action == "unwrap") ? false : null;
      }

      rule = typeof(rule) === "string" ? { rename_tag: rule } : rule;
    } else if (oldNode.firstChild) {
      rule = { rename_tag: DEFAULT_NODE_NAME };
    } else {
      // Remove empty unknown elements
      return null;
    }
    newNode = oldNode.ownerDocument.createElement(rule.rename_tag || nodeName);
    _handleAttributes(oldNode, newNode, rule);
    _handleStyles(oldNode, newNode, rule);
    oldNode = null;

    return newNode;
  }

  function _testTypes(oldNode, rules, types) {
    var definition, type;

    // do not interfere with placeholder span or pasting caret position is not maintained
    if (oldNode.nodeName === "SPAN" && oldNode.className === "_wysihtml5-temp-placeholder") {
      return true;
    }

    for (type in types) {
      if (types.hasOwnProperty(type) && rules.type_definitions && rules.type_definitions[type]) {
        definition = rules.type_definitions[type];
        if (_testType(oldNode, definition)) {
          return true;
        }
      }
    }
    return false;
  }

  function array_contains(a, obj) {
      var i = a.length;
      while (i--) {
         if (a[i] === obj) {
             return true;
         }
      }
      return false;
  }

  function _testType(oldNode, definition) {

    var nodeClasses = oldNode.getAttribute("class"),
        nodeStyles =  oldNode.getAttribute("style"),
        classesLength, s, s_corrected, a, attr, currentClass, styleProp;

    // test for classes, if one found return true
    if (nodeClasses && definition.classes) {
      nodeClasses = nodeClasses.replace(/^\s+/g, '').replace(/\s+$/g, '').split(WHITE_SPACE_REG_EXP);
      classesLength = nodeClasses.length;
      for (var i = 0; i < classesLength; i++) {
        if (definition.classes[nodeClasses[i]]) {
          return true;
        }
      }
    }

    // test for styles, if one found return true
    if (nodeStyles && definition.styles) {

      nodeStyles = nodeStyles.split(';');
      for (s in definition.styles) {
        if (definition.styles.hasOwnProperty(s)) {
          for (var sp = nodeStyles.length; sp--;) {
            styleProp = nodeStyles[sp].split(':');

            if (styleProp[0].replace(/\s/g, '').toLowerCase() === s) {
              if (definition.styles[s] === true || styleProp[1].replace(/\s/g, '').toLowerCase() === definition.styles[s]) {
                return true;
              }
            }
          }
        }
      }
    }

    // test for attributes in general against regex match
    if (definition.attrs) {
        for (a in definition.attrs) {
            if (definition.attrs.hasOwnProperty(a)) {
                attr = _getAttribute(oldNode, a);
                if (typeof(attr) === "string") {
                    if (attr.search(definition.attrs[a]) > -1) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
  }

  function _handleStyles(oldNode, newNode, rule) {
    var s;
    if(rule && rule.keep_styles) {
      for (s in rule.keep_styles) {
        if (rule.keep_styles.hasOwnProperty(s)) {
          if (s == "float") {
            // IE compability
            if (oldNode.style.styleFloat) {
              newNode.style.styleFloat = oldNode.style.styleFloat;
            }
            if (oldNode.style.cssFloat) {
              newNode.style.cssFloat = oldNode.style.cssFloat;
            }
           } else if (oldNode.style[s]) {
             newNode.style[s] = oldNode.style[s];
           }
        }
      }
    }
  }

  function _handleAttributes(oldNode, newNode, rule) {
    var attributes          = {},                         // fresh new set of attributes to set on newNode
        setClass            = rule.set_class,             // classes to set
        addClass            = rule.add_class,             // add classes based on existing attributes
        setAttributes       = rule.set_attributes,        // attributes to set on the current node
        checkAttributes     = rule.check_attributes,      // check/convert values of attributes
        allowedClasses      = currentRules.classes,
        i                   = 0,
        classes             = [],
        newClasses          = [],
        newUniqueClasses    = [],
        oldClasses          = [],
        classesLength,
        newClassesLength,
        currentClass,
        newClass,
        attributeName,
        newAttributeValue,
        method;

    if (setAttributes) {
      attributes = lang.object(setAttributes).clone();
    }

    if (checkAttributes) {
      for (attributeName in checkAttributes) {
        method = attributeCheckMethods[checkAttributes[attributeName]];
        if (!method) {
          continue;
        }
        var oldAttribute = _getAttribute(oldNode, attributeName);
        if (oldAttribute || (attributeName === "alt" && oldNode.nodeName == "IMG")) {
          newAttributeValue = method(oldAttribute);
          if (typeof(newAttributeValue) === "string") {
            attributes[attributeName] = newAttributeValue;
          }
        }
      }
    }

    if (setClass) {
      classes.push(setClass);
    }

    if (addClass) {
      for (attributeName in addClass) {
        method = addClassMethods[addClass[attributeName]];
        if (!method) {
          continue;
        }
        newClass = method(_getAttribute(oldNode, attributeName));
        if (typeof(newClass) === "string") {
          classes.push(newClass);
        }
      }
    }

    // make sure that wysihtml5 temp class doesn't get stripped out
    allowedClasses["_wysihtml5-temp-placeholder"] = 1;

    // add old classes last
    oldClasses = oldNode.getAttribute("class");
    if (oldClasses) {
      classes = classes.concat(oldClasses.split(WHITE_SPACE_REG_EXP));
    }
    classesLength = classes.length;
    for (; i<classesLength; i++) {
      currentClass = classes[i];
      if (allowedClasses[currentClass]) {
        newClasses.push(currentClass);
      }
    }

    // remove duplicate entries and preserve class specificity
    newClassesLength = newClasses.length;
    while (newClassesLength--) {
      currentClass = newClasses[newClassesLength];
      if (!lang.array(newUniqueClasses).contains(currentClass)) {
        newUniqueClasses.unshift(currentClass);
      }
    }

    if (newUniqueClasses.length) {
      attributes["class"] = newUniqueClasses.join(" ");
    }

    // set attributes on newNode
    for (attributeName in attributes) {
      // Setting attributes can cause a js error in IE under certain circumstances
      // eg. on a <img> under https when it's new attribute value is non-https
      // TODO: Investigate this further and check for smarter handling
      try {
        newNode.setAttribute(attributeName, attributes[attributeName]);
      } catch(e) {}
    }

    // IE8 sometimes loses the width/height attributes when those are set before the "src"
    // so we make sure to set them again
    if (attributes.src) {
      if (typeof(attributes.width) !== "undefined") {
        newNode.setAttribute("width", attributes.width);
      }
      if (typeof(attributes.height) !== "undefined") {
        newNode.setAttribute("height", attributes.height);
      }
    }
  }

  /**
   * IE gives wrong results for hasAttribute/getAttribute, for example:
   *    var td = document.createElement("td");
   *    td.getAttribute("rowspan"); // => "1" in IE
   *
   * Therefore we have to check the element's outerHTML for the attribute
   */
  // TODO: remove and use DOM helper instead.
  function _getAttribute(node, attributeName) {
    attributeName = attributeName.toLowerCase();
    var nodeName = node.nodeName;
    if (nodeName == "IMG" && attributeName == "src" && _isLoadedImage(node) === true) {
      // Get 'src' attribute value via object property since this will always contain the
      // full absolute url (http://...)
      // this fixes a very annoying bug in firefox (ver 3.6 & 4) and IE 8 where images copied from the same host
      // will have relative paths, which the sanitizer strips out (see attributeCheckMethods.url)
      return node.src;
    } else {
      return node.getAttribute(attributeName);
    }
  }

  /**
   * Check whether the given node is a proper loaded image
   * FIXME: Returns undefined when unknown (Chrome, Safari)
   */
  function _isLoadedImage(node) {
    try {
      return node.complete && !node.mozMatchesSelector(":-moz-broken");
    } catch(e) {
      if (node.complete && node.readyState === "complete") {
        return true;
      }
    }
  }

  var INVISIBLE_SPACE_REG_EXP = /\uFEFF/g;
  function _handleText(oldNode) {
    var nextSibling = oldNode.nextSibling;
    if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
      // Concatenate text nodes
      nextSibling.data = oldNode.data + nextSibling.data;
    } else {
      // \uFEFF = wysihtml5.INVISIBLE_SPACE (used as a hack in certain rich text editing situations)
      var data = oldNode.data.replace(INVISIBLE_SPACE_REG_EXP, "");
      return oldNode.ownerDocument.createTextNode(data);
    }
  }


  // ------------ attribute checks ------------ \\
  var attributeCheckMethods = {
    url: (function() {
      var REG_EXP = /^https?:\/\//i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),

    src: (function() {
      var REG_EXP = /^(\/|https?:\/\/)/i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),

    href: (function() {
      var REG_EXP = /^(\/|https?:\/\/|mailto:)/i;
      return function(attributeValue) {
        if (!attributeValue || !attributeValue.match(REG_EXP)) {
          return null;
        }
        return attributeValue.replace(REG_EXP, function(match) {
          return match.toLowerCase();
        });
      };
    })(),

    alt: (function() {
      var REG_EXP = /[^ a-z0-9_\-]/gi;
      return function(attributeValue) {
        if (!attributeValue) {
          return "";
        }
        return attributeValue.replace(REG_EXP, "");
      };
    })(),

    numbers: (function() {
      var REG_EXP = /\D/g;
      return function(attributeValue) {
        attributeValue = (attributeValue || "").replace(REG_EXP, "");
        return attributeValue || null;
      };
    })(),

    any: function(attributeValue) {
      return attributeValue;
    }
  };

  // ------------ class converter (converts an html attribute to a class name) ------------ \\
  var addClassMethods = {
    align_img: (function() {
      var mapping = {
        left:   "wysiwyg-float-left",
        right:  "wysiwyg-float-right"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),

    align_text: (function() {
      var mapping = {
        left:     "wysiwyg-text-align-left",
        right:    "wysiwyg-text-align-right",
        center:   "wysiwyg-text-align-center",
        justify:  "wysiwyg-text-align-justify"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),

    clear_br: (function() {
      var mapping = {
        left:   "wysiwyg-clear-left",
        right:  "wysiwyg-clear-right",
        both:   "wysiwyg-clear-both",
        all:    "wysiwyg-clear-both"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).toLowerCase()];
      };
    })(),

    size_font: (function() {
      var mapping = {
        "1": "wysiwyg-font-size-xx-small",
        "2": "wysiwyg-font-size-small",
        "3": "wysiwyg-font-size-medium",
        "4": "wysiwyg-font-size-large",
        "5": "wysiwyg-font-size-x-large",
        "6": "wysiwyg-font-size-xx-large",
        "7": "wysiwyg-font-size-xx-large",
        "-": "wysiwyg-font-size-smaller",
        "+": "wysiwyg-font-size-larger"
      };
      return function(attributeValue) {
        return mapping[String(attributeValue).charAt(0)];
      };
    })()
  };

  return parse;
})();

export { Parser };
