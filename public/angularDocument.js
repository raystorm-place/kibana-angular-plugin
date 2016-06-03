define(function (require) {
  require('plugins/kibana-angular-plugin/bower_components/ace-builds/src-min-noconflict/ace.js');
  require('plugins/kibana-angular-plugin/bower_components/ace-builds/src-min-noconflict/mode-html.js');
  require('plugins/kibana-angular-plugin/bower_components/ace-builds/src-min-noconflict/theme-monokai.js');
  require('plugins/kibana-angular-plugin/bower_components/angular-ui-ace/ui-ace.min.js');
  require('plugins/kibana-angular-plugin/angularDocument.less');
  require('plugins/kibana-angular-plugin/angularDocumentController');
  require('ui/registry/vis_types').register(AngularVisProvider);

  function AngularVisProvider(Private) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
    return new TemplateVisType({
      name: 'angularDocument',
      title: 'Angular Widget',
      icon: 'fa-html5',
      description: 'Display documents with AngularJS in dashboards.',
      template: require('plugins/kibana-angular-plugin/angularDocument.html'),
      params: {
        editor: require('plugins/kibana-angular-plugin/angularDocumentOptions.html')
      }
    });
  }
  return AngularVisProvider;
});
