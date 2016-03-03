define(function (require) {
  var getSort = require('ui/doc_table/lib/get_sort');

  require('ui/notify');

  var module = require('ui/modules').get('kibana/kibana-gravity', ['kibana']);
  module.controller('KbnGravityVisController', function ($scope, $sce, $route, config, Private, Notifier) {
    $scope.hits = 0;
    $scope.gravities = [];
    $scope.route = $route;

    var elasticHitToGravity = function(hit) {
      var gravity = {
        id: hit["_id"],
        fields: {}
      };

      Object.keys(hit._source).forEach(function (field) {
        gravity.fields[field] = hit["_source"][field];
      });

      return gravity;
    };

    var HitSortFn = Private(require('plugins/kibana/discover/_hit_sort_fn'));
    var notify = new Notifier({
      location: 'Dashboard'
    });

    $scope.searchSource = $route.current.locals.dash.searchSource;
    $scope.indexPattern = $scope.vis.indexPattern;
    $scope.searchSource.set('index', $scope.indexPattern);
    $scope.opts = {
      query: $scope.searchSource.get('query') || '',
      sort: getSort.array(["time", "desc"], $scope.indexPattern),
      index: $scope.indexPattern.id,
      filters: _.cloneDeep($scope.searchSource.getOwn('filter')),
      size: 10
    };

    $scope.searchSource.onBeginSegmentedFetch(function (segmented) {
      function flushResponseData() {
        $scope.hits = 0;
        $scope.gravities = [];
      }

      if (!$scope.gravities) flushResponseData();

      /**
       * Basically an emum.
       *
       * opts:
       *   "time" - sorted by the timefield
       *   "non-time" - explicitly sorted by a non-time field, NOT THE SAME AS `sortBy !== "time"`
       *   "implicit" - no sorting set, NOT THE SAME AS "non-time"
       *
       * @type {String}
       */
      var sortBy = (function () {
        if (!_.isArray($scope.opts.sort)) return 'implicit';
        else if ($scope.opts.sort[0] === '_score') return 'implicit';
        else if ($scope.opts.sort[0] === $scope.indexPattern.timeFieldName) return 'time';
        else return 'non-time';
      }());

      var sortFn = null;
      if (sortBy !== 'implicit') {
        sortFn = new HitSortFn($scope.opts.sort[1]);
      }

      if ($scope.opts.sort[0] === '_score') segmented.setMaxSegments(1);
      segmented.setDirection(sortBy === 'time' ? ($scope.opts.sort[1] || 'desc') : 'desc');
      segmented.setSortFn(sortFn);
      segmented.setSize($scope.opts.size);

      // triggered when the status updated
      segmented.on('status', function (status) {
        $scope.fetchStatus = status;
      });

      segmented.on('first', function () {
        flushResponseData();
      });

      segmented.on('segment', notify.timed('handle each segment', function (resp) {
        if (resp._shards.failed > 0) {
          $scope.failures = _.union($scope.failures, resp._shards.failures);
          $scope.failures = _.uniq($scope.failures, false, function (failure) {
            return failure.index + failure.shard + failure.reason;
          });
        }
      }));

      segmented.on('mergedSegment', function (merged) {
        $scope.mergedEsResp = merged;
        $scope.hits = merged.hits.total;

        // the merge rows, use a new array to help watchers
        var rows = merged.hits.hits.slice();
        $scope.gravities = [];
        for(var i = 0; i < rows.length; i++) {
          var hit = rows[i];
          var gravity = elasticHitToGravity(hit);
          $scope.gravities.push(gravity);
        }
      });

      segmented.on('complete', function () {
        if ($scope.fetchStatus.hitCount === 0) {
          flushResponseData();
        }

        $scope.fetchStatus = null;
      });
    }).catch(notify.fatal);

  });
});
