VERSION = $(shell cat version.txt)

JS_OUTPUT = "dist/wysihtml5x-${VERSION}.js"
JS_OUTPUT_WOTOOLS = "dist/wysihtml5x-${VERSION}-wotools.js"

OPEN = $(shell which xdg-open || which gnome-open || which open)

JS_FILES = src/wysihtml5.js \
  lib/rangy/rangy-core.js \
  lib/base/base.js \
  src/browser.js \
  src/lang/array.js \
  src/lang/dispatcher.js \
  src/lang/object.js \
  src/lang/string.js \
  src/dom/auto_link.js \
  src/dom/class.js \
  src/dom/contains.js \
  src/dom/convert_to_list.js \
  src/dom/copy_attributes.js \
  src/dom/copy_styles.js \
  src/dom/delegate.js \
  src/dom/get_as_dom.js \
  src/dom/get_parent_element.js \
  src/dom/get_style.js \
  src/dom/has_element_with_tag_name.js \
  src/dom/has_element_with_class_name.js \
  src/dom/insert.js \
  src/dom/insert_css.js \
  src/dom/observe.js \
  src/dom/parse.js \
  src/dom/remove_empty_text_nodes.js \
  src/dom/rename_element.js \
  src/dom/replace_with_child_nodes.js \
  src/dom/resolve_list.js \
  src/dom/sandbox.js \
  src/dom/contenteditable_area.js \
  src/dom/set_attributes.js \
  src/dom/set_styles.js \
  src/dom/simulate_placeholder.js \
  src/dom/text_content.js \
  src/dom/get_attribute.js \
  src/dom/table.js \
  src/dom/query.js \
  src/quirks/clean_pasted_html.js \
  src/quirks/ensure_proper_clearing.js \
  src/quirks/get_correct_inner_html.js \
  src/quirks/redraw.js \
  src/quirks/table_cells_selection.js\
  src/quirks/style_parser.js\
  src/selection/selection.js \
  src/selection/html_applier.js \
  src/commands.js \
  src/commands/bold.js \
  src/commands/createLink.js \
  src/commands/fontSize.js \
  src/commands/foreColor.js \
  src/commands/foreColorStyle.js \
  src/commands/bgColorStyle.js \
  src/commands/formatBlock.js \
  src/commands/formatInline.js \
  src/commands/insertHTML.js \
  src/commands/insertImage.js \
  src/commands/insertLineBreak.js \
  src/commands/insertOrderedList.js \
  src/commands/insertUnorderedList.js \
  src/commands/italic.js \
  src/commands/justifyCenter.js \
  src/commands/justifyLeft.js \
  src/commands/justifyRight.js \
  src/commands/justifyFull.js \
  src/commands/redo.js \
  src/commands/underline.js \
  src/commands/undo.js \
  src/commands/createTable.js\
  src/commands/mergeTableCells.js\
  src/commands/addTableCells.js\
  src/commands/deleteTableCells.js\
  src/undo_manager.js \
  src/views/view.js \
  src/views/composer.js \
  src/views/composer.style.js \
  src/views/composer.observe.js \
  src/views/synchronizer.js \
  src/views/textarea.js \
  src/toolbar/dialog.js \
  src/toolbar/speech.js \
  src/toolbar/toolbar.js \
  src/toolbar/dialog_createTable.js\
  src/toolbar/dialog_foreColorStyle.js\
  src/editor.js\
  src/keyboard/break_block_elements.js\
  src/keyboard/list_element_delete.js
  
JS_FILES_WOTOOLS = src/wysihtml5.js \
  lib/rangy/rangy-core.js \
  lib/base/base.js \
  src/browser.js \
  src/lang/array.js \
  src/lang/dispatcher.js \
  src/lang/object.js \
  src/lang/string.js \
  src/dom/auto_link.js \
  src/dom/class.js \
  src/dom/contains.js \
  src/dom/convert_to_list.js \
  src/dom/copy_attributes.js \
  src/dom/copy_styles.js \
  src/dom/delegate.js \
  src/dom/get_as_dom.js \
  src/dom/get_parent_element.js \
  src/dom/get_style.js \
  src/dom/has_element_with_tag_name.js \
  src/dom/has_element_with_class_name.js \
  src/dom/insert.js \
  src/dom/insert_css.js \
  src/dom/observe.js \
  src/dom/parse.js \
  src/dom/remove_empty_text_nodes.js \
  src/dom/rename_element.js \
  src/dom/replace_with_child_nodes.js \
  src/dom/resolve_list.js \
  src/dom/sandbox.js \
  src/dom/contenteditable_area.js \
  src/dom/set_attributes.js \
  src/dom/set_styles.js \
  src/dom/simulate_placeholder.js \
  src/dom/text_content.js \
  src/dom/get_attribute.js \
  src/dom/table.js \
  src/dom/query.js \
  src/quirks/clean_pasted_html.js \
  src/quirks/ensure_proper_clearing.js \
  src/quirks/get_correct_inner_html.js \
  src/quirks/redraw.js \
  src/quirks/table_cells_selection.js\
  src/quirks/style_parser.js\
  src/selection/selection.js \
  src/selection/html_applier.js \
  src/commands.js \
  src/commands/bold.js \
  src/commands/createLink.js \
  src/commands/fontSize.js \
  src/commands/foreColor.js \
  src/commands/foreColorStyle.js \
  src/commands/bgColorStyle.js \
  src/commands/formatBlock.js \
  src/commands/formatInline.js \
  src/commands/insertHTML.js \
  src/commands/insertImage.js \
  src/commands/insertLineBreak.js \
  src/commands/insertOrderedList.js \
  src/commands/insertUnorderedList.js \
  src/commands/italic.js \
  src/commands/justifyCenter.js \
  src/commands/justifyLeft.js \
  src/commands/justifyRight.js \
  src/commands/justifyFull.js \
  src/commands/redo.js \
  src/commands/underline.js \
  src/commands/undo.js \
  src/commands/createTable.js\
  src/commands/mergeTableCells.js\
  src/commands/addTableCells.js\
  src/commands/deleteTableCells.js\
  src/undo_manager.js \
  src/views/view.js \
  src/views/composer.js \
  src/views/composer.style.js \
  src/views/composer.observe.js \
  src/views/synchronizer.js \
  src/views/textarea.js \
  src/editor.js

all: bundle wotoolbar minify 

bundle:
	@@echo "Bundling..."
	@@touch ${JS_OUTPUT}
	@@rm ${JS_OUTPUT}
	@@cat ${JS_FILES} >> ${JS_OUTPUT}
	@@cat ${JS_OUTPUT} | sed "s/@VERSION/${VERSION}/" > "${JS_OUTPUT}.tmp"
	@@mv "${JS_OUTPUT}.tmp" ${JS_OUTPUT}

minify:
	@@echo "Minifying... (this requires node.js)"
	@@node build/minify.js ${JS_OUTPUT}
	@@echo "Done."
    
wotoolbar:
	@@echo "Bundling..."
	@@touch ${JS_OUTPUT_WOTOOLS}
	@@rm ${JS_OUTPUT_WOTOOLS}
	@@cat ${JS_FILES_WOTOOLS} >> ${JS_OUTPUT_WOTOOLS}
	@@cat ${JS_OUTPUT_WOTOOLS} | sed "s/@VERSION/${VERSION}/" > "${JS_OUTPUT}-wotools.tmp"
	@@mv "${JS_OUTPUT}-wotools.tmp" ${JS_OUTPUT_WOTOOLS}
	@@echo "Minifying... (this requires node.js)"
	@@node build/minify.js ${JS_OUTPUT_WOTOOLS}
	@@echo "Done."
    

unittest:
	@@${OPEN} test/index.html

clean:
	@@git co ${JS_OUTPUT}
