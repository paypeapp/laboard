angular.module('laboard-frontend')
    .controller('ColumnController', [
        '$scope', '$rootScope', 'ColumnsRepository', '$modal', 'IssuesRepository', 'SocketFactory',
        function($scope, $rootScope, ColumnsRepository, $modal, IssuesRepository, SocketFactory) {
            $scope.drop = function(issue) {
                var from = issue.from;
                issue.from = from.title;
                issue.to = $scope.column.title;

                if (issue.from === issue.to) {
                    $scope.column.issues.push(issue);
                }

                if (issue.from === issue.to || !issue.to || !issue.from) return;

                $scope.column.issues.push(issue);

                IssuesRepository.move(issue)
                    .then(
                        function(issue) {
                            if (issue.theme) {
                                issue.before = issue.theme;
                                issue.after = null;
                                IssuesRepository.theme(issue);
                            }
                        },
                        function() {
                            from.issues.push(issue);

                            var key = $scope.column.issues.indexOf($scope.issue);
                            if (key > -1) {
                                $scope.column.issues.splice(key, 1);
                            }
                        }
                    );
            };

            $scope.move = function(step) {
                $scope.column.position += step;

                ColumnsRepository.move($scope.column)
                    .then(
                        function() {
                            $scope.columns.all.forEach(function(column) {
                                if(column === $scope.column) return;

                                if (column.position === $scope.column.position) {
                                    column.position += -step;

                                    ColumnsRepository.move(column)
                                        .then(
                                            function() {},
                                            function() {
                                                $scope.column.position += -step;
                                                column.position += step;
                                            }
                                        );
                                }
                            });
                        },
                        function() {
                            $scope.column.position += -step;
                        }
                    );
            };

            $scope.edit = function() {
                var column = $scope.column,
                    theme = $scope.column.theme;

                $modal
                    .open({
                        templateUrl: 'partials/column/modal.html',
                        controller: function($scope, $modalInstance) {
                            $scope.edit = true;
                            $scope.closable = parseInt(column.closable, 10) || false;
                            $scope.theme = column.theme || 'default';
                            $scope.title = column.title;

                            $scope.save = function () {
                                column.theme = $scope.theme;
                                column.closable = $scope.closable;

                                ColumnsRepository.edit(column)
                                    .then(
                                        $modalInstance.close,
                                        function() {
                                            column.theme = theme;

                                            $modalInstance.dismiss('error');
                                        }
                                    );
                            };
                        }
                    });
            };

            $scope.delete = function() {
                ColumnsRepository.remove($scope.column)
                    .then(function() {
                        $scope.column.issues.forEach($scope.unpin);
                    });
            };

            $scope.create = function() {
                $modal
                    .open({
                        templateUrl: 'partials/column/modal.html',
                        controller: function ($scope, $modalInstance) {
                            $scope.theme = 'default';
                            $scope.error = false;

                            $scope.save = function () {
                                var column = {
                                    title: $scope.title,
                                    theme: $scope.theme
                                };

                                ColumnsRepository.add(column)
                                    .then(
                                        $modalInstance.close,
                                        function () {
                                            $scope.error = true;
                                        }
                                    );
                            };
                        }
                    });
            };

            $scope.fill = function() {
                var issues = [];

                IssuesRepository.all.forEach(function(issue) {
                    if (issue.column === $scope.column.title.toLowerCase()) {
                        issues.push(issue);
                    }
                });

                $scope.column.issues = issues;
            };

            $scope.import = function() {
                var issues = [],
                    column = $scope.column;

                IssuesRepository.all.forEach(function(issue) {
                    if (!issue.column) issues.push(issue);
                });

                if (issues.length) {
                    $modal
                        .open({
                            templateUrl: 'partials/issue/modal.html',
                            controller: function($scope, $modalInstance) {
                                $scope.issues = issues;
                                $scope.import = function(issue) {
                                    if (!column.issues) column.issues = [];
                                    if (!issue.labels) issue.labels = [];

                                    issue.labels.push('column:' + column.title.toLowerCase());
                                    IssuesRepository.edit(issue)
                                        .then(function() {
                                            var index = issues.indexOf(issue);

                                            if (index > -1) {
                                                issues.splice(index, 1);
                                            }

                                            column.issues.push(issue);

                                            if (issues.length === 0) {
                                                $modalInstance.close();
                                            }
                                        });
                                }
                            }
                        });
                }
            };

            $scope.close = function(issue) {
                IssuesRepository.close(issue)
                    .then(function() {
                        var key = $scope.column.issues.indexOf(issue);

                        if (key > -1) {
                            $scope.column.issues.splice(key, 1);
                        }
                    });
            };

            $scope.unpin = function(issue) {
                issue.from = $scope.column.title;
                issue.to = null;

                IssuesRepository.move(issue)
                    .then(function() {
                        var key = $scope.column.issues.indexOf(issue);

                        if (key > -1) {
                            $scope.column.issues.splice(key, 1);
                        }
                    });
            };

            $scope.$watch(
                function() {
                    return IssuesRepository.all;
                },
                function() {
                    if (IssuesRepository.all) {
                        $scope.fill();
                    }
                }
            );

            $rootScope.socket.on(
                'issue.move',
                function(data) {
                    if (data.namespace + '/' + data.project !== $rootScope.project.path_with_namespace) return;

                    var index = [data.from, data.to, data.issue.column].indexOf($scope.column.title.toLowerCase());

                    if (index === -1) return;

                    $rootScope.$apply(
                        function() {
                            IssuesRepository.add(data.issue);

                            $scope.fill();
                        }
                    );
                }
            );

            $rootScope.socket.on(
                'column.move',
                function(data) {
                    if (data.namespace + '/' + data.project !== $rootScope.project.path_with_namespace) return;
                    if (data.column.title !== $scope.column.title) return;

                    $rootScope.$apply(
                        function() {
                            $scope.column.position = data.to;
                        }
                    );
                }
            );

            $rootScope.socket.on(
                'column.edit',
                function(data) {
                    if (data.namespace + '/' + data.project !== $rootScope.project.path_with_namespace) return;
                    if (data.column.title !== $scope.column.title) return;

                    $rootScope.$apply(
                        function() {
                            $scope.column.closable = data.column.closable || false;
                            $scope.column.theme = data.column.theme || 'default';
                        }
                    );
                }
            );

            $scope.$on(
                'issue.update',
                function(event, issue) {
                    var exists = false;

                    $scope.column.issues.forEach(function(i, key) {
                        if (i.id === issue.id) {
                            exists = true;

                            if (issue.column !== $scope.column.title.toLowerCase()) {
                                $scope.column.issues.splice(key, 1);
                            }
                        }
                    });

                    if (false === exists && issue.column === $scope.column.title.toLowerCase()) {
                        $scope.column.issues.push(issue);
                    }
                }
            );
        }
    ]);
