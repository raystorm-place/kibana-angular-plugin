define(function (require) {
  require('plugins/kibana-gravity/bower_components/ace-builds/src-min-noconflict/ace.js');
  require('plugins/kibana-gravity/bower_components/ace-builds/src-min-noconflict/mode-html.js');
  require('plugins/kibana-gravity/bower_components/ace-builds/src-min-noconflict/theme-monokai.js');
  require('plugins/kibana-gravity/bower_components/angular-ui-ace/ui-ace.min.js');
  require('plugins/kibana-gravity/gravity.less');

  // we also need to load the controller and used by the template
  require('plugins/kibana-gravity/gravity_controller');

  // register the provider with the visTypes registry so that other know it exists
  require('ui/registry/vis_types').register(GravityVisProvider);

  function GravityVisProvider(Private) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));

    // return the visType object, which kibana will use to display and configure new
    // Vis object of this type.
    return new TemplateVisType({
      name: 'gravity',
      title: 'Gravity widget',
      icon: 'fa-table',
      description: 'Useful for displaying gravity resulsts in dashboards.',
      template: require('plugins/kibana-gravity/gravity.html'),
      params: {
        editor: require('plugins/kibana-gravity/gravity_params.html')
      }
    });
  }

  // export the provider so that the visType can be required with Private()
  return GravityVisProvider;
});
