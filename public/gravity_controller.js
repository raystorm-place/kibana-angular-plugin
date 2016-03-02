define(function (require) {
  var marked = require('marked');
  marked.setOptions({
    gfm: true, // Github-flavored markdown
    sanitize: true // Sanitize HTML tags
  });

  var module = require('ui/modules').get('kibana/kibana-gravity', ['kibana']);
  module.controller('KbnGravityVisController', function ($scope, $sce) {
    $scope.$watch('vis.params.gravity', function (html) {
      if (!html) return;
      $scope.html = $sce.trustAsHtml(marked(html));
    });
  });
});
