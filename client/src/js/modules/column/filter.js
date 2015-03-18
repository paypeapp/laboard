angular.module('laboard-frontend')
    .filter('orderIssues', [
        '$filter', '$rootScope',
        function () {
            return function(issues) {
                return issues.sort(function(a, b) {
					return b.sort - a.sort;
				});
            }
        }
    ]);
