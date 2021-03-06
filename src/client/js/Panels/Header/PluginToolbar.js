/*globals define, WebGMEGlobal, $*/
/*jshint browser: true */
/**
 * @author rkereskenyi / https://github.com/rkereskenyi
 */

define(['js/Dialogs/PluginResults/PluginResultsDialog', 'common/util/guid'], function (PluginResultsDialog, GUID) {
    'use strict';

    var PluginToolbar,
        DEFAULT_ICON_CLASS = 'glyphicon glyphicon-cog',
        BADGE_BASE = $('<span class="label label-info"></span>');

    PluginToolbar = function (client) {
        this._client = client;
        this._results = [];
        this.$btnExecutePlugin = null;
        this._initialize();
    };

    PluginToolbar.prototype._initialize = function () {
        var self = this,
            toolbar = WebGMEGlobal.Toolbar,
            fillMenuItems,
            executePlugin,
            client = this._client,
            unreadResults = 0,
            BADGE_CLASS = 'label',
            showResults,
            setBadgeText,
            badge;

        setBadgeText = function (text) {
            self.$btnExecutePlugin.el.find('.' + BADGE_CLASS).text(text);
        };

        fillMenuItems = function () {
            var pluginIds = WebGMEGlobal.gmeConfig.plugin.displayAll ? WebGMEGlobal.allPlugins :
                    client.filterPlugins(WebGMEGlobal.allPlugins, WebGMEGlobal.State.getActiveObject()),
                executeClickFunction = function (data) {
                    executePlugin(data);
                },
                projectAccess = client.getProjectAccess();

            //clear dropdown
            self.$btnExecutePlugin.clear();

            //add read menu if needed
            if (self._results.length > 0) {
                self.$btnExecutePlugin.addButton({
                    title: 'Show results...',
                    text: 'Show results...',
                    clickFn: function () {
                        var resultId;
                        if (unreadResults === 1 && self._results.length > 0) {
                            resultId = self._results[0].__id;
                        }

                        showResults(resultId);
                    }
                });
                if (pluginIds.length > 0) {
                    self.$btnExecutePlugin.addDivider();
                }
            }

            //add plugin names
            pluginIds.forEach(function (pluginId) {
                var metadata = WebGMEGlobal.allPluginsMetadata[pluginId],
                    params = {
                        title: metadata.id + ' v' + metadata.version + ' - ' + metadata.description,
                        text: metadata.name,
                        data: metadata,
                        clickFn: executeClickFunction,
                        disabled: metadata.writeAccessRequired === true && projectAccess.write === false,
                        icon: $('<i class="plugin-icon"/>')
                    };

                if (metadata.icon.src) {
                    params.icon = $('<img/>', {
                        src: ['/plugin', metadata.id, metadata.id, metadata.icon.src].join('/')
                    });
                    params.icon.addClass(metadata.icon.class);
                } else if (metadata.icon.class) {
                    params.icon.addClass(metadata.icon.class);
                } else {
                    params.icon.addClass(DEFAULT_ICON_CLASS);
                }

                params.icon.addClass('plugin-icon');

                params.icon.css({
                    width: '14px',
                    'margin-right': '4px'
                });

                self.$btnExecutePlugin.addButton(params);
            });
        };

        executePlugin = function (data) {
            WebGMEGlobal.InterpreterManager.configureAndRun(data, function (result) {
                if (result === false) {
                    // Aborted in dialog.
                    return;
                }

                var metadata = WebGMEGlobal.allPluginsMetadata[result.pluginId],
                    msg = ' ' + metadata.id + ' ',
                    note;

                result.__unread = true;
                result.__id = GUID();

                self._results.splice(0, 0, result);
                self.$btnExecutePlugin.el.find('.btn').disable(false);
                unreadResults += 1;

                if (result.success) {
                    msg += 'finished with success! (click for details)';
                } else {
                    msg += 'failed (click for details), error: ' + result.error;
                }

                note = $.notify({
                    icon: metadata.icon.class ? metadata.icon.class : DEFAULT_ICON_CLASS,
                    message: msg
                },{
                    delay: 10000,
                    type: result.success ? 'success' : 'danger',
                    offset: {
                        x: 20,
                        y: 37
                    },
                    mouse_over: 'pause',
                    onClose: function () {
                        note.$ele.off();
                    }
                });

                note.$ele.css('cursor', 'pointer');

                note.$ele.on('click', function () {
                    if (self._results.length > 0) {
                        showResults(result.__id);
                    }

                    note.close();
                });

                if (unreadResults > 0) {
                    setBadgeText(unreadResults);
                }
            });
        };

        showResults = function (resultId) {
            var dialog = new PluginResultsDialog();
            dialog.show(client, self._results, resultId);
            unreadResults = 0;
            setBadgeText('');
        };

        /************** EXECUTE PLUG-IN BUTTON ****************/
        this.$btnExecutePlugin = toolbar.addDropDownButton(
            {
                title: 'Execute plug-in',
                icon: 'glyphicon glyphicon-play',
                menuClass: 'no-min-width',
                clickFn: function () {
                    fillMenuItems();
                }
            });

        this.$btnExecutePlugin.el.find('a > i').css({'margin-top': '0px'});

        badge = BADGE_BASE.clone();
        badge.insertAfter(this.$btnExecutePlugin.el.find('a > i'));
        badge.css('margin-left', '3px');
    };

    PluginToolbar.prototype.disableButtons = function (disable) {
        disable = disable && this._results.length === 0;
        this.$btnExecutePlugin.el.find('.btn').disable(disable);
    };

    return PluginToolbar;
});
