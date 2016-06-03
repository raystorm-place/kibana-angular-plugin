define(function (require) {
  var angular = require('angular');
  var getSort = require('ui/doc_table/lib/get_sort');
  var dateMath = require('ui/utils/dateMath');

  require('ui/notify');

  var module = require('ui/modules').get('kibana/kibana-angular-plugin', ['kibana', 'ui.ace']);
  module.service('docHelper', [function () {
    this.elasticHitToDoc = function(hit) {
      var doc = {
        id: hit["_id"],
        fields: {}
      };

      Object.keys(hit._source).forEach(function (field) {
        doc.fields[field] = hit["_source"][field];
      });

      return doc;
    };
  }]);

  module.controller('KbnAngularEditController', ['$scope', function($scope) {
    $scope.aceLoaded = function(_editor){
      _editor.$blockScrolling = Infinity;
    };
  }]);

  module.controller('KbnAngularVisController', function ($scope, $compile, $interpolate, $sce, courier, Private, Promise, Notifier,
                                                         docHelper, savedSearches, timefilter, AppState) {
    var HitSortFn = Private(require('plugins/kibana/discover/_hit_sort_fn'));
    var notify = new Notifier({location: 'Angular Widget'});
    var queryFilter = Private(require('ui/filter_bar/query_filter'));
    var rootSearchSource = require('ui/courier/data_source/_root_search_source');

    $scope.html = '<img src="{{doc.fields.image}}" width="120" /> {{doc.id}}';
    $scope.renderTemplate = function(doc) {
      var html = $interpolate($scope.html)({doc: doc});
      return $sce.trustAsHtml(html);
    };
    $scope.$watch('vis.params.html', function (html) {
      if (!html) return;
      $scope.html = html;
    });

    $scope.hits = 0;
    $scope.docs = [];
    $scope.indexPattern = $scope.vis.indexPattern;
    $scope.state = new AppState();
    $scope.state.index = $scope.indexPattern.id;
    $scope.state.sort = getSort.array($scope.state.sort, $scope.indexPattern);
    $scope.searchSource = null;
    $scope.opts = {
      sort: getSort.array(["time", "desc"], $scope.indexPattern),
      size: 10,
      timefield: $scope.indexPattern.timeFieldName
    };

    $scope.getSearchSource = Promise.method(function () {
      return savedSearches.get($scope.state.index)
          .then(function (savedSearch) {
            var searchSource = savedSearch.searchSource;
            return $scope.initSearchSource(searchSource);
          }).catch(function(e){
            var searchSource = Private(rootSearchSource).get();
            return $scope.initSearchSource(searchSource);
          });
    });

    $scope.initSearchSource = function (searchSource) {
      searchSource.onBeginSegmentedFetch(function (segmented) {
        function flushResponseData() {
          $scope.hits = 0;
          $scope.docs = [];
        }

        /**
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

        segmented.on('segment', notify.timed('handle each segment', function (segmentResp) {
          if (segmentResp._shards.failed > 0) {
            $scope.failures = _.union($scope.failures, segmentResp._shards.failures);
            $scope.failures = _.uniq($scope.failures, false, function (failure) {
              return failure.index + failure.shard + failure.reason;
            });
          }
        }));

        segmented.on('mergedSegment', function (resp) {
          $scope.hits = resp.hits.total;
          $scope.docs = [];

          var rows = resp.hits.hits.slice();
          for (var i = 0; i < rows.length; i++) {
            var hit = rows[i];
            var doc = docHelper.elasticHitToDoc(hit);
            $scope.docs.push(doc);
          }
        });

        segmented.on('complete', function () {
          if ($scope.fetchStatus.hitCount === 0) {
            flushResponseData();
          }

          $scope.fetchStatus = null;
        });
      }).catch(notify.fatal);
      return searchSource;
    };

    $scope.updateSearchSource = Promise.method(function () {
      $scope.searchSource
          .set('index', $scope.indexPattern)
          .query(!$scope.state.query ? null : $scope.state.query)
          .set('filter', queryFilter.getFilters())
          .sort(getSort($scope.state.sort, $scope.indexPattern))
          .size($scope.opts.size);
    });

    var init = _.once(function () {
      $scope.updateSearchSource()
          .then(function () {
            $scope.$listen(timefilter, 'fetch', function () {
              $scope.fetch();
            });

            $scope.$watchCollection('state.sort', function (sort) {
              if (!sort) return;

              // get the current sort from {key: val} to ["key", "val"];
              var currentSort = _.pairs($scope.searchSource.get('sort')).pop();

              // if the searchSource doesn't know, tell it so
              if (!angular.equals(sort, currentSort)) $scope.fetch();
            });

            // update data source when filters update
            $scope.$listen(queryFilter, 'update', function () {
              return $scope.updateSearchSource().then(function () {
              });
            });

            // update data source when hitting forward/back and the query changes
            $scope.$listen($scope.state, 'fetch_with_changes', function (diff) {
              if (diff.indexOf('query') >= 0) $scope.fetch();
            });

            // fetch data when filters fire fetch event
            $scope.$listen(queryFilter, 'fetch', $scope.fetch);

            $scope.$watch('opts.timefield', function (timefield) {
              timefilter.enabled = !!timefield;
            });

            $scope.$watch('state.interval', function (interval, oldInterval) {
              if (interval !== oldInterval && interval === 'auto') {
                $scope.showInterval = false;
              }
              $scope.fetch();
            });

            $scope.searchSource.onError(function (err) {
              notify.error(err);
            }).catch(notify.fatal);

            return Promise.resolve($scope.opts.timefield)
                .then(function () {
                  init.complete = true;
                  $scope.state.replace();
                });
          });
    });

    $scope.fetch = function () {
      // ignore requests to fetch before the app inits
      if (!init.complete) return;

      $scope.updateSearchSource()
          .then(function () {
            return courier.fetch();
          })
          .catch(notify.error);
    };

    // Init
    $scope.getSearchSource().then(function (searchSource) {
      $scope.searchSource = searchSource;

      init();
    });
  });
});
