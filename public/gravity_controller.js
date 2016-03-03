define(function (require) {

  require('ui/notify');

  var module = require('ui/modules').get('kibana/kibana-gravity', ['kibana']);
  module.controller('KbnGravityVisController', function ($scope, $sce, $route, config, Private, Notifier, AppState) {
    $scope.gravities = [];
    console.log("kibana-gravity:$scope");

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

    $scope.test = $route;

    var HitSortFn = Private(require('plugins/kibana/discover/_hit_sort_fn'));
    var notify = new Notifier({
      location: 'Discover'
    });
    //var $state = $scope.state = new AppState(getStateDefaults());

    $scope.searchSource = $route.current.locals.dash.searchSource;
    $scope.indexPattern = $scope.vis.indexPattern;
    $scope.searchSource.set('index', $scope.indexPattern);
    $scope.size = 10;
    $scope.opts = {
      // number of records to fetch, then paginate through
      sampleSize: config.get('discover:sampleSize'),
      // Index to match
      index: $scope.indexPattern.id,
      timefield: $scope.indexPattern.timeFieldName
    };

    $scope.searchSource.onBeginSegmentedFetch(function (segmented) {

      function flushResponseData() {
        $scope.hits = 0;
        $scope.faliures = [];
        $scope.rows = [];
        $scope.fieldCounts = {};
      }

      if (!$scope.rows) flushResponseData();

      var sort = ["time"];
      //var sort = $state.sort;
      var timeField = $scope.indexPattern.timeFieldName;
      var totalSize = $scope.size || $scope.opts.sampleSize;

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
        if (!_.isArray(sort)) return 'implicit';
        else if (sort[0] === '_score') return 'implicit';
        else if (sort[0] === timeField) return 'time';
        else return 'non-time';
      }());

      var sortFn = null;
      if (sortBy !== 'implicit') {
        sortFn = new HitSortFn(sort[1]);
      }

      if (sort[0] === '_score') segmented.setMaxSegments(1);
      segmented.setDirection(sortBy === 'time' ? (sort[1] || 'desc') : 'desc');
      segmented.setSortFn(sortFn);
      segmented.setSize($scope.opts.sampleSize);

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
        $scope.rows = merged.hits.hits.slice();
        $scope.gravities = [];
        for(var i = 0; i < $scope.rows.length; i++) {
          var hit = $scope.rows[i];
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
