define(function (require) {
  var module = require('ui/modules').get('kibana/kibana-gravity', ['kibana']);
  module.controller('KbnGravityVisController', function ($scope, $sce) {
    $scope.$watch('vis.params.gravity', function (html) {
      if (!html) return;
      $scope.html = $sce.trustAsHtml(html);
    });
  });
});
