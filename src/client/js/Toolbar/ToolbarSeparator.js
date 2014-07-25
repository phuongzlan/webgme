/*globals define, _, requirejs, WebGMEGlobal*/

/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 * @author nabana / https://github.com/nabana
 */

define(['./ButtonBase',
        './ToolbarItemBase'], function (buttonBase,
                                        ToolbarItemBase) {

    "use strict";

    var ToolbarSeparator,
        EL_BASE = $('<div class="separator"></div>');

    ToolbarSeparator = function () {
        this.el = EL_BASE.clone();
    };

    _.extend(ToolbarSeparator.prototype, ToolbarItemBase.prototype);

    return ToolbarSeparator;
});