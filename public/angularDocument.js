define(function (require) {
  require('plugins/kibana-angular-plugin/bower_components/ace-builds/src-min-noconflict/ace.js');
  require('plugins/kibana-angular-plugin/bower_components/ace-builds/src-min-noconflict/mode-html.js');
  require('plugins/kibana-angular-plugin/bower_components/ace-builds/src-min-noconflict/theme-monokai.js');
  require('plugins/kibana-angular-plugin/bower_components/angular-ui-ace/ui-ace.min.js');
  require('plugins/kibana-angular-plugin/angularDocument.less');

  // we also need to load the controller and used by the template
  require('plugins/kibana-angular-plugin/angularDocumentController');

  // register the provider with the visTypes registry so that other know it exists
  require('ui/registry/vis_types').register(AngularVisProvider);

  function AngularVisProvider(Private) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));

    // return the visType object, which kibana will use to display and configure new
    // Vis object of this type.
    return new TemplateVisType({
      name: 'angularDocument',
      title: 'Angular Widget',
      icon: 'fa-table',
      description: 'Display documents with AngularJS in dashboards.',
      template: require('plugins/kibana-angular-plugin/angularDocument.html'),
      params: {
        editor: require('plugins/kibana-angular-plugin/angularDocumentOptions.html')
      }
    });
  }

  // export the provider so that the visType can be required with Private()
  return AngularVisProvider;
});
